import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
    Upload, Plus, Trash2, Eye, Send, FileSpreadsheet, GripVertical,
    Type, PenLine, Download, ChevronLeft, ChevronRight, Loader2, X,
    Sparkles, CheckCircle2, AlertCircle, ExternalLink, ShieldCheck,
    Mail, RefreshCw, FileArchive, Settings, Search, Check, Copy,
    Eraser, ScanText, Undo2, RotateCcw, Crosshair, Wand2, Info, Printer
} from "lucide-react";
import * as XLSX from "xlsx";
import emailjs from "@emailjs/browser";
import JSZip from "jszip";
import Tesseract from "tesseract.js";

import {
    generateVerificationId,
    recordCertificatesBatch,
    createCertificateJob,
    updateCertificateJobProgress,
    uploadCertificateBlob,
    getAllCertificates,
    setCertificateStatus,
    deleteCertificate,
    type Certificate,
    type CertificateInsert
} from "@/lib/services/certificateService";
import type { CertificateStatus } from "@/lib/supabase/types";
import {
    inpaintRectOnImage,
    sampleBackgroundColor,
    classifyOcrText,
    detectEmptySpaces,
    type DetectedTextItem,
    type DetectedEmptySpace
} from "@/lib/utils/certificateInpaint";

// ─── TYPES ───────────────────────────────────────────────────────────
interface TextField {
    id: string;
    label: string;       // field name e.g. "Name", "Event", "Role", "Date", "Verification ID"
    x: number;
    y: number;
    fontSize: number;
    fontFamily: string;
    color: string;
    alignment: CanvasTextAlign;
    bold: boolean;
    width: number;
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

interface EraseSelection {
    x: number;
    y: number;
    width: number;
    height: number;
}

// ─── CONSTANTS ───────────────────────────────────────────────────────
const FONT_CATEGORIES: { label: string; fonts: string[] }[] = [
    {
        label: "Standard & Sans",
        fonts: ["Arial", "Inter", "Poppins", "Sora", "Verdana", "Trebuchet MS", "Impact"]
    },
    {
        label: "Serif & Classic",
        fonts: ["Times New Roman", "Georgia", "Garamond", "Palatino"]
    },
    {
        label: "Devanagari / Hindi",
        fonts: ["Noto Sans Devanagari", "Tiro Devanagari Hindi", "Hind", "Mukta", "Baloo 2"]
    },
    {
        label: "Cursive & Formal Script",
        fonts: ["Great Vibes", "Dancing Script", "Pacifico", "Satisfy", "Sacramento", "Alex Brush", "Allura"]
    },
    {
        label: "Modern Handwritten",
        fonts: ["Caveat", "Kalam", "Indie Flower", "Shadows Into Light", "Patrick Hand"]
    }
];

const PRESET_COLORS = [
    { name: "Gold", value: "#d4af37" },
    { name: "Light Gold", value: "#f6e05e" },
    { name: "White", value: "#ffffff" },
    { name: "Off White", value: "#f1f5f9" },
    { name: "Cyan", value: "#38bdf8" },
    { name: "Dark Slate", value: "#0f172a" },
    { name: "Amber", value: "#f59e0b" },
    { name: "Emerald", value: "#10b981" }
];

const CANVAS_MAX_W = 900;

// ─── COMPONENT ───────────────────────────────────────────────────────
const CertificateSender: React.FC = () => {
    const { toast } = useToast();

    // Active sub-view
    const [activeTab, setActiveTab] = useState<"designer" | "recipients" | "delivery" | "history">("designer");

    // Event Info
    const [eventName, setEventName] = useState<string>("TechShastra Hackathon 2026");

    // Template state & history for Undo
    const [templateImg, setTemplateImg] = useState<HTMLImageElement | null>(null);
    const [templateDataUrl, setTemplateDataUrl] = useState<string>("");
    const [originalTemplateUrl, setOriginalTemplateUrl] = useState<string>("");
    const [templateHistory, setTemplateHistory] = useState<string[]>([]);

    // Canvas Mode: "select" (move/edit fields) | "erase" (patch/inpaint placeholders)
    const [canvasMode, setCanvasMode] = useState<"select" | "erase">("select");
    const [isDrawingErase, setIsDrawingErase] = useState(false);
    const [eraseStartPos, setEraseStartPos] = useState<{ x: number; y: number } | null>(null);
    const [currentEraseBox, setCurrentEraseBox] = useState<EraseSelection | null>(null);
    const [pendingErase, setPendingErase] = useState<EraseSelection | null>(null);
    const [customFillColor, setCustomFillColor] = useState<string>("");
    const [sampledColorPreview, setSampledColorPreview] = useState<string>("");

    // OCR Smart Scan state
    const [isScanningOcr, setIsScanningOcr] = useState(false);
    const [ocrProgress, setOcrProgress] = useState(0);
    const [ocrStatusText, setOcrStatusText] = useState("");
    const [detectedItems, setDetectedItems] = useState<DetectedTextItem[]>([]);
    const [detectedGaps, setDetectedGaps] = useState<DetectedEmptySpace[]>([]);
    const [showOcrResults, setShowOcrResults] = useState(false);

    // Canvas sizing
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [canvasW, setCanvasW] = useState(CANVAS_MAX_W);
    const [canvasH, setCanvasH] = useState(560);
    const [scale, setScale] = useState(1);

    // Text fields on canvas
    const [fields, setFields] = useState<TextField[]>([]);
    const [selectedField, setSelectedField] = useState<string | null>(null);
    const [dragging, setDragging] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Signature
    const [signature, setSignature] = useState<SignatureField>({
        x: 0, y: 0, width: 140, height: 56, image: null, dataUrl: ""
    });
    const [draggingSig, setDraggingSig] = useState(false);
    const [sigDragOffset, setSigDragOffset] = useState({ x: 0, y: 0 });

    // Data rows
    const [dataRows, setDataRows] = useState<DataRow[]>([
        {
            Name: "Aarav Sharma",
            Email: "aarav@example.com",
            Role: "First Place Winner",
            College: "Uttarakhand Technical University",
            Date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        },
        {
            Name: "Priya Sharma",
            Email: "priya@example.com",
            Role: "Second Runner Up",
            College: "Graphic Era University",
            Date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        },
        {
            Name: "Aman Verma",
            Email: "aman@example.com",
            Role: "Distinguished Participant",
            College: "DIT University",
            Date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        }
    ]);
    const [previewIdx, setPreviewIdx] = useState(0);

    // Modal preview for recipient certificate
    const [modalRecipientIdx, setModalRecipientIdx] = useState<number | null>(null);
    const [modalPreviewUrl, setModalPreviewUrl] = useState<string | null>(null);
    const [modalLoading, setModalLoading] = useState<boolean>(false);

    const openRecipientPreview = async (idx: number) => {
        if (idx < 0 || idx >= dataRows.length) return;
        setModalRecipientIdx(idx);
        setModalLoading(true);
        try {
            const row = dataRows[idx];
            const vId = row.verification_id || generateVerificationId();
            const blob = await generateCertBlob(row, vId);
            if (modalPreviewUrl) URL.revokeObjectURL(modalPreviewUrl);
            const url = URL.createObjectURL(blob);
            setModalPreviewUrl(url);
        } catch (err) {
            console.error("Preview render failed:", err);
        } finally {
            setModalLoading(false);
        }
    };

    // EmailJS config
    const [emailConfig, setEmailConfig] = useState({
        serviceId: localStorage.getItem("ts_emailjs_service_id") || (import.meta.env.VITE_EMAILJS_SERVICE_ID || ""),
        templateId: localStorage.getItem("ts_emailjs_template_id") || (import.meta.env.VITE_EMAILJS_TEMPLATE_ID || ""),
        publicKey: localStorage.getItem("ts_emailjs_public_key") || (import.meta.env.VITE_EMAILJS_PUBLIC_KEY || ""),
        emailField: "Email"
    });

    // Sending & Progress state
    const [sending, setSending] = useState(false);
    const [sendProgress, setSendProgress] = useState(0);
    const [sendStats, setSendStats] = useState({ total: 0, sent: 0, failed: 0 });
    const [isZipping, setIsZipping] = useState(false);

    // History of issued certificates
    const [historyList, setHistoryList] = useState<Certificate[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Save EmailJS config on changes
    const updateEmailConfig = (updates: Partial<typeof emailConfig>) => {
        setEmailConfig(prev => {
            const next = { ...prev, ...updates };
            if (updates.serviceId !== undefined) localStorage.setItem("ts_emailjs_service_id", next.serviceId);
            if (updates.templateId !== undefined) localStorage.setItem("ts_emailjs_template_id", next.templateId);
            if (updates.publicKey !== undefined) localStorage.setItem("ts_emailjs_public_key", next.publicKey);
            return next;
        });
    };

    // Load History
    const loadCertificateHistory = useCallback(async () => {
        setLoadingHistory(true);
        try {
            const certs = await getAllCertificates();
            setHistoryList(certs);
        } catch (err) {
            console.error("Failed to load certificate history:", err);
        } finally {
            setLoadingHistory(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === "history") {
            loadCertificateHistory();
        }
    }, [activeTab, loadCertificateHistory]);

    // ─── GENERATE DEFAULT TECHSHASTRA CERTIFICATE TEMPLATE ───────────
    const generateDefaultTemplate = () => {
        const off = document.createElement("canvas");
        const W = 1920;
        const H = 1200;
        off.width = W;
        off.height = H;
        const ctx = off.getContext("2d");
        if (!ctx) return;

        // Background dark gradient
        const bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, "#080b14");
        bgGrad.addColorStop(0.5, "#0d1322");
        bgGrad.addColorStop(1, "#050811");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // Subtle geometric mesh/lines
        ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
        ctx.lineWidth = 1;
        for (let i = 0; i < 400; i += 30) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(0, i);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(W - i, H);
            ctx.lineTo(W, H - i);
            ctx.stroke();
        }

        // Ornate gold border
        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 6;
        ctx.strokeRect(50, 50, W - 100, H - 100);

        // Inner cyan border
        ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
        ctx.lineWidth = 2;
        ctx.strokeRect(66, 66, W - 132, H - 132);

        // Corner accents
        const cornerSize = 40;
        ctx.fillStyle = "#d4af37";
        ctx.fillRect(45, 45, cornerSize, 6);
        ctx.fillRect(45, 45, 6, cornerSize);
        ctx.fillRect(W - 45 - cornerSize, 45, cornerSize, 6);
        ctx.fillRect(W - 51, 45, 6, cornerSize);
        ctx.fillRect(45, H - 51, cornerSize, 6);
        ctx.fillRect(45, H - 45 - cornerSize, 6, cornerSize);
        ctx.fillRect(W - 45 - cornerSize, H - 51, cornerSize, 6);
        ctx.fillRect(W - 51, H - 45 - cornerSize, 6, cornerSize);

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.font = "bold 24px 'Inter', Arial, sans-serif";
        ctx.fillStyle = "#38bdf8";
        ctx.fillText("UTTARAKHAND TECHNICAL UNIVERSITY · OFFICIAL CREDENTIAL", W / 2, 140);

        ctx.font = "bold 56px 'Poppins', Arial, sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("TECHSHASTRA", W / 2, 205);

        ctx.font = "34px 'Georgia', serif";
        ctx.fillStyle = "#d4af37";
        ctx.fillText("CERTIFICATE OF EXCELLENCE", W / 2, 275);

        ctx.strokeStyle = "rgba(212, 175, 55, 0.6)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(W / 2 - 250, 315);
        ctx.lineTo(W / 2 + 250, 315);
        ctx.stroke();

        ctx.fillStyle = "#d4af37";
        ctx.beginPath();
        ctx.arc(W / 2, 315, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = "italic 22px 'Georgia', serif";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("This is proudly presented to", W / 2, 365);

        ctx.font = "italic 22px 'Georgia', serif";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("for outstanding achievement and active contribution in", W / 2, 595);

        ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(220, 1020);
        ctx.lineTo(520, 1020);
        ctx.stroke();
        ctx.font = "16px 'Inter', Arial, sans-serif";
        ctx.fillStyle = "#64748b";
        ctx.fillText("DATE OF ISSUANCE", 370, 1045);

        ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
        ctx.beginPath();
        ctx.arc(W / 2, 1010, 38, 0, Math.PI * 2);
        ctx.stroke();
        ctx.font = "bold 12px 'Inter', Arial, sans-serif";
        ctx.fillStyle = "#d4af37";
        ctx.fillText("VERIFIED", W / 2, 1005);
        ctx.font = "10px 'Inter', Arial, sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("TS · UTU", W / 2, 1020);

        ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
        ctx.beginPath();
        ctx.moveTo(W - 520, 1020);
        ctx.lineTo(W - 220, 1020);
        ctx.stroke();
        ctx.font = "16px 'Inter', Arial, sans-serif";
        ctx.fillStyle = "#64748b";
        ctx.fillText("AUTHORIZED SIGNATORY", W - 370, 1045);

        ctx.font = "14px 'Inter', Arial, sans-serif";
        ctx.fillStyle = "#475569";
        ctx.fillText("Verify authentic credentials at: techshastra.org/verify", W / 2, 1125);

        const dataUrl = off.toDataURL("image/png");
        const img = new Image();
        img.onload = () => {
            const sc = Math.min(CANVAS_MAX_W / img.width, 1);
            setScale(sc);
            setCanvasW(Math.round(img.width * sc));
            setCanvasH(Math.round(img.height * sc));
            setTemplateImg(img);
            setTemplateDataUrl(dataUrl);
            setOriginalTemplateUrl(dataUrl);
            setTemplateHistory([]);

            const defaultFields: TextField[] = [
                {
                    id: `field_name`,
                    label: "Name",
                    x: Math.round(W / 2 * sc),
                    y: Math.round(455 * sc),
                    fontSize: 34,
                    fontFamily: "Poppins",
                    color: "#f6e05e",
                    alignment: "center",
                    bold: true,
                    width: Math.round(750 * sc)
                },
                {
                    id: `field_role`,
                    label: "Role",
                    x: Math.round(W / 2 * sc),
                    y: Math.round(520 * sc),
                    fontSize: 20,
                    fontFamily: "Inter",
                    color: "#38bdf8",
                    alignment: "center",
                    bold: false,
                    width: Math.round(600 * sc)
                },
                {
                    id: `field_event`,
                    label: "Event",
                    x: Math.round(W / 2 * sc),
                    y: Math.round(665 * sc),
                    fontSize: 28,
                    fontFamily: "Poppins",
                    color: "#ffffff",
                    alignment: "center",
                    bold: true,
                    width: Math.round(700 * sc)
                },
                {
                    id: `field_college`,
                    label: "College",
                    x: Math.round(W / 2 * sc),
                    y: Math.round(735 * sc),
                    fontSize: 18,
                    fontFamily: "Inter",
                    color: "#94a3b8",
                    alignment: "center",
                    bold: false,
                    width: Math.round(650 * sc)
                },
                {
                    id: `field_date`,
                    label: "Date",
                    x: Math.round(370 * sc),
                    y: Math.round(990 * sc),
                    fontSize: 17,
                    fontFamily: "Inter",
                    color: "#f1f5f9",
                    alignment: "center",
                    bold: false,
                    width: Math.round(250 * sc)
                },
                {
                    id: `field_verif`,
                    label: "Verification ID",
                    x: Math.round(W / 2 * sc),
                    y: Math.round(1095 * sc),
                    fontSize: 14,
                    fontFamily: "Courier New",
                    color: "#38bdf8",
                    alignment: "center",
                    bold: true,
                    width: Math.round(300 * sc)
                }
            ];

            setFields(defaultFields);
            setSelectedField("field_name");
            toast({
                title: "TechShastra Template Loaded",
                description: "Official template & default fields placed. You can drag and adjust anything."
            });
        };
        img.src = dataUrl;
    };

    // Auto-load template on initial mount
    useEffect(() => {
        if (!templateImg) {
            generateDefaultTemplate();
        }
    }, []);

    // ─── TEMPLATE UPLOAD ─────────────────────────────────────────────
    const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            const img = new Image();
            img.onload = () => {
                const sc = Math.min(CANVAS_MAX_W / img.width, 1);
                setScale(sc);
                setCanvasW(Math.round(img.width * sc));
                setCanvasH(Math.round(img.height * sc));
                setTemplateImg(img);
                setTemplateDataUrl(dataUrl);
                setOriginalTemplateUrl(dataUrl);
                setTemplateHistory([]);
                toast({
                    title: "Custom Template Uploaded",
                    description: `Loaded image ${img.width}×${img.height}px. Click "Erase Placeholder" to clean unwanted text.`
                });
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
    };

    // ─── INPAINT / PLACEHOLDER ERASER ────────────────────────────────
    const executeInpaint = async (box: EraseSelection, placeFieldLabel?: string) => {
        if (!templateImg) return;

        try {
            // Push current state to undo history
            setTemplateHistory(prev => [...prev, templateDataUrl]);

            // Convert canvas coordinates to full native image coordinates
            const fullScale = templateImg.width / canvasW;
            const nativeX = Math.round(box.x * fullScale);
            const nativeY = Math.round(box.y * fullScale);
            const nativeW = Math.round(box.width * fullScale);
            const nativeH = Math.round(box.height * fullScale);

            const result = await inpaintRectOnImage(
                templateImg,
                nativeX,
                nativeY,
                nativeW,
                nativeH,
                customFillColor || undefined
            );

            setTemplateImg(result.image);
            setTemplateDataUrl(result.dataUrl);

            // If user requested to place a dynamic field at this spot
            if (placeFieldLabel) {
                const newField: TextField = {
                    id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                    label: placeFieldLabel,
                    x: Math.round(box.x + box.width / 2),
                    y: Math.round(box.y + box.height / 2),
                    fontSize: Math.max(16, Math.min(48, Math.round(box.height * 0.7))),
                    fontFamily: placeFieldLabel.toLowerCase() === "name" ? "Poppins" : "Inter",
                    color: result.color === "#ffffff" ? "#0f172a" : "#ffffff",
                    alignment: "center",
                    bold: placeFieldLabel.toLowerCase() === "name",
                    width: Math.max(box.width * 1.2, 250)
                };
                setFields(prev => [...prev, newField]);
                setSelectedField(newField.id);
            }

            setPendingErase(null);
            setCurrentEraseBox(null);
            setCanvasMode("select");

            toast({
                title: "Placeholder Cleaned",
                description: placeFieldLabel
                    ? `Erased text & replaced with dynamic "${placeFieldLabel}" field.`
                    : "Area cleanly inpainted with matching background."
            });
        } catch (err) {
            console.error("Inpaint failed:", err);
            toast({ title: "Erase Failed", description: "Could not inpaint selected area.", variant: "destructive" });
        }
    };

    const handleUndoErase = () => {
        if (templateHistory.length === 0) return;
        const prevUrl = templateHistory[templateHistory.length - 1];
        const nextHistory = templateHistory.slice(0, -1);

        const img = new Image();
        img.onload = () => {
            setTemplateImg(img);
            setTemplateDataUrl(prevUrl);
            setTemplateHistory(nextHistory);
            toast({ title: "Erase Undone", description: "Reverted to previous template image." });
        };
        img.src = prevUrl;
    };

    const handleResetTemplate = () => {
        if (!originalTemplateUrl) return;
        const img = new Image();
        img.onload = () => {
            setTemplateImg(img);
            setTemplateDataUrl(originalTemplateUrl);
            setTemplateHistory([]);
            toast({ title: "Template Reset", description: "Restored pristine original template." });
        };
        img.src = originalTemplateUrl;
    };

    // ─── OCR AI SCANNING (TESSERACT.JS) ──────────────────────────────
    const runOcrScan = async () => {
        if (!templateDataUrl || !templateImg) {
            toast({ title: "No Template", description: "Upload a template image first.", variant: "destructive" });
            return;
        }

        setIsScanningOcr(true);
        setOcrProgress(0);
        setOcrStatusText("Initializing AI text recognition...");
        setShowOcrResults(true);

        try {
            const result = await Tesseract.recognize(
                templateDataUrl,
                "eng",
                {
                    logger: m => {
                        if (m.status === "recognizing text") {
                            setOcrProgress(Math.round(m.progress * 100));
                            setOcrStatusText(`Scanning template text (${Math.round(m.progress * 100)}%)...`);
                        } else {
                            setOcrStatusText(m.status);
                        }
                    }
                }
            );

            const lines = (result.data as any).lines || [];
            const detected: DetectedTextItem[] = [];

            lines.forEach((line: any, idx: number) => {
                const text = (line.text || "").trim();
                if (text.length > 1 && line.confidence > 25) {
                    const classified = classifyOcrText(text);
                    detected.push({
                        id: `ocr_${idx}`,
                        text,
                        bbox: line.bbox,
                        isPlaceholder: classified.isPlaceholder,
                        confidence: Math.round(line.confidence),
                        suggestedField: classified.suggestedField
                    });
                }
            });

            setDetectedItems(detected);

            // Also detect natural empty vertical gaps between lines
            const gaps = detectEmptySpaces(detected, templateImg.width, templateImg.height);
            setDetectedGaps(gaps);

            toast({
                title: "Template Scan Completed",
                description: `Found ${detected.length} text elements and ${gaps.length} natural empty placement spaces.`
            });
        } catch (err) {
            console.error("OCR Scan failed:", err);
            toast({
                title: "Scan Incomplete",
                description: "OCR engine could not finish reading. You can still use the visual Erase Tool.",
                variant: "destructive"
            });
        } finally {
            setIsScanningOcr(false);
        }
    };

    // Erase a specific OCR-detected item & convert to editable dynamic field
    const handleOcrConvert = async (item: DetectedTextItem, fieldLabel: string) => {
        if (!templateImg) return;

        // Convert bbox to canvas coordinates
        const fullScale = canvasW / templateImg.width;
        const box: EraseSelection = {
            x: Math.round(item.bbox.x0 * fullScale),
            y: Math.round(item.bbox.y0 * fullScale),
            width: Math.round((item.bbox.x1 - item.bbox.x0) * fullScale),
            height: Math.round((item.bbox.y1 - item.bbox.y0) * fullScale)
        };

        await executeInpaint(box, fieldLabel);
        // Remove item from detected list
        setDetectedItems(prev => prev.filter(i => i.id !== item.id));
    };

    // Auto-clean all detected placeholders in 1 click
    const handleAutoConvertAllPlaceholders = async () => {
        const placeholders = detectedItems.filter(i => i.isPlaceholder);
        if (placeholders.length === 0) {
            toast({ title: "No Placeholders Detected", description: "Use manual 'Erase Placeholder' box tool." });
            return;
        }

        for (const item of placeholders) {
            await handleOcrConvert(item, item.suggestedField);
            await new Promise(r => setTimeout(r, 200));
        }

        toast({
            title: "Auto-Clean Completed",
            description: `Erased ${placeholders.length} placeholder texts and converted to editable fields!`
        });
    };

    // Place a field in a detected empty vertical gap
    const handlePlaceInGap = (gap: DetectedEmptySpace) => {
        if (!templateImg) return;
        const fullScale = canvasW / templateImg.width;
        const canvasY = Math.round(gap.y * fullScale);

        const newField: TextField = {
            id: `field_gap_${Date.now()}`,
            label: gap.suggestedField,
            x: Math.round(canvasW / 2),
            y: canvasY,
            fontSize: Math.round(gap.height * fullScale * 0.45),
            fontFamily: gap.suggestedField === "Name" ? "Poppins" : "Inter",
            color: "#ffffff",
            alignment: "center",
            bold: gap.suggestedField === "Name",
            width: Math.round(canvasW * 0.65)
        };

        setFields(prev => [...prev, newField]);
        setSelectedField(newField.id);
        toast({ title: `Placed "${gap.suggestedField}" field in detected empty space` });
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
                    ...prev,
                    image: img,
                    dataUrl: reader.result as string,
                    x: canvasW - 240,
                    y: canvasH - 120
                }));
                toast({
                    title: "Signature Image Loaded",
                    description: "Signature placed on canvas. Drag to position."
                });
            };
            img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
    };

    // ─── FIELD MANAGEMENT ────────────────────────────────────────────
    const addPresetField = (label: string, defaultFont = "Inter", defaultSize = 24, color = "#ffffff") => {
        const newField: TextField = {
            id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            label,
            x: Math.round(canvasW / 2),
            y: Math.min(canvasH - 60, 150 + fields.length * 45),
            fontSize: defaultSize,
            fontFamily: defaultFont,
            color,
            alignment: "center",
            bold: label === "Name" || label === "Verification ID",
            width: 400
        };
        setFields(prev => [...prev, newField]);
        setSelectedField(newField.id);
        toast({ title: `Added "${label}" field` });
    };

    const removeField = (id: string) => {
        setFields(prev => prev.filter(f => f.id !== id));
        if (selectedField === id) setSelectedField(null);
    };

    const updateField = (id: string, updates: Partial<TextField>) => {
        setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    // ─── SAMPLE CSV DOWNLOAD ─────────────────────────────────────────
    const downloadSampleCsv = () => {
        const sampleRows = [
            {
                Name: "Aditya Rawat",
                Email: "aditya@example.com",
                Role: "Winner - 1st Place",
                Event: eventName,
                College: "UTU Dehradun",
                Date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            },
            {
                Name: "Sneha Pant",
                Email: "sneha@example.com",
                Role: "Runner Up - 2nd Place",
                Event: eventName,
                College: "THDC-IHET Tehri",
                Date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            },
            {
                Name: "Rohan Joshi",
                Email: "rohan@example.com",
                Role: "Participant",
                Event: eventName,
                College: "College of Technology Pantnagar",
                Date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            }
        ];

        const ws = XLSX.utils.json_to_sheet(sampleRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Participants");
        XLSX.writeFile(wb, "TechShastra_Participants_Sample.xlsx");
        toast({ title: "Sample Excel File Downloaded" });
    };

    // ─── EXCEL IMPORT ────────────────────────────────────────────────
    const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target?.result as ArrayBuffer);
                const wb = XLSX.read(data, { type: "array" });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const json: DataRow[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
                if (json.length === 0) {
                    toast({ title: "Empty Spreadsheet", description: "No rows found.", variant: "destructive" });
                    return;
                }
                setDataRows(json);
                setPreviewIdx(0);

                const firstRowKeys = Object.keys(json[0]);
                const emailCol = firstRowKeys.find(k => k.toLowerCase().includes("email") || k.toLowerCase().includes("mail"));
                if (emailCol) {
                    setEmailConfig(prev => ({ ...prev, emailField: emailCol }));
                }

                if (fields.length === 0) {
                    const cols = firstRowKeys.filter(k => !k.toLowerCase().includes("email"));
                    const newFields: TextField[] = cols.map((col, i) => ({
                        id: `field_auto_${i}`,
                        label: col,
                        x: Math.round(canvasW / 2),
                        y: 140 + i * 55,
                        fontSize: col.toLowerCase() === "name" ? 34 : 22,
                        fontFamily: "Inter",
                        color: "#ffffff",
                        alignment: "center",
                        bold: col.toLowerCase() === "name",
                        width: 450
                    }));
                    setFields(newFields);
                }

                toast({
                    title: "Recipients Imported",
                    description: `Loaded ${json.length} participants from spreadsheet.`
                });
                setActiveTab("recipients");
            } catch (err) {
                console.error("Error reading file:", err);
                toast({ title: "Import Failed", description: "Could not parse Excel/CSV file.", variant: "destructive" });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    // ─── MANUAL DATA ROWS ────────────────────────────────────────────
    const addManualRow = () => {
        const newRow: DataRow = {};
        fields.forEach(f => {
            if (f.label.toLowerCase() === "event") newRow[f.label] = eventName;
            else if (f.label.toLowerCase() === "date") newRow[f.label] = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            else newRow[f.label] = "";
        });
        newRow[emailConfig.emailField || "Email"] = "";
        setDataRows(prev => [...prev, newRow]);
        setPreviewIdx(dataRows.length);
    };

    const updateRowValue = (rowIdx: number, key: string, value: string) => {
        setDataRows(prev => prev.map((r, i) => i === rowIdx ? { ...r, [key]: value } : r));
    };

    const removeRow = (idx: number) => {
        setDataRows(prev => prev.filter((_, i) => i !== idx));
        if (previewIdx >= dataRows.length - 1) setPreviewIdx(Math.max(0, dataRows.length - 2));
    };

    // ─── CANVAS RENDERING ────────────────────────────────────────────
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
            ctx.fillStyle = "#090d16";
            ctx.fillRect(0, 0, canvasW, canvasH);
            ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
            ctx.font = "20px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("Click 'Use Default TechShastra Template' or Upload an image", canvasW / 2, canvasH / 2);
        }

        // Draw text fields (only in select mode or preview)
        fields.forEach(f => {
            let text = "";
            if (f.label.toLowerCase() === "verification id") {
                text = previewData?.["verification_id"] || "TS-2026-X8K9M2";
            } else if (f.label.toLowerCase() === "event" && (!previewData || !previewData[f.label])) {
                text = eventName;
            } else if (previewData && previewData[f.label] !== undefined && previewData[f.label] !== "") {
                text = previewData[f.label];
            } else {
                text = `[${f.label}]`;
            }

            ctx.font = `${f.bold ? "bold " : ""}${f.fontSize}px "${f.fontFamily}", sans-serif`;
            ctx.fillStyle = f.color;
            ctx.textAlign = f.alignment;
            ctx.textBaseline = "middle";
            ctx.fillText(text, f.x, f.y, f.width);

            // Selection indicator
            if (canvasMode === "select" && f.id === selectedField) {
                ctx.strokeStyle = "#38bdf8";
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 3]);
                const metrics = ctx.measureText(text);
                const tw = Math.min(metrics.width, f.width);
                let rx = f.x - tw / 2;
                if (f.alignment === "left") rx = f.x;
                if (f.alignment === "right") rx = f.x - tw;
                ctx.strokeRect(rx - 8, f.y - f.fontSize / 2 - 6, tw + 16, f.fontSize + 12);
                ctx.setLineDash([]);
            }
        });

        // Draw signature
        if (signature.image) {
            ctx.drawImage(signature.image, signature.x, signature.y, signature.width, signature.height);
            if (canvasMode === "select" && draggingSig) {
                ctx.strokeStyle = "#38bdf8";
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 2]);
                ctx.strokeRect(signature.x - 2, signature.y - 2, signature.width + 4, signature.height + 4);
                ctx.setLineDash([]);
            }
        }

        // If in erase mode and currently drawing an erase box
        if (canvasMode === "erase" && currentEraseBox) {
            ctx.fillStyle = "rgba(239, 68, 68, 0.25)";
            ctx.fillRect(currentEraseBox.x, currentEraseBox.y, currentEraseBox.width, currentEraseBox.height);
            ctx.strokeStyle = "#ef4444";
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 3]);
            ctx.strokeRect(currentEraseBox.x, currentEraseBox.y, currentEraseBox.width, currentEraseBox.height);
            ctx.setLineDash([]);
        }

        // If pending erase selection confirmed
        if (pendingErase) {
            ctx.fillStyle = "rgba(56, 189, 248, 0.2)";
            ctx.fillRect(pendingErase.x, pendingErase.y, pendingErase.width, pendingErase.height);
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 2;
            ctx.strokeRect(pendingErase.x, pendingErase.y, pendingErase.width, pendingErase.height);
        }
    }, [canvasW, canvasH, templateImg, fields, selectedField, signature, draggingSig, eventName, canvasMode, currentEraseBox, pendingErase]);

    useEffect(() => {
        const previewData = dataRows.length > 0 ? dataRows[previewIdx] : undefined;
        renderCanvas(previewData);
    }, [renderCanvas, dataRows, previewIdx]);

    // Keyboard nudging for fine placement
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (canvasMode !== "select" || !selectedField) return;
            const step = e.shiftKey ? 10 : 1;
            if (e.key === "ArrowUp") {
                e.preventDefault();
                updateField(selectedField, { y: Math.max(0, (fields.find(f => f.id === selectedField)?.y || 0) - step) });
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                updateField(selectedField, { y: Math.min(canvasH, (fields.find(f => f.id === selectedField)?.y || 0) + step) });
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                updateField(selectedField, { x: Math.max(0, (fields.find(f => f.id === selectedField)?.x || 0) - step) });
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                updateField(selectedField, { x: Math.min(canvasW, (fields.find(f => f.id === selectedField)?.x || 0) + step) });
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedField, fields, canvasW, canvasH, canvasMode]);

    // ─── CANVAS MOUSE HANDLERS ──────────────────────────────────────
    const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        return {
            x: (e.clientX - rect.left) * (canvasW / rect.width),
            y: (e.clientY - rect.top) * (canvasH / rect.height)
        };
    };

    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const pos = getCanvasPos(e);

        if (canvasMode === "erase") {
            setIsDrawingErase(true);
            setEraseStartPos(pos);
            setCurrentEraseBox({ x: pos.x, y: pos.y, width: 0, height: 0 });
            setPendingErase(null);
            return;
        }

        // Selection Mode
        if (signature.image &&
            pos.x >= signature.x && pos.x <= signature.x + signature.width &&
            pos.y >= signature.y && pos.y <= signature.y + signature.height) {
            setDraggingSig(true);
            setSigDragOffset({ x: pos.x - signature.x, y: pos.y - signature.y });
            setSelectedField(null);
            return;
        }

        for (const f of [...fields].reverse()) {
            const halfH = f.fontSize / 2 + 8;
            const halfW = f.width / 2 + 10;
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

        if (canvasMode === "erase" && isDrawingErase && eraseStartPos) {
            const x = Math.min(eraseStartPos.x, pos.x);
            const y = Math.min(eraseStartPos.y, pos.y);
            const width = Math.abs(pos.x - eraseStartPos.x);
            const height = Math.abs(pos.y - eraseStartPos.y);
            setCurrentEraseBox({ x, y, width, height });
            return;
        }

        if (dragging) {
            updateField(dragging, {
                x: Math.round(Math.max(0, Math.min(canvasW, pos.x - dragOffset.x))),
                y: Math.round(Math.max(0, Math.min(canvasH, pos.y - dragOffset.y)))
            });
        }
        if (draggingSig) {
            setSignature(prev => ({
                ...prev,
                x: Math.round(Math.max(0, Math.min(canvasW - prev.width, pos.x - sigDragOffset.x))),
                y: Math.round(Math.max(0, Math.min(canvasH - prev.height, pos.y - sigDragOffset.y)))
            }));
        }
    };

    const handleCanvasMouseUp = () => {
        if (canvasMode === "erase" && isDrawingErase) {
            setIsDrawingErase(false);
            if (currentEraseBox && currentEraseBox.width > 10 && currentEraseBox.height > 6) {
                setPendingErase(currentEraseBox);

                // Sample background color to preview
                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext("2d");
                    if (ctx) {
                        const sampled = sampleBackgroundColor(
                            ctx,
                            currentEraseBox.x,
                            currentEraseBox.y,
                            currentEraseBox.width,
                            currentEraseBox.height
                        );
                        setSampledColorPreview(sampled.hex);
                    }
                }
            } else {
                setCurrentEraseBox(null);
            }
        }

        setDragging(null);
        setDraggingSig(false);
    };

    // ─── HIGH RESOLUTION CERTIFICATE GENERATION ──────────────────────
    const generateCertBlob = (row: DataRow, assignedVerificationId?: string): Promise<Blob> => {
        return new Promise((resolve) => {
            const offCanvas = document.createElement("canvas");
            const w = templateImg ? templateImg.width : (canvasW * 2);
            const h = templateImg ? templateImg.height : (canvasH * 2);
            offCanvas.width = w;
            offCanvas.height = h;
            const ctx = offCanvas.getContext("2d")!;
            const fullScale = w / canvasW;

            if (templateImg) {
                ctx.drawImage(templateImg, 0, 0, w, h);
            }

            fields.forEach(f => {
                let text = "";
                if (f.label.toLowerCase() === "verification id") {
                    text = assignedVerificationId || row["verification_id"] || "TS-2026-X8K9M2";
                } else if (f.label.toLowerCase() === "event" && (!row[f.label] || row[f.label] === "")) {
                    text = eventName;
                } else if (row[f.label] !== undefined && row[f.label] !== "") {
                    text = row[f.label];
                }

                ctx.font = `${f.bold ? "bold " : ""}${f.fontSize * fullScale}px "${f.fontFamily}", sans-serif`;
                ctx.fillStyle = f.color;
                ctx.textAlign = f.alignment;
                ctx.textBaseline = "middle";
                ctx.fillText(text, f.x * fullScale, f.y * fullScale, f.width * fullScale);
            });

            if (signature.image) {
                ctx.drawImage(
                    signature.image,
                    signature.x * fullScale,
                    signature.y * fullScale,
                    signature.width * fullScale,
                    signature.height * fullScale
                );
            }

            offCanvas.toBlob(blob => resolve(blob!), "image/png", 0.95);
        });
    };

    // ─── DOWNLOAD SINGLE CERTIFICATE ─────────────────────────────────
    const downloadSingleCert = async (row: DataRow, idx: number, format: "png" | "pdf" = "png") => {
        const vId = generateVerificationId();
        const blob = await generateCertBlob(row, vId);
        const name = (row.Name || row.name || `Recipient_${idx + 1}`).trim().replace(/\s+/g, "_");

        if (format === "pdf") {
            const url = URL.createObjectURL(blob);
            const printWindow = window.open("", "_blank");
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                    <head>
                        <title>TechShastra Certificate - ${name}</title>
                        <style>
                            @page { size: landscape; margin: 0; }
                            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #000; }
                            img { max-width: 100%; max-height: 100vh; object-fit: contain; }
                        </style>
                    </head>
                    <body>
                        <img src="${url}" />
                    </body>
                    </html>
                `);
                printWindow.document.close();
                setTimeout(() => {
                    printWindow.print();
                    URL.revokeObjectURL(url);
                }, 600);
            }
        } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `TechShastra_Certificate_${name}.png`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    // ─── BULK DOWNLOAD AS ZIP ────────────────────────────────────────
    const downloadAllAsZip = async () => {
        if (dataRows.length === 0) {
            toast({ title: "No Recipients", description: "Add recipients first.", variant: "destructive" });
            return;
        }

        setIsZipping(true);
        setSendProgress(0);

        try {
            const zip = new JSZip();
            const folder = zip.folder("certificates");

            for (let i = 0; i < dataRows.length; i++) {
                const row = dataRows[i];
                const vId = generateVerificationId();
                const blob = await generateCertBlob(row, vId);
                const safeName = (row.Name || row.name || `Participant_${i + 1}`).trim().replace(/[^a-zA-Z0-9_-]/g, "_");
                folder?.file(`${i + 1}_${safeName}_${vId}.png`, blob);
                setSendProgress(Math.round(((i + 1) / dataRows.length) * 100));
            }

            const zipBlob = await zip.generateAsync({ type: "blob" });
            const zipUrl = URL.createObjectURL(zipBlob);
            const a = document.createElement("a");
            a.href = zipUrl;
            const safeEventName = eventName.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
            a.download = `${safeEventName}_Certificates.zip`;
            a.click();
            URL.revokeObjectURL(zipUrl);

            toast({
                title: "ZIP Package Generated",
                description: `Successfully bundled ${dataRows.length} high-res certificates!`
            });
        } catch (err) {
            console.error("ZIP creation failed:", err);
            toast({ title: "ZIP Failed", description: "Failed to compress certificates.", variant: "destructive" });
        } finally {
            setIsZipping(false);
            setSendProgress(0);
        }
    };

    // ─── SEND TEST EMAIL TO ADMIN ────────────────────────────────────
    const sendTestEmail = async () => {
        if (!emailConfig.serviceId || !emailConfig.templateId || !emailConfig.publicKey) {
            toast({
                title: "EmailJS Incomplete",
                description: "Please configure Service ID, Template ID, and Public Key.",
                variant: "destructive"
            });
            return;
        }

        const adminEmail = prompt("Enter email address to send test certificate to:");
        if (!adminEmail || !adminEmail.includes("@")) return;

        setSending(true);
        const testVId = generateVerificationId();

        try {
            const previewRow = dataRows[previewIdx] || { Name: "Test Recipient" };
            const blob = await generateCertBlob(previewRow, testVId);

            const uploadedUrl = await uploadCertificateBlob(testVId, blob);
            const verifyUrl = `${window.location.origin}/verify/${testVId}`;

            await emailjs.send(
                emailConfig.serviceId,
                emailConfig.templateId,
                {
                    // Email aliases
                    to_email: adminEmail,
                    email: adminEmail,
                    recipient_email: adminEmail,
                    user_email: adminEmail,
                    to: adminEmail,

                    // Name aliases
                    to_name: previewRow.Name || "TechShastra Member",
                    name: previewRow.Name || "TechShastra Member",
                    recipient_name: previewRow.Name || "TechShastra Member",
                    student_name: previewRow.Name || "TechShastra Member",

                    // Event aliases
                    event_name: eventName,
                    event: eventName,

                    // Verification code aliases
                    verification_id: testVId,
                    certificate_id: testVId,
                    id: testVId,
                    code: testVId,

                    // Verification Link & Certificate URL aliases
                    verify_url: verifyUrl,
                    verification_url: verifyUrl,
                    link: verifyUrl,
                    url: verifyUrl,
                    certificate_url: uploadedUrl || verifyUrl,

                    // Date aliases
                    issue_date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
                    date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),

                    // Any and all custom spreadsheet columns (e.g. {{College}}, {{Role}}, etc.)
                    ...previewRow
                },
                emailConfig.publicKey
            );

            toast({
                title: "Test Email Dispatched",
                description: `Sent verification test certificate to ${adminEmail}`
            });
        } catch (err) {
            console.error("Test email failed:", err);
            toast({
                title: "Test Email Failed",
                description: err instanceof Error ? err.message : "Check your EmailJS credentials.",
                variant: "destructive"
            });
        } finally {
            setSending(false);
        }
    };

    // ─── SEND ALL CERTIFICATES VIA EMAIL ─────────────────────────────
    const sendCertificates = async () => {
        if (!emailConfig.serviceId || !emailConfig.templateId || !emailConfig.publicKey) {
            toast({
                title: "Missing EmailJS Credentials",
                description: "Set your Service ID, Template ID, and Public Key in Delivery settings.",
                variant: "destructive"
            });
            setActiveTab("delivery");
            return;
        }

        if (!emailConfig.emailField) {
            toast({ title: "No Email Column", description: "Select which column holds participant emails.", variant: "destructive" });
            setActiveTab("delivery");
            return;
        }

        if (dataRows.length === 0) {
            toast({ title: "No Recipients", description: "Import an Excel file or add rows.", variant: "destructive" });
            return;
        }

        setSending(true);
        setSendProgress(0);
        let success = 0;
        let failed = 0;
        const certRecords: CertificateInsert[] = [];
        const errorMessages: string[] = [];

        const job = await createCertificateJob(dataRows.length).catch(() => null);

        for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];
            const recipientEmail = row[emailConfig.emailField]?.trim();
            const recipientName = (row.Name || row.name || "Participant").trim();
            const rowEvent = row.Event || row.event || eventName;

            if (!recipientEmail || !recipientEmail.includes("@")) {
                failed++;
                errorMessages.push(`Row ${i + 1} (${recipientName}): Invalid email`);
                continue;
            }

            const verificationId = generateVerificationId();

            try {
                const blob = await generateCertBlob(row, verificationId);
                const storageUrl = await uploadCertificateBlob(verificationId, blob);
                const verifyUrl = `${window.location.origin}/verify/${verificationId}`;

                await emailjs.send(
                    emailConfig.serviceId,
                    emailConfig.templateId,
                    {
                        // Email aliases
                        to_email: recipientEmail,
                        email: recipientEmail,
                        recipient_email: recipientEmail,
                        user_email: recipientEmail,
                        to: recipientEmail,

                        // Name aliases
                        to_name: recipientName,
                        name: recipientName,
                        recipient_name: recipientName,
                        student_name: recipientName,

                        // Event aliases
                        event_name: rowEvent,
                        event: rowEvent,

                        // Verification code aliases
                        verification_id: verificationId,
                        certificate_id: verificationId,
                        id: verificationId,
                        code: verificationId,

                        // Verification Link & Certificate URL aliases
                        verify_url: verifyUrl,
                        verification_url: verifyUrl,
                        link: verifyUrl,
                        url: verifyUrl,
                        certificate_url: storageUrl || verifyUrl,

                        // Date aliases
                        issue_date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
                        date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),

                        // Any and all custom spreadsheet columns (e.g. {{College}}, {{Role}}, etc.)
                        ...row
                    },
                    emailConfig.publicKey
                );

                certRecords.push({
                    verification_id: verificationId,
                    recipient_name: recipientName,
                    recipient_email: recipientEmail,
                    event_name: rowEvent,
                    issue_date: new Date().toISOString().split("T")[0],
                    status: "active",
                    certificate_url: storageUrl,
                    metadata: Object.fromEntries(
                        Object.entries(row).filter(([k]) => !k.toLowerCase().includes("email"))
                    )
                });

                success++;
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                console.error(`Failed to send to ${recipientEmail}:`, msg);
                errorMessages.push(`${recipientName} (${recipientEmail}): ${msg}`);
                failed++;
            }

            setSendProgress(Math.round(((i + 1) / dataRows.length) * 100));
            setSendStats({ total: dataRows.length, sent: success, failed });

            if (job && (i % 5 === 0 || i === dataRows.length - 1)) {
                updateCertificateJobProgress(job.id, success, failed, "processing").catch(() => {});
            }

            await new Promise(r => setTimeout(r, 250));
        }

        if (certRecords.length > 0) {
            try {
                await recordCertificatesBatch(certRecords);
            } catch (err) {
                console.error("Failed to batch save certificates to Supabase:", err);
            }
        }

        if (job) {
            const finalStatus = failed === 0 ? "completed" : success === 0 ? "failed" : "completed";
            updateCertificateJobProgress(
                job.id,
                success,
                failed,
                finalStatus,
                errorMessages.length > 0 ? errorMessages.join("\n") : undefined
            ).catch(() => {});
        }

        setSending(false);
        toast({
            title: "Delivery Batch Completed",
            description: `Sent: ${success} | Failed: ${failed}. Verified certificates saved to database registry.`
        });

        loadCertificateHistory();
    };

    // ─── STATUS TOGGLE (REVOKE / ACTIVATE) ───────────────────────────
    const handleToggleStatus = async (cert: Certificate) => {
        const nextStatus: CertificateStatus = cert.status === "active" ? "revoked" : "active";
        const ok = await setCertificateStatus(cert.id, nextStatus);
        if (ok) {
            toast({
                title: nextStatus === "active" ? "Certificate Activated" : "Certificate Revoked",
                description: `${cert.recipient_name} (${cert.verification_id}) is now ${nextStatus}.`
            });
            loadCertificateHistory();
        } else {
            toast({ title: "Update Failed", variant: "destructive" });
        }
    };

    const handleDeleteCertificate = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete the certificate for ${name}?`)) return;
        const ok = await deleteCertificate(id);
        if (ok) {
            toast({ title: "Certificate Removed from Registry" });
            loadCertificateHistory();
        } else {
            toast({ title: "Delete Failed", variant: "destructive" });
        }
    };

    const sel = fields.find(f => f.id === selectedField);

    const filteredHistory = historyList.filter(c =>
        c.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.recipient_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.verification_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.event_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* ── TOP BAR: Event Context & Navigation ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-card/60 border border-primary/20 backdrop-blur-xl shadow-xl">
                <div className="space-y-1.5 flex-1 max-w-md">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                        <span className="text-xs font-semibold tracking-wider uppercase text-primary">Credential Delivery System</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="event-name" className="text-xs text-muted-foreground whitespace-nowrap">Event Title:</Label>
                        <Input
                            id="event-name"
                            value={eventName}
                            onChange={e => setEventName(e.target.value)}
                            placeholder="e.g. Annual Tech Symposium 2026"
                            className="h-8 text-sm bg-background/50 border-primary/20 focus:border-primary font-medium"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={generateDefaultTemplate}
                        className="h-8 text-xs gap-1.5 border-primary/30 hover:bg-primary/10"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        Default Template
                    </Button>

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={runOcrScan}
                        disabled={isScanningOcr || !templateDataUrl}
                        className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                    >
                        {isScanningOcr ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ScanText className="w-3.5 h-3.5" />}
                        Scan Template (OCR)
                    </Button>

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={downloadSampleCsv}
                        className="h-8 text-xs gap-1.5 border-border hover:bg-muted/40"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Sample Excel
                    </Button>

                    <div className="relative">
                        <Input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleExcelUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 bg-primary/10 border-primary/30 text-primary hover:bg-primary/20">
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            Import Participants ({dataRows.length})
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── MAIN TABS ── */}
            <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)} className="space-y-6">
                <TabsList className="bg-muted/30 border border-primary/10 p-1 rounded-xl">
                    <TabsTrigger value="designer" className="gap-2 text-xs py-1.5">
                        <Type className="w-3.5 h-3.5" /> Canvas & Layout
                    </TabsTrigger>
                    <TabsTrigger value="recipients" className="gap-2 text-xs py-1.5">
                        <FileSpreadsheet className="w-3.5 h-3.5" /> Recipients ({dataRows.length})
                    </TabsTrigger>
                    <TabsTrigger value="delivery" className="gap-2 text-xs py-1.5">
                        <Send className="w-3.5 h-3.5" /> Export & Email Delivery
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2 text-xs py-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" /> Issued Registry
                    </TabsTrigger>
                </TabsList>

                {/* ══════════════════════════════════════════════════════════
                    TAB 1: CANVAS & DESIGNER
                ══════════════════════════════════════════════════════════ */}
                <TabsContent value="designer" className="space-y-6">
                    {/* Upload Controls Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-card/40 border-primary/10">
                            <CardHeader className="py-3 px-4">
                                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Upload className="w-3.5 h-3.5 text-primary" /> Certificate Graphic Template (Pinterest / Custom)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 pt-0">
                                <div className="flex items-center gap-3">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleTemplateUpload}
                                        className="text-xs h-9 cursor-pointer"
                                    />
                                    {templateDataUrl && (
                                        <Badge variant="outline" className="text-[11px] text-emerald-400 border-emerald-500/30 whitespace-nowrap">
                                            ✓ Active
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-card/40 border-primary/10">
                            <CardHeader className="py-3 px-4">
                                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <PenLine className="w-3.5 h-3.5 text-primary" /> Signatory Signature (PNG)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 pt-0">
                                <div className="flex items-center gap-3">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleSignatureUpload}
                                        className="text-xs h-9 cursor-pointer"
                                    />
                                    {signature.image && (
                                        <div className="flex items-center gap-2">
                                            <img src={signature.dataUrl} alt="sig" className="h-7 border border-primary/20 rounded bg-white/10 px-1" />
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 w-7 p-0 text-destructive"
                                                onClick={() => setSignature(prev => ({ ...prev, image: null, dataUrl: "" }))}
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                {signature.image && (
                                    <div className="mt-2.5 flex items-center gap-3">
                                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">Width: {signature.width}px</span>
                                        <Slider
                                            value={[signature.width]}
                                            onValueChange={([v]) => setSignature(prev => ({
                                                ...prev, width: v, height: Math.round(v * 0.4)
                                            }))}
                                            min={50} max={300} step={5}
                                            className="w-full"
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── TOOLBAR: MODE SWITCHER & PLACEHOLDER TOOLS ── */}
                    <div className="p-3 rounded-xl bg-card/50 border border-primary/20 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-muted-foreground mr-1">Tool Mode:</span>
                            <Button
                                size="sm"
                                variant={canvasMode === "select" ? "default" : "outline"}
                                className="h-8 text-xs gap-1.5 font-medium"
                                onClick={() => {
                                    setCanvasMode("select");
                                    setPendingErase(null);
                                    setCurrentEraseBox(null);
                                }}
                            >
                                <Crosshair className="w-3.5 h-3.5" />
                                1. Move & Place Fields
                            </Button>

                            <Button
                                size="sm"
                                variant={canvasMode === "erase" ? "destructive" : "outline"}
                                className={`h-8 text-xs gap-1.5 font-medium ${
                                    canvasMode === "erase" ? "ring-2 ring-destructive/40" : "border-destructive/30 text-destructive hover:bg-destructive/10"
                                }`}
                                onClick={() => {
                                    setCanvasMode("erase");
                                    setSelectedField(null);
                                    toast({
                                        title: "Erase Placeholder Mode",
                                        description: "Drag a box over unwanted text (e.g. '[Name Here]') to cleanly patch it."
                                    });
                                }}
                            >
                                <Eraser className="w-3.5 h-3.5" />
                                2. Erase Placeholder (Patch Box)
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleUndoErase}
                                disabled={templateHistory.length === 0}
                                className="h-8 text-xs gap-1"
                                title="Undo last erase action"
                            >
                                <Undo2 className="w-3.5 h-3.5" /> Undo Erase ({templateHistory.length})
                            </Button>

                            {originalTemplateUrl && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleResetTemplate}
                                    className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
                                    title="Restore original unedited template image"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" /> Reset Template
                                </Button>
                            )}

                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={runOcrScan}
                                disabled={isScanningOcr || !templateDataUrl}
                                className="h-8 text-xs gap-1.5 bg-primary/20 text-primary hover:bg-primary/30"
                            >
                                {isScanningOcr ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                                AI Detect Placeholders
                            </Button>
                        </div>
                    </div>

                    {/* Pending Erase Action Confirmation Banner */}
                    {pendingErase && (
                        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Eraser className="w-4 h-4 text-destructive" />
                                    <span className="text-xs font-bold text-foreground">Area Selected for Inpainting</span>
                                    <Badge variant="outline" className="text-[10px] font-mono">
                                        {Math.round(pendingErase.width)}×{Math.round(pendingErase.height)}px
                                    </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    Automatically sampling surrounding background color to remove placeholder text.
                                </p>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
                                    <span>Fill Color:</span>
                                    <span
                                        className="w-5 h-5 rounded border border-border inline-block"
                                        style={{ backgroundColor: customFillColor || sampledColorPreview }}
                                        title="Color sampled from borders"
                                    />
                                    <Input
                                        type="color"
                                        value={customFillColor || sampledColorPreview}
                                        onChange={e => setCustomFillColor(e.target.value)}
                                        className="w-7 h-7 p-0.5 rounded cursor-pointer border-0"
                                        title="Pick exact custom fill color"
                                    />
                                </div>

                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-8 text-xs font-semibold"
                                    onClick={() => executeInpaint(pendingErase)}
                                >
                                    Erase Text Only
                                </Button>

                                <Button
                                    size="sm"
                                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                                    onClick={() => executeInpaint(pendingErase, "Name")}
                                >
                                    Erase & Place "Name"
                                </Button>

                                <Select onValueChange={(val) => executeInpaint(pendingErase, val)}>
                                    <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="Erase & Place..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Name">Place Name</SelectItem>
                                        <SelectItem value="Event">Place Event</SelectItem>
                                        <SelectItem value="Role">Place Role / Position</SelectItem>
                                        <SelectItem value="College">Place College</SelectItem>
                                        <SelectItem value="Date">Place Date</SelectItem>
                                        <SelectItem value="Verification ID">Place Verification ID</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    onClick={() => setPendingErase(null)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* OCR Results & Detected Placeholders Panel */}
                    {showOcrResults && (
                        <Card className="bg-card/60 border-primary/30 shadow-xl overflow-hidden animate-in fade-in">
                            <CardHeader className="py-3 px-4 bg-primary/5 flex flex-row items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ScanText className="w-4 h-4 text-primary" />
                                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-primary">
                                        AI Template Text Scanner ({detectedItems.length} text items, {detectedGaps.length} empty spaces)
                                    </CardTitle>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="default"
                                        className="h-7 text-xs bg-primary text-primary-foreground font-semibold"
                                        onClick={handleAutoConvertAllPlaceholders}
                                        disabled={detectedItems.filter(i => i.isPlaceholder).length === 0}
                                    >
                                        <Wand2 className="w-3 h-3 mr-1" />
                                        Auto-Clean All Placeholders ({detectedItems.filter(i => i.isPlaceholder).length})
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0"
                                        onClick={() => setShowOcrResults(false)}
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                {isScanningOcr && (
                                    <div className="space-y-2 py-4">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>{ocrStatusText}</span>
                                            <span className="font-mono">{ocrProgress}%</span>
                                        </div>
                                        <div className="w-full bg-muted/40 h-2 rounded-full overflow-hidden">
                                            <div className="bg-primary h-full transition-all duration-300" style={{ width: `${ocrProgress}%` }} />
                                        </div>
                                    </div>
                                )}

                                {/* Detected Empty Placement Spaces */}
                                {detectedGaps.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Sparkles className="w-3.5 h-3.5" /> Detected Natural Blank Spaces (Ideal for Student Name / Event):
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {detectedGaps.map(gap => (
                                                <div key={gap.id} className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs">
                                                    <div className="space-y-0.5">
                                                        <div className="font-medium text-foreground">{gap.label}</div>
                                                        <div className="text-[10px] text-muted-foreground">Gap height: {gap.height}px at Y: {gap.y}px</div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                                        onClick={() => handlePlaceInGap(gap)}
                                                    >
                                                        + Place "{gap.suggestedField}" Here
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Detected Text & Placeholders */}
                                <div className="space-y-2">
                                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        Detected Text Elements in Template:
                                    </div>
                                    <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                                        {detectedItems.length === 0 && !isScanningOcr && (
                                            <p className="text-xs text-muted-foreground italic py-3 text-center">No text detected. Try visual 'Erase Placeholder' box tool.</p>
                                        )}
                                        {detectedItems.map(item => (
                                            <div
                                                key={item.id}
                                                className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-3 transition-colors ${
                                                    item.isPlaceholder
                                                        ? "bg-primary/10 border-primary/30"
                                                        : "bg-muted/10 border-border/40"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    {item.isPlaceholder ? (
                                                        <Badge variant="outline" className="text-[10px] bg-primary/20 text-primary border-primary/30 whitespace-nowrap">
                                                            Placeholder
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                            Static Text
                                                        </Badge>
                                                    )}
                                                    <span className="font-mono truncate font-medium text-foreground">"{item.text}"</span>
                                                </div>

                                                <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-6 text-[11px] px-2 text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleOcrConvert(item, "")}
                                                        title="Erase this text from background image"
                                                    >
                                                        Erase
                                                    </Button>

                                                    <Button
                                                        size="sm"
                                                        className="h-6 text-[11px] px-2 bg-primary text-primary-foreground font-medium"
                                                        onClick={() => handleOcrConvert(item, item.suggestedField)}
                                                        title="Erase & place dynamic editable text"
                                                    >
                                                        Erase & Replace with "{item.suggestedField}"
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Quick Add Preset Fields */}
                    <Card className="bg-card/30 border-primary/10">
                        <CardContent className="py-3 px-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                <Plus className="w-3.5 h-3.5 text-primary" /> Place Standard Editable Fields:
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => addPresetField("Name", "Poppins", 34, "#f6e05e")}>
                                    + Recipient Name
                                </Button>
                                <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => addPresetField("Event", "Poppins", 26, "#ffffff")}>
                                    + Event Name
                                </Button>
                                <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => addPresetField("Role", "Inter", 20, "#38bdf8")}>
                                    + Role / Position
                                </Button>
                                <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => addPresetField("College", "Inter", 18, "#94a3b8")}>
                                    + College / Dept
                                </Button>
                                <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => addPresetField("Date", "Inter", 16, "#f1f5f9")}>
                                    + Issue Date
                                </Button>
                                <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => addPresetField("Verification ID", "Courier New", 14, "#38bdf8")}>
                                    + Verification ID
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs border-dashed" onClick={() => addPresetField(`Custom_${fields.length + 1}`)}>
                                    + Custom
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Live Canvas Preview */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`text-xs ${canvasMode === "erase" ? "bg-destructive/10 text-destructive border-destructive/30" : "bg-primary/10 text-primary border-primary/20"}`}>
                                    {canvasMode === "erase" ? "Eraser Mode Active" : "Field Placement Mode"}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    {canvasMode === "erase"
                                        ? "Drag a rectangle over any unwanted text on the template to cleanly erase it."
                                        : "Click & drag fields to position. Use arrow keys for 1px micro-adjustment (Shift for 10px)."}
                                </span>
                            </div>

                            {dataRows.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={previewIdx === 0}
                                        onClick={() => setPreviewIdx(i => i - 1)}
                                        className="h-7 px-2"
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                    </Button>
                                    <span className="text-xs text-muted-foreground">
                                        Row {previewIdx + 1} of {dataRows.length}: <strong className="text-foreground">{dataRows[previewIdx]?.Name || "Participant"}</strong>
                                    </span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={previewIdx >= dataRows.length - 1}
                                        onClick={() => setPreviewIdx(i => i + 1)}
                                        className="h-7 px-2"
                                    >
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-center p-4 rounded-2xl bg-black/40 border border-primary/20 shadow-2xl overflow-hidden">
                            <div style={{ maxWidth: canvasW, width: "100%" }} className="relative rounded-lg overflow-hidden ring-1 ring-border/50">
                                <canvas
                                    ref={canvasRef}
                                    width={canvasW}
                                    height={canvasH}
                                    className={`w-full select-none block ${canvasMode === "erase" ? "cursor-crosshair" : "cursor-move"}`}
                                    onMouseDown={handleCanvasMouseDown}
                                    onMouseMove={handleCanvasMouseMove}
                                    onMouseUp={handleCanvasMouseUp}
                                    onMouseLeave={handleCanvasMouseUp}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Field Customization Box */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Left: Active Fields List */}
                        <Card className="lg:col-span-1 bg-card/30 border-primary/10">
                            <CardHeader className="py-3 px-4">
                                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
                                    Placed Elements ({fields.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 space-y-1.5 max-h-72 overflow-y-auto">
                                {fields.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic text-center py-6">No fields on canvas. Click standard presets above.</p>
                                ) : (
                                    fields.map(f => (
                                        <div
                                            key={f.id}
                                            onClick={() => {
                                                setSelectedField(f.id);
                                                setCanvasMode("select");
                                            }}
                                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-all ${
                                                f.id === selectedField
                                                    ? "bg-primary/20 border border-primary/50 text-foreground font-medium"
                                                    : "bg-muted/10 hover:bg-muted/20 text-muted-foreground"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <GripVertical className="w-3.5 h-3.5 opacity-50" />
                                                <span>{f.label}</span>
                                                <span className="text-[10px] text-muted-foreground">({f.fontSize}px)</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: f.color }} />
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                                                    onClick={(e) => { e.stopPropagation(); removeField(f.id); }}
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        {/* Right: Selected Field Properties */}
                        <Card className="lg:col-span-2 bg-card/30 border-primary/10">
                            <CardHeader className="py-3 px-4">
                                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
                                    {sel ? `Editing: "${sel.label}"` : "Field Properties"}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                {sel ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Field Label (Excel Column Match)</Label>
                                                <Input
                                                    value={sel.label}
                                                    onChange={e => updateField(sel.id, { label: e.target.value })}
                                                    className="h-8 text-xs bg-background/50"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-xs">Typography / Font Family</Label>
                                                <Select value={sel.fontFamily} onValueChange={v => updateField(sel.id, { fontFamily: v })}>
                                                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="max-h-72">
                                                        {FONT_CATEGORIES.map(cat => (
                                                            <div key={cat.label}>
                                                                <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase bg-muted/40">
                                                                    {cat.label}
                                                                </div>
                                                                {cat.fonts.map(font => (
                                                                    <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                                                                        {font}
                                                                    </SelectItem>
                                                                ))}
                                                            </div>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span>Font Size</span>
                                                    <span className="text-primary font-mono">{sel.fontSize}px</span>
                                                </div>
                                                <Slider
                                                    value={[sel.fontSize]}
                                                    onValueChange={([v]) => updateField(sel.id, { fontSize: v })}
                                                    min={10} max={64} step={1}
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span>Max Text Width</span>
                                                    <span className="text-primary font-mono">{sel.width}px</span>
                                                </div>
                                                <Slider
                                                    value={[sel.width]}
                                                    onValueChange={([v]) => updateField(sel.id, { width: v })}
                                                    min={50} max={800} step={10}
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-xs">Alignment</Label>
                                                <div className="flex gap-1">
                                                    {(["left", "center", "right"] as CanvasTextAlign[]).map(al => (
                                                        <Button
                                                            key={al}
                                                            size="sm"
                                                            variant={sel.alignment === al ? "default" : "outline"}
                                                            className="flex-1 h-8 text-xs capitalize"
                                                            onClick={() => updateField(sel.id, { alignment: al })}
                                                        >
                                                            {al}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Color & Styling */}
                                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/40">
                                            <div className="flex items-center gap-2">
                                                <Label className="text-xs">Color Palette:</Label>
                                                <div className="flex items-center gap-1.5">
                                                    {PRESET_COLORS.map(c => (
                                                        <button
                                                            key={c.name}
                                                            title={c.name}
                                                            onClick={() => updateField(sel.id, { color: c.value })}
                                                            className={`w-5 h-5 rounded-full border transition-all ${
                                                                sel.color.toLowerCase() === c.value.toLowerCase() ? "ring-2 ring-primary scale-110" : "opacity-80 hover:opacity-100"
                                                            }`}
                                                            style={{ backgroundColor: c.value }}
                                                        />
                                                    ))}
                                                    <Input
                                                        type="color"
                                                        value={sel.color}
                                                        onChange={e => updateField(sel.id, { color: e.target.value })}
                                                        className="w-7 h-7 p-0.5 rounded cursor-pointer ml-1 border-0"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <Button
                                                    size="sm"
                                                    variant={sel.bold ? "default" : "outline"}
                                                    className="h-7 text-xs font-bold px-3"
                                                    onClick={() => updateField(sel.id, { bold: !sel.bold })}
                                                >
                                                    Bold (B)
                                                </Button>
                                                <span className="text-[11px] text-muted-foreground font-mono">
                                                    X: {sel.x} · Y: {sel.y}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-muted-foreground text-xs">
                                        Click any field on the canvas or in the list on the left to configure font, size, and styling.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ══════════════════════════════════════════════════════════
                    TAB 2: RECIPIENTS & SPREADSHEET
                ══════════════════════════════════════════════════════════ */}
                <TabsContent value="recipients" className="space-y-4">
                    <Card className="bg-card/40 border-primary/10">
                        <CardHeader className="py-4 px-6 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">Event Participants Registry</CardTitle>
                                <CardDescription className="text-xs">
                                    Each row corresponds to an issued certificate. Column headers auto-match the canvas fields.
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={addManualRow}>
                                    <Plus className="w-3.5 h-3.5" /> Add Row
                                </Button>
                                <div className="relative">
                                    <Input
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleExcelUpload}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full"
                                    />
                                    <Button size="sm" variant="secondary" className="h-8 text-xs gap-1">
                                        <FileSpreadsheet className="w-3.5 h-3.5" /> Replace via Excel
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-6 pb-6">
                            {dataRows.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground space-y-3">
                                    <FileSpreadsheet className="w-10 h-10 mx-auto text-muted-foreground/40" />
                                    <p className="text-sm">No recipients loaded yet.</p>
                                    <Button size="sm" variant="outline" onClick={downloadSampleCsv} className="text-xs">
                                        Download Sample Excel Template
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="overflow-x-auto rounded-xl border border-border/50">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-muted/40 uppercase tracking-wider text-[11px] text-muted-foreground border-b border-border/40">
                                                <tr>
                                                    <th className="py-2.5 px-3 w-10">#</th>
                                                    {Object.keys(dataRows[0]).map(col => (
                                                        <th key={col} className="py-2.5 px-3 min-w-[130px] font-medium">
                                                            {col}
                                                        </th>
                                                    ))}
                                                    <th className="py-2.5 px-3 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/20">
                                                {dataRows.map((row, idx) => (
                                                    <tr
                                                        key={idx}
                                                        className={`transition-colors ${idx === previewIdx ? "bg-primary/10" : "hover:bg-muted/20"}`}
                                                    >
                                                        <td className="py-2 px-3 font-mono text-muted-foreground">{idx + 1}</td>
                                                        {Object.keys(row).map(key => (
                                                            <td key={key} className="py-1.5 px-2">
                                                                <Input
                                                                    value={row[key]}
                                                                    onChange={e => updateRowValue(idx, key, e.target.value)}
                                                                    className="h-7 text-xs bg-transparent border-transparent hover:border-border/60 focus:border-primary"
                                                                />
                                                            </td>
                                                        ))}
                                                        <td className="py-2 px-3 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-7 w-7 p-0 text-primary hover:bg-primary/20"
                                                                    title="Live Preview Certificate"
                                                                    onClick={() => openRecipientPreview(idx)}
                                                                >
                                                                    <Eye className="w-3.5 h-3.5" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-7 w-7 p-0"
                                                                    title="Download PNG"
                                                                    onClick={() => downloadSingleCert(row, idx, "png")}
                                                                >
                                                                    <Download className="w-3.5 h-3.5" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                                                    title="Delete Row"
                                                                    onClick={() => removeRow(idx)}
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                                        <span>Total Participants: <strong>{dataRows.length}</strong></span>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 text-xs gap-1"
                                                onClick={downloadAllAsZip}
                                                disabled={isZipping || sending}
                                            >
                                                {isZipping ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileArchive className="w-3 h-3 text-emerald-400" />}
                                                Download All ({dataRows.length}) as ZIP
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ── MODAL: INDIVIDUAL RECIPIENT CERTIFICATE PREVIEW ── */}
                    <Dialog
                        open={modalRecipientIdx !== null}
                        onOpenChange={(open) => {
                            if (!open) {
                                if (modalPreviewUrl) URL.revokeObjectURL(modalPreviewUrl);
                                setModalRecipientIdx(null);
                                setModalPreviewUrl(null);
                            }
                        }}
                    >
                        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-card/95 border-primary/20 backdrop-blur-xl">
                            {modalRecipientIdx !== null && dataRows[modalRecipientIdx] && (
                                <div className="space-y-4">
                                    <DialogHeader>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div>
                                                <DialogTitle className="text-base flex items-center gap-2">
                                                    <ShieldCheck className="w-4 h-4 text-primary" />
                                                    Live Certificate Preview: {dataRows[modalRecipientIdx].Name || "Participant"}
                                                </DialogTitle>
                                                <DialogDescription className="text-xs">
                                                    Participant {modalRecipientIdx + 1} of {dataRows.length} · {dataRows[modalRecipientIdx].Email || "No Email"}
                                                </DialogDescription>
                                            </div>

                                            {/* Prev / Next recipient controls */}
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={modalRecipientIdx === 0}
                                                    onClick={() => openRecipientPreview(modalRecipientIdx - 1)}
                                                    className="h-8 text-xs gap-1"
                                                >
                                                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={modalRecipientIdx >= dataRows.length - 1}
                                                    onClick={() => openRecipientPreview(modalRecipientIdx + 1)}
                                                    className="h-8 text-xs gap-1"
                                                >
                                                    Next <ChevronRight className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogHeader>

                                    {/* Rendered Certificate Graphic Preview */}
                                    <div className="rounded-xl overflow-hidden border border-primary/20 bg-black/60 shadow-2xl flex items-center justify-center p-2 min-h-[300px]">
                                        {modalLoading ? (
                                            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                                <span className="text-xs">Rendering high-resolution certificate...</span>
                                            </div>
                                        ) : modalPreviewUrl ? (
                                            <img
                                                src={modalPreviewUrl}
                                                alt="Certificate Preview"
                                                className="w-full h-auto max-h-[60vh] object-contain rounded-lg shadow-lg"
                                            />
                                        ) : null}
                                    </div>

                                    {/* Actions Footer */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/40">
                                        <div className="text-xs text-muted-foreground">
                                            Event: <strong className="text-foreground">{dataRows[modalRecipientIdx].Event || eventName}</strong>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-xs gap-1.5"
                                                onClick={() => downloadSingleCert(dataRows[modalRecipientIdx], modalRecipientIdx, "pdf")}
                                            >
                                                <Printer className="w-3.5 h-3.5 text-blue-400" /> Print / Save as PDF
                                            </Button>

                                            <Button
                                                size="sm"
                                                className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                                                onClick={() => downloadSingleCert(dataRows[modalRecipientIdx], modalRecipientIdx, "png")}
                                            >
                                                <Download className="w-3.5 h-3.5" /> Download High-Res PNG
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </TabsContent>

                {/* ══════════════════════════════════════════════════════════
                    TAB 3: DELIVERY & EMAIL DISPATCH
                ══════════════════════════════════════════════════════════ */}
                <TabsContent value="delivery" className="space-y-6">
                    {(sending || isZipping) && (
                        <Card className="bg-primary/5 border-primary/30 animate-pulse">
                            <CardContent className="py-4 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-primary flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {sending ? "Delivering Certificates & Registering in Database..." : "Packaging High-Resolution ZIP..."}
                                    </span>
                                    <span className="font-mono font-bold text-foreground">{sendProgress}%</span>
                                </div>
                                <div className="w-full bg-muted/40 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-primary h-full transition-all duration-300 rounded-full"
                                        style={{ width: `${sendProgress}%` }}
                                    />
                                </div>
                                {sending && sendStats.total > 0 && (
                                    <div className="text-[11px] text-muted-foreground flex justify-between">
                                        <span>Sent: <strong className="text-emerald-400">{sendStats.sent}</strong></span>
                                        <span>Failed: <strong className="text-destructive">{sendStats.failed}</strong></span>
                                        <span>Total: <strong>{sendStats.total}</strong></span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* 1. Bulk Download Options */}
                        <Card className="bg-card/40 border-primary/10">
                            <CardHeader className="py-4 px-5">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                                    <FileArchive className="w-4 h-4 text-emerald-400" />
                                    1. Instant Bulk Download
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Render all certificates at high resolution without needing email delivery.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-5 pb-5 space-y-4">
                                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/10 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-[10px]">ZIP ARCHIVE</Badge>
                                            <span className="text-xs font-semibold">Recommended for bulk distribution</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">{dataRows.length} files</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Packages every participant's certificate into a single <code className="text-emerald-300 font-mono">.zip</code> named after this event.
                                    </p>
                                    <Button
                                        onClick={downloadAllAsZip}
                                        disabled={isZipping || sending || dataRows.length === 0}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-9 text-xs"
                                    >
                                        {isZipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                        Download All {dataRows.length} Certificates as ZIP
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs gap-1.5"
                                        disabled={dataRows.length === 0}
                                        onClick={() => downloadSingleCert(dataRows[previewIdx] || {}, previewIdx, "png")}
                                    >
                                        <Download className="w-3.5 h-3.5" /> Download Preview PNG
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs gap-1.5"
                                        disabled={dataRows.length === 0}
                                        onClick={() => downloadSingleCert(dataRows[previewIdx] || {}, previewIdx, "pdf")}
                                    >
                                        <Download className="w-3.5 h-3.5 text-blue-400" /> Print / Save as PDF
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. Automated Email Delivery via EmailJS */}
                        <Card className="bg-card/40 border-primary/10">
                            <CardHeader className="py-4 px-5">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                                    <Mail className="w-4 h-4 text-primary" />
                                    2. Automated Email Dispatch (EmailJS)
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Sends direct emails to each participant with their unique verification code and credential link.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-5 pb-5 space-y-4">
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-[11px]">Service ID (Gmail/Outlook)</Label>
                                        <Input
                                            value={emailConfig.serviceId}
                                            onChange={e => updateEmailConfig({ serviceId: e.target.value })}
                                            placeholder="service_xxx"
                                            className="h-8 text-xs font-mono"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[11px]">Template ID</Label>
                                        <Input
                                            value={emailConfig.templateId}
                                            onChange={e => updateEmailConfig({ templateId: e.target.value })}
                                            placeholder="template_xxx"
                                            className="h-8 text-xs font-mono"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[11px]">Public Key</Label>
                                        <Input
                                            value={emailConfig.publicKey}
                                            onChange={e => updateEmailConfig({ publicKey: e.target.value })}
                                            placeholder="public_xxx"
                                            className="h-8 text-xs font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-[11px]">Recipient Email Column</Label>
                                    <Select
                                        value={emailConfig.emailField}
                                        onValueChange={v => updateEmailConfig({ emailField: v })}
                                    >
                                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select email column" /></SelectTrigger>
                                        <SelectContent>
                                            {dataRows.length > 0 && Object.keys(dataRows[0]).map(col => (
                                                <SelectItem key={col} value={col}>{col}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={sendTestEmail}
                                        disabled={sending}
                                        className="flex-1 h-9 text-xs border-primary/30"
                                    >
                                        <Mail className="w-3.5 h-3.5 mr-1 text-primary" /> Test Single Send
                                    </Button>

                                    <Button
                                        onClick={sendCertificates}
                                        disabled={sending || dataRows.length === 0}
                                        className="flex-1 h-9 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                                    >
                                        {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Send className="w-3.5 h-3.5 mr-1" />}
                                        Send to All ({dataRows.length})
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ══════════════════════════════════════════════════════════
                    TAB 4: ISSUED REGISTRY
                ══════════════════════════════════════════════════════════ */}
                <TabsContent value="history" className="space-y-4">
                    <Card className="bg-card/40 border-primary/10">
                        <CardHeader className="py-4 px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-primary" /> Official Credentials Registry
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    All issued certificates recorded in Supabase PostgreSQL. Anyone can verify at <code className="text-primary">/verify/:id</code>.
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative w-64">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name, email, ID..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="h-8 pl-8 text-xs bg-background/50"
                                    />
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={loadCertificateHistory}
                                    disabled={loadingHistory}
                                    className="h-8 text-xs gap-1.5"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? "animate-spin" : ""}`} />
                                    Refresh
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="px-6 pb-6">
                            {loadingHistory ? (
                                <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                    <span className="text-xs">Loading database registry...</span>
                                </div>
                            ) : filteredHistory.length === 0 ? (
                                <div className="py-12 text-center text-muted-foreground space-y-2">
                                    <ShieldCheck className="w-8 h-8 mx-auto opacity-40" />
                                    <p className="text-sm">No issued certificates found matching criteria.</p>
                                    <p className="text-xs">Certificates generated via Email Delivery will automatically appear here.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-border/50">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-muted/40 uppercase tracking-wider text-[11px] text-muted-foreground border-b border-border/40">
                                            <tr>
                                                <th className="py-2.5 px-3">Credential ID</th>
                                                <th className="py-2.5 px-3">Recipient</th>
                                                <th className="py-2.5 px-3">Event</th>
                                                <th className="py-2.5 px-3">Issue Date</th>
                                                <th className="py-2.5 px-3">Status</th>
                                                <th className="py-2.5 px-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/20">
                                            {filteredHistory.map(cert => (
                                                <tr key={cert.id} className="hover:bg-muted/20 transition-colors">
                                                    <td className="py-2 px-3 font-mono font-medium text-primary">
                                                        <div className="flex items-center gap-1.5">
                                                            <span>{cert.verification_id}</span>
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(cert.verification_id);
                                                                    setCopiedId(cert.verification_id);
                                                                    setTimeout(() => setCopiedId(null), 1500);
                                                                }}
                                                                className="text-muted-foreground hover:text-foreground"
                                                                title="Copy ID"
                                                            >
                                                                {copiedId === cert.verification_id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <div className="font-medium text-foreground">{cert.recipient_name}</div>
                                                        <div className="text-[11px] text-muted-foreground">{cert.recipient_email}</div>
                                                    </td>
                                                    <td className="py-2 px-3 text-muted-foreground">{cert.event_name}</td>
                                                    <td className="py-2 px-3 text-muted-foreground font-mono">{cert.issue_date}</td>
                                                    <td className="py-2 px-3">
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[10px] uppercase font-semibold ${
                                                                cert.status === "active"
                                                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                                                    : cert.status === "revoked"
                                                                    ? "bg-destructive/10 text-destructive border-destructive/30"
                                                                    : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                                            }`}
                                                        >
                                                            {cert.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-2 px-3 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                asChild
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-7 w-7 p-0"
                                                                title="Open Public Verification Link"
                                                            >
                                                                <a href={`/verify/${cert.verification_id}`} target="_blank" rel="noopener noreferrer">
                                                                    <ExternalLink className="w-3.5 h-3.5 text-primary" />
                                                                </a>
                                                            </Button>

                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className={`h-7 px-2 text-[11px] ${cert.status === "active" ? "text-amber-400 hover:text-amber-300" : "text-emerald-400 hover:text-emerald-300"}`}
                                                                onClick={() => handleToggleStatus(cert)}
                                                            >
                                                                {cert.status === "active" ? "Revoke" : "Reactivate"}
                                                            </Button>

                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                                                onClick={() => handleDeleteCertificate(cert.id, cert.recipient_name)}
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default CertificateSender;
