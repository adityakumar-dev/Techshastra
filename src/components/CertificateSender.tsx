import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
    Upload, Plus, Trash2, Eye, Send, FileSpreadsheet, GripVertical,
    Type, PenLine, Download, ChevronLeft, ChevronRight, Loader2, X
} from "lucide-react";
import * as XLSX from "xlsx";
import emailjs from "@emailjs/browser";
import { generateVerificationId, recordCertificatesBatch, createCertificateJob, updateCertificateJobProgress } from "@/lib/services/certificateService";
import type { CertificateInsert } from "@/lib/services/certificateService";

// ─── TYPES ───────────────────────────────────────────────────────────
interface TextField {
    id: string;
    label: string;       // field name e.g. "Name"
    x: number;
    y: number;
    fontSize: number;
    fontFamily: string;
    color: string;
    alignment: CanvasTextAlign;
    bold: boolean;
    width: number;       // max text-box width
}

interface SignatureField {
    x: number;
    y: number;
    width: number;
    height: number;
    image: HTMLImageElement | null;
    dataUrl: string;
}

interface DataRow {
    [key: string]: string;
}

// ─── CONSTANTS ───────────────────────────────────────────────────────
const FONT_CATEGORIES: { label: string; fonts: string[] }[] = [
    {
        label: "── Standard ──",
        fonts: ["Arial", "Times New Roman", "Georgia", "Courier New", "Verdana", "Trebuchet MS", "Impact", "Poppins", "Inter", "Sora"]
    },
    {
        label: "── Hindi / Devanagari ──",
        fonts: ["Noto Sans Devanagari", "Tiro Devanagari Hindi", "Hind", "Baloo 2", "Mukta"]
    },
    {
        label: "── Cursive / Script ──",
        fonts: ["Dancing Script", "Great Vibes", "Pacifico", "Satisfy", "Sacramento", "Alex Brush", "Allura", "Marck Script", "Playball", "Cookie"]
    },
    {
        label: "── Handwritten ──",
        fonts: ["Caveat", "Kalam", "Indie Flower", "Shadows Into Light", "Patrick Hand", "Amatic SC", "Permanent Marker", "Rock Salt"]
    }
];

const ALL_FONTS = FONT_CATEGORIES.flatMap(c => c.fonts);

const CANVAS_MAX_W = 900;

// ─── COMPONENT ───────────────────────────────────────────────────────
const CertificateSender = () => {
    const { toast } = useToast();

    // Template
    const [templateImg, setTemplateImg] = useState<HTMLImageElement | null>(null);
    const [templateDataUrl, setTemplateDataUrl] = useState<string>("");

    // Canvas
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [canvasW, setCanvasW] = useState(CANVAS_MAX_W);
    const [canvasH, setCanvasH] = useState(600);
    const [scale, setScale] = useState(1);

    // Text fields on canvas
    const [fields, setFields] = useState<TextField[]>([]);
    const [selectedField, setSelectedField] = useState<string | null>(null);
    const [dragging, setDragging] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Signature
    const [signature, setSignature] = useState<SignatureField>({
        x: 0, y: 0, width: 150, height: 60, image: null, dataUrl: ""
    });
    const [draggingSig, setDraggingSig] = useState(false);
    const [sigDragOffset, setSigDragOffset] = useState({ x: 0, y: 0 });

    // Data rows
    const [dataRows, setDataRows] = useState<DataRow[]>([]);
    const [previewIdx, setPreviewIdx] = useState(0);

    // Email config
    const [emailConfig, setEmailConfig] = useState({
        serviceId: "", templateId: "", publicKey: "", emailField: ""
    });
    const [sending, setSending] = useState(false);
    const [sendProgress, setSendProgress] = useState(0);

    // ─── TEMPLATE UPLOAD ─────────────────────────────────────────────
    const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const sc = Math.min(CANVAS_MAX_W / img.width, 1);
                setScale(sc);
                setCanvasW(Math.round(img.width * sc));
                setCanvasH(Math.round(img.height * sc));
                setTemplateImg(img);
                setTemplateDataUrl(reader.result as string);
                toast({ title: "Template Loaded", description: `${img.width}×${img.height}px` });
            };
            img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
    };

    // ─── SIGNATURE UPLOAD ────────────────────────────────────────────
    const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                setSignature(prev => ({
                    ...prev, image: img, dataUrl: reader.result as string,
                    x: canvasW / 2 - 75, y: canvasH - 100
                }));
                toast({ title: "Signature Loaded" });
            };
            img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
    };

    // ─── ADD / REMOVE FIELDS ────────────────────────────────────────
    const addField = () => {
        const newField: TextField = {
            id: `field_${Date.now()}`,
            label: `Field ${fields.length + 1}`,
            x: canvasW / 2, y: 100 + fields.length * 50,
            fontSize: 28, fontFamily: "Arial", color: "#000000",
            alignment: "center", bold: true, width: 300
        };
        setFields(prev => [...prev, newField]);
        setSelectedField(newField.id);
    };

    const removeField = (id: string) => {
        setFields(prev => prev.filter(f => f.id !== id));
        if (selectedField === id) setSelectedField(null);
    };

    const updateField = (id: string, updates: Partial<TextField>) => {
        setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    // ─── EXCEL IMPORT ────────────────────────────────────────────────
    const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const data = new Uint8Array(evt.target?.result as ArrayBuffer);
            const wb = XLSX.read(data, { type: "array" });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const json: DataRow[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
            if (json.length === 0) {
                toast({ title: "Empty File", description: "No data found.", variant: "destructive" });
                return;
            }
            setDataRows(json);
            setPreviewIdx(0);

            // Auto-create fields from column headers if none exist
            if (fields.length === 0) {
                const cols = Object.keys(json[0]).filter(k => k.toLowerCase() !== "email");
                const newFields: TextField[] = cols.map((col, i) => ({
                    id: `field_${Date.now()}_${i}`,
                    label: col,
                    x: canvasW / 2,
                    y: 150 + i * 60,
                    fontSize: col.toLowerCase() === "name" ? 36 : 24,
                    fontFamily: "Arial",
                    color: "#000000",
                    alignment: "center" as CanvasTextAlign,
                    bold: col.toLowerCase() === "name",
                    width: 400
                }));
                setFields(newFields);
            }

            // Auto detect email column
            const emailCol = Object.keys(json[0]).find(k => k.toLowerCase().includes("email"));
            if (emailCol) {
                setEmailConfig(prev => ({ ...prev, emailField: emailCol }));
            }

            toast({
                title: "Excel Imported",
                description: `${json.length} rows, ${Object.keys(json[0]).length} columns`
            });
        };
        reader.readAsArrayBuffer(file);
    };

    // ─── MANUAL DATA ROW ────────────────────────────────────────────
    const addManualRow = () => {
        const row: DataRow = {};
        fields.forEach(f => { row[f.label] = ""; });
        row["email"] = "";
        setDataRows(prev => [...prev, row]);
    };

    const updateRowValue = (rowIdx: number, key: string, value: string) => {
        setDataRows(prev => prev.map((r, i) => i === rowIdx ? { ...r, [key]: value } : r));
    };

    const removeRow = (idx: number) => {
        setDataRows(prev => prev.filter((_, i) => i !== idx));
        if (previewIdx >= dataRows.length - 1) setPreviewIdx(Math.max(0, dataRows.length - 2));
    };

    // ─── CANVAS RENDERING ───────────────────────────────────────────
    const renderCanvas = useCallback((previewData?: DataRow) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, canvasW, canvasH);

        // Draw template
        if (templateImg) {
            ctx.drawImage(templateImg, 0, 0, canvasW, canvasH);
        } else {
            // Placeholder background
            ctx.fillStyle = "#1a1a2e";
            ctx.fillRect(0, 0, canvasW, canvasH);
            ctx.fillStyle = "#ffffff40";
            ctx.font = "24px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Upload a certificate template above", canvasW / 2, canvasH / 2);
        }

        // Draw text fields
        fields.forEach(f => {
            const text = previewData ? (previewData[f.label] || `[${f.label}]`) : `[${f.label}]`;
            ctx.font = `${f.bold ? "bold " : ""}${f.fontSize}px ${f.fontFamily}`;
            ctx.fillStyle = f.color;
            ctx.textAlign = f.alignment;
            ctx.textBaseline = "middle";
            ctx.fillText(text, f.x, f.y, f.width);

            // Selection indicator
            if (f.id === selectedField) {
                ctx.strokeStyle = "#6366f1";
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 3]);
                const metrics = ctx.measureText(text);
                const tw = Math.min(metrics.width, f.width);
                let rx = f.x - tw / 2;
                if (f.alignment === "left") rx = f.x;
                if (f.alignment === "right") rx = f.x - tw;
                ctx.strokeRect(rx - 8, f.y - f.fontSize / 2 - 4, tw + 16, f.fontSize + 8);
                ctx.setLineDash([]);
            }
        });

        // Draw signature
        if (signature.image) {
            ctx.drawImage(signature.image, signature.x, signature.y, signature.width, signature.height);

            // selection indicator for sig
            if (draggingSig) {
                ctx.strokeStyle = "#6366f1";
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 3]);
                ctx.strokeRect(signature.x - 2, signature.y - 2, signature.width + 4, signature.height + 4);
                ctx.setLineDash([]);
            }
        }
    }, [canvasW, canvasH, templateImg, fields, selectedField, signature, draggingSig]);

    useEffect(() => {
        const previewData = dataRows.length > 0 ? dataRows[previewIdx] : undefined;
        renderCanvas(previewData);
    }, [renderCanvas, dataRows, previewIdx]);

    // ─── CANVAS MOUSE HANDLERS ──────────────────────────────────────
    const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const pos = getCanvasPos(e);

        // Check signature hit
        if (signature.image &&
            pos.x >= signature.x && pos.x <= signature.x + signature.width &&
            pos.y >= signature.y && pos.y <= signature.y + signature.height) {
            setDraggingSig(true);
            setSigDragOffset({ x: pos.x - signature.x, y: pos.y - signature.y });
            setSelectedField(null);
            return;
        }

        // Check field hit
        for (const f of [...fields].reverse()) {
            const halfH = f.fontSize / 2 + 4;
            const halfW = f.width / 2 + 8;
            let cx = f.x;
            if (f.alignment === "left") cx = f.x + halfW;
            if (f.alignment === "right") cx = f.x - halfW;

            if (pos.x >= cx - halfW && pos.x <= cx + halfW &&
                pos.y >= f.y - halfH && pos.y <= f.y + halfH) {
                setDragging(f.id);
                setDragOffset({ x: pos.x - f.x, y: pos.y - f.y });
                setSelectedField(f.id);
                return;
            }
        }
        setSelectedField(null);
    };

    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const pos = getCanvasPos(e);

        if (dragging) {
            updateField(dragging, {
                x: Math.max(0, Math.min(canvasW, pos.x - dragOffset.x)),
                y: Math.max(0, Math.min(canvasH, pos.y - dragOffset.y))
            });
        }
        if (draggingSig) {
            setSignature(prev => ({
                ...prev,
                x: Math.max(0, Math.min(canvasW - prev.width, pos.x - sigDragOffset.x)),
                y: Math.max(0, Math.min(canvasH - prev.height, pos.y - sigDragOffset.y))
            }));
        }
    };

    const handleCanvasMouseUp = () => {
        setDragging(null);
        setDraggingSig(false);
    };

    // ─── GENERATE CERTIFICATE IMAGE ─────────────────────────────────
    const generateCertImage = (row: DataRow): Promise<Blob> => {
        return new Promise((resolve) => {
            // Create off-screen canvas at full resolution
            const offCanvas = document.createElement("canvas");
            const w = templateImg ? templateImg.width : canvasW;
            const h = templateImg ? templateImg.height : canvasH;
            offCanvas.width = w;
            offCanvas.height = h;
            const ctx = offCanvas.getContext("2d")!;
            const fullScale = w / canvasW;

            if (templateImg) ctx.drawImage(templateImg, 0, 0, w, h);

            fields.forEach(f => {
                const text = row[f.label] || "";
                ctx.font = `${f.bold ? "bold " : ""}${f.fontSize * fullScale}px ${f.fontFamily}`;
                ctx.fillStyle = f.color;
                ctx.textAlign = f.alignment;
                ctx.textBaseline = "middle";
                ctx.fillText(text, f.x * fullScale, f.y * fullScale, f.width * fullScale);
            });

            if (signature.image) {
                ctx.drawImage(signature.image,
                    signature.x * fullScale, signature.y * fullScale,
                    signature.width * fullScale, signature.height * fullScale);
            }

            offCanvas.toBlob(blob => resolve(blob!), "image/png");
        });
    };

    // ─── DOWNLOAD SINGLE CERTIFICATE ────────────────────────────────
    const downloadCertificate = async (row: DataRow, idx: number, format: "png" | "pdf" = "png") => {
        const blob = await generateCertImage(row);
        const name = row.Name || row.name || `${idx + 1}`;

        if (format === "pdf") {
            // Create a PDF from the image using a simple canvas-to-PDF approach
            const img = new Image();
            const url = URL.createObjectURL(blob);
            img.onload = () => {
                const pdfCanvas = document.createElement("canvas");
                // A4 ratio at 150 DPI
                const pdfW = img.width;
                const pdfH = img.height;
                pdfCanvas.width = pdfW;
                pdfCanvas.height = pdfH;
                const pCtx = pdfCanvas.getContext("2d")!;
                pCtx.fillStyle = "#ffffff";
                pCtx.fillRect(0, 0, pdfW, pdfH);
                pCtx.drawImage(img, 0, 0, pdfW, pdfH);

                // Use printable window approach for PDF
                const dataUrl = pdfCanvas.toDataURL("image/png");
                const printWindow = window.open("", "_blank");
                if (printWindow) {
                    printWindow.document.write(`
                        <html><head><title>Certificate - ${name}</title>
                        <style>
                            @page { size: landscape; margin: 0; }
                            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: white; }
                            img { max-width: 100%; max-height: 100vh; }
                        </style></head>
                        <body><img src="${dataUrl}" /></body></html>
                    `);
                    printWindow.document.close();
                    setTimeout(() => {
                        printWindow.print();
                    }, 500);
                }
                URL.revokeObjectURL(url);
            };
            img.src = url;
        } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `certificate_${name}.png`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    // ─── BULK DOWNLOAD ALL ──────────────────────────────────────────
    const downloadAllCertificates = async (format: "png" | "pdf") => {
        if (dataRows.length === 0) {
            toast({ title: "No Data", description: "Add recipients first.", variant: "destructive" });
            return;
        }
        setSending(true);
        setSendProgress(0);
        for (let i = 0; i < dataRows.length; i++) {
            await downloadCertificate(dataRows[i], i, format);
            setSendProgress(Math.round(((i + 1) / dataRows.length) * 100));
            // Small delay between downloads to prevent browser blocking
            await new Promise(r => setTimeout(r, 300));
        }
        setSending(false);
        toast({ title: "Download Complete", description: `${dataRows.length} certificates downloaded as ${format.toUpperCase()}.` });
    };

    // ─── SEND EMAILS ────────────────────────────────────────────────
    const sendCertificates = async () => {
        if (!emailConfig.serviceId || !emailConfig.templateId || !emailConfig.publicKey) {
            toast({ title: "Missing EmailJS Config", description: "Please fill all EmailJS fields.", variant: "destructive" });
            return;
        }
        if (!emailConfig.emailField) {
            toast({ title: "No Email Field", description: "Select which column has email addresses.", variant: "destructive" });
            return;
        }
        if (dataRows.length === 0) {
            toast({ title: "No Data", description: "Add recipients first.", variant: "destructive" });
            return;
        }

        setSending(true);
        setSendProgress(0);
        let success = 0;
        let failed = 0;
        const certRecords: CertificateInsert[] = [];
        const errorMessages: string[] = [];

        // Create a job record in Supabase (non-blocking — fails silently if not configured)
        const job = await createCertificateJob(dataRows.length).catch(() => null);

        for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];
            const email = row[emailConfig.emailField];
            if (!email) { failed++; continue; }

            const recipientName = row.Name || row.name || "Recipient";
            const eventName = row.Event || row.event || row.EventName || "Certificate";
            const verificationId = generateVerificationId();

            try {
                const blob = await generateCertImage(row);
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
                    reader.readAsDataURL(blob);
                });

                await emailjs.send(emailConfig.serviceId, emailConfig.templateId, {
                    to_email: email,
                    to_name: recipientName,
                    certificate_image: base64,
                    verification_id: verificationId,
                    ...row
                }, emailConfig.publicKey);

                // Collect for batch DB insert
                certRecords.push({
                    recipient_name: recipientName,
                    recipient_email: email,
                    event_name: eventName,
                    verification_id: verificationId,
                    issue_date: new Date().toISOString().split("T")[0],
                    status: "issued",
                    certificate_url: null,
                    metadata: Object.fromEntries(
                        Object.entries(row).filter(([k]) => !["email", "Email"].includes(k))
                    ),
                });

                success++;
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                console.error("Email send error:", msg);
                errorMessages.push(`${recipientName}: ${msg}`);
                failed++;
            }

            setSendProgress(Math.round(((i + 1) / dataRows.length) * 100));

            // Update job progress periodically (every 5 sends or at end)
            if (job && (i % 5 === 0 || i === dataRows.length - 1)) {
                updateCertificateJobProgress(job.id, success, failed, "processing").catch(() => {});
            }
        }

        // Batch-record all successfully sent certificates into Supabase
        if (certRecords.length > 0) {
            try {
                await recordCertificatesBatch(certRecords);
            } catch (err) {
                console.error("Failed to record certificates in DB:", err);
            }
        }

        // Finalize the job
        if (job) {
            const finalStatus = failed === 0 ? "completed" : success === 0 ? "failed" : "completed";
            const errLog = errorMessages.length > 0 ? errorMessages.join("\n") : undefined;
            updateCertificateJobProgress(job.id, success, failed, finalStatus, errLog).catch(() => {});
        }

        setSending(false);
        toast({
            title: "Sending Complete",
            description: `✅ ${success} sent${failed > 0 ? `, ❌ ${failed} failed` : " — all successful!"}${certRecords.length > 0 ? " | Recorded in DB ✓" : ""}`,
        });
    };

    // ─── SELECTED FIELD REFERENCE ────────────────────────────────────
    const sel = fields.find(f => f.id === selectedField);

    // ─── RENDER ──────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* ── SECTION 1: Template & Signature Upload ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-muted/20 border-primary/10">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Upload className="w-4 h-4" /> Certificate Template
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Input type="file" accept="image/*" onChange={handleTemplateUpload} />
                        {templateDataUrl && (
                            <p className="text-xs text-emerald-400 mt-2">✓ Template loaded</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-muted/20 border-primary/10">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <PenLine className="w-4 h-4" /> Signature Image
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Input type="file" accept="image/*" onChange={handleSignatureUpload} />
                        {signature.dataUrl && (
                            <div className="mt-2 flex items-center gap-2">
                                <img src={signature.dataUrl} alt="sig" className="h-8 border rounded" />
                                <p className="text-xs text-emerald-400">✓ Loaded — drag on canvas to position</p>
                            </div>
                        )}
                        {signature.image && (
                            <div className="mt-2 space-y-1">
                                <Label className="text-xs">Signature Size: {signature.width}×{signature.height}</Label>
                                <Slider
                                    value={[signature.width]}
                                    onValueChange={([v]) => setSignature(prev => ({
                                        ...prev, width: v, height: Math.round(v * 0.4)
                                    }))}
                                    min={50} max={400} step={5}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── SECTION 2: Live Canvas Editor ── */}
            <Card className="bg-muted/20 border-primary/10">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Type className="w-4 h-4" /> Live Canvas Editor
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={addField}>
                            <Plus className="w-3 h-3 mr-1" /> Add Field
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Canvas */}
                    <div className="relative border border-primary/20 rounded-lg overflow-hidden bg-black/30"
                        style={{ maxWidth: canvasW }}>
                        <canvas
                            ref={canvasRef}
                            width={canvasW}
                            height={canvasH}
                            className="w-full cursor-crosshair"
                            onMouseDown={handleCanvasMouseDown}
                            onMouseMove={handleCanvasMouseMove}
                            onMouseUp={handleCanvasMouseUp}
                            onMouseLeave={handleCanvasMouseUp}
                        />
                    </div>

                    {/* Field List & Properties */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Field List */}
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Fields on Canvas</p>
                            {fields.length === 0 && (
                                <p className="text-xs text-muted-foreground italic">No fields yet. Click "Add Field" above.</p>
                            )}
                            {fields.map(f => (
                                <div
                                    key={f.id}
                                    onClick={() => setSelectedField(f.id)}
                                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer text-sm transition-all
                    ${f.id === selectedField ? "bg-primary/20 border border-primary/40" : "bg-muted/10 hover:bg-muted/20"}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <GripVertical className="w-3 h-3 text-muted-foreground" />
                                        <span>{f.label}</span>
                                        <Badge variant="secondary" className="text-[9px]">{f.fontSize}px</Badge>
                                    </div>
                                    <Button
                                        size="sm" variant="ghost"
                                        className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                                        onClick={(e) => { e.stopPropagation(); removeField(f.id); }}
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {/* Selected Field Properties */}
                        <div className="space-y-3">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Field Properties</p>
                            {sel ? (
                                <>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Field Name (maps to data column)</Label>
                                        <Input
                                            value={sel.label} className="h-8 text-sm"
                                            onChange={e => updateField(sel.id, { label: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Font Size: {sel.fontSize}px</Label>
                                            <Slider
                                                value={[sel.fontSize]}
                                                onValueChange={([v]) => updateField(sel.id, { fontSize: v })}
                                                min={10} max={72} step={1}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Width: {sel.width}px</Label>
                                            <Slider
                                                value={[sel.width]}
                                                onValueChange={([v]) => updateField(sel.id, { width: v })}
                                                min={50} max={800} step={10}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Font</Label>
                                            <Select value={sel.fontFamily} onValueChange={v => updateField(sel.id, { fontFamily: v })}>
                                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent className="max-h-80">
                                                    {FONT_CATEGORIES.map(cat => (
                                                        <div key={cat.label}>
                                                            <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/30">
                                                                {cat.label}
                                                            </div>
                                                            {cat.fonts.map(f => (
                                                                <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>
                                                            ))}
                                                        </div>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Align</Label>
                                            <Select value={sel.alignment} onValueChange={v => updateField(sel.id, { alignment: v as CanvasTextAlign })}>
                                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="left">Left</SelectItem>
                                                    <SelectItem value="center">Center</SelectItem>
                                                    <SelectItem value="right">Right</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Color</Label>
                                            <Input
                                                type="color" value={sel.color} className="h-8 p-1"
                                                onChange={e => updateField(sel.id, { color: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm" variant={sel.bold ? "default" : "outline"}
                                            className="h-7 text-xs"
                                            onClick={() => updateField(sel.id, { bold: !sel.bold })}
                                        >
                                            <strong>B</strong>
                                        </Button>
                                        <div className="text-[10px] text-muted-foreground">
                                            Position: ({Math.round(sel.x)}, {Math.round(sel.y)}) — drag on canvas
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <p className="text-xs text-muted-foreground italic">Select a field to edit its properties</p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── SECTION 3: Data Input ── */}
            <Card className="bg-muted/20 border-primary/10">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4" /> Recipient Data
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={addManualRow} disabled={fields.length === 0}>
                            <Plus className="w-3 h-3 mr-1" /> Add Row
                        </Button>
                        <div className="relative">
                            <Input
                                type="file" accept=".xlsx,.xls,.csv"
                                onChange={handleExcelUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full"
                            />
                            <Button size="sm" variant="outline">
                                <FileSpreadsheet className="w-3 h-3 mr-1" /> Import Excel
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {dataRows.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No data yet. Add rows manually or import an Excel file.</p>
                            <p className="text-xs mt-1">Excel columns will auto-map to canvas field names.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-primary/10">
                                            <th className="text-left text-xs text-muted-foreground py-2 px-2">#</th>
                                            {Object.keys(dataRows[0]).map(k => (
                                                <th key={k} className="text-left text-xs text-muted-foreground py-2 px-2">{k}</th>
                                            ))}
                                            <th className="text-right text-xs text-muted-foreground py-2 px-2">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dataRows.map((row, i) => (
                                            <tr key={i} className={`border-b border-muted/10 ${i === previewIdx ? "bg-primary/10" : ""}`}>
                                                <td className="py-1 px-2 text-xs text-muted-foreground">{i + 1}</td>
                                                {Object.keys(row).map(k => (
                                                    <td key={k} className="py-1 px-2">
                                                        <Input
                                                            value={row[k]} className="h-7 text-xs"
                                                            onChange={e => updateRowValue(i, k, e.target.value)}
                                                        />
                                                    </td>
                                                ))}
                                                <td className="py-1 px-2 text-right">
                                                    <div className="flex items-center gap-1 justify-end">
                                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
                                                            onClick={() => setPreviewIdx(i)} title="Preview">
                                                            <Eye className="w-3 h-3" />
                                                        </Button>
                                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
                                                            onClick={() => downloadCertificate(row, i)} title="Download">
                                                            <Download className="w-3 h-3" />
                                                        </Button>
                                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-400"
                                                            onClick={() => removeRow(i)} title="Delete">
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Preview Navigation */}
                            <div className="flex items-center justify-center gap-4">
                                <Button size="sm" variant="outline" disabled={previewIdx === 0}
                                    onClick={() => setPreviewIdx(i => i - 1)}>
                                    <ChevronLeft className="w-3 h-3" />
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                    Previewing: <strong>{previewIdx + 1}</strong> of {dataRows.length}
                                </span>
                                <Button size="sm" variant="outline" disabled={previewIdx >= dataRows.length - 1}
                                    onClick={() => setPreviewIdx(i => i + 1)}>
                                    <ChevronRight className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── SECTION 4: Download Certificates ── */}
            <Card className="bg-emerald-950/20 border-emerald-500/20">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Download className="w-4 h-4 text-emerald-400" /> Download Certificates
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Progress Bar */}
                    {sending && (
                        <div className="space-y-1">
                            <div className="w-full bg-muted/30 rounded-full h-2">
                                <div
                                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${sendProgress}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground text-center">{sendProgress}% — Processing...</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* PNG Download */}
                        <div className="p-4 rounded-lg border border-emerald-500/10 bg-muted/10 space-y-3">
                            <div className="flex items-center gap-2">
                                <Badge className="bg-emerald-500/20 text-emerald-300 border-0 text-xs">PNG</Badge>
                                <span className="text-sm font-medium">Image Format</span>
                            </div>
                            <p className="text-xs text-muted-foreground">High-quality PNG images, perfect for printing or sharing.</p>
                            <div className="flex gap-2">
                                <Button
                                    size="sm" variant="outline"
                                    disabled={!templateImg || sending}
                                    onClick={() => downloadCertificate(dataRows[previewIdx] || {}, previewIdx, "png")}
                                >
                                    <Download className="w-3 h-3 mr-1" /> Current Preview
                                </Button>
                                <Button
                                    size="sm"
                                    disabled={dataRows.length === 0 || sending}
                                    onClick={() => downloadAllCertificates("png")}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                    <Download className="w-3 h-3 mr-1" /> All ({dataRows.length}) as PNG
                                </Button>
                            </div>
                        </div>

                        {/* PDF Download */}
                        <div className="p-4 rounded-lg border border-blue-500/10 bg-muted/10 space-y-3">
                            <div className="flex items-center gap-2">
                                <Badge className="bg-blue-500/20 text-blue-300 border-0 text-xs">PDF</Badge>
                                <span className="text-sm font-medium">Print / PDF Format</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Opens print dialog — save as PDF or print directly.</p>
                            <div className="flex gap-2">
                                <Button
                                    size="sm" variant="outline"
                                    disabled={!templateImg || sending}
                                    onClick={() => downloadCertificate(dataRows[previewIdx] || {}, previewIdx, "pdf")}
                                >
                                    <Download className="w-3 h-3 mr-1" /> Current Preview
                                </Button>
                                <Button
                                    size="sm"
                                    disabled={dataRows.length === 0 || sending}
                                    onClick={() => downloadAllCertificates("pdf")}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    <Download className="w-3 h-3 mr-1" /> All ({dataRows.length}) as PDF
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── SECTION 5: Email Sending (Optional) ── */}
            <Card className="bg-muted/20 border-primary/10">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Send className="w-4 h-4" /> Email Delivery <Badge variant="secondary" className="text-[9px]">Optional</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">EmailJS Service ID</Label>
                            <Input
                                placeholder="service_xxxxx" className="h-8 text-xs"
                                value={emailConfig.serviceId}
                                onChange={e => setEmailConfig(prev => ({ ...prev, serviceId: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Template ID</Label>
                            <Input
                                placeholder="template_xxxxx" className="h-8 text-xs"
                                value={emailConfig.templateId}
                                onChange={e => setEmailConfig(prev => ({ ...prev, templateId: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Public Key</Label>
                            <Input
                                placeholder="your_public_key" className="h-8 text-xs"
                                value={emailConfig.publicKey}
                                onChange={e => setEmailConfig(prev => ({ ...prev, publicKey: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs">Email Column (from data)</Label>
                        <Select value={emailConfig.emailField} onValueChange={v => setEmailConfig(prev => ({ ...prev, emailField: v }))}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select email column" /></SelectTrigger>
                            <SelectContent>
                                {dataRows.length > 0 && Object.keys(dataRows[0]).map(k => (
                                    <SelectItem key={k} value={k}>{k}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        onClick={sendCertificates}
                        disabled={sending || dataRows.length === 0}
                        className="bg-primary hover:bg-primary/90"
                    >
                        {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                        {sending ? "Sending..." : `Send to ${dataRows.length} Recipients`}
                    </Button>

                    <p className="text-[10px] text-muted-foreground italic">
                        📧 Uses EmailJS for client-side email. Get your free API keys at{" "}
                        <a href="https://www.emailjs.com/" target="_blank" rel="noreferrer" className="underline text-primary">
                            emailjs.com
                        </a>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default CertificateSender;
