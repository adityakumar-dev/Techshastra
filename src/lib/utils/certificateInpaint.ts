/**
 * TechShastra Certificate Inpaint & Template Processing Utilities
 * Provides smart background color sampling, placeholder removal (inpainting),
 * and OCR text & empty space detection.
 */

export interface BoundingBox {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
}

export interface DetectedTextItem {
    id: string;
    text: string;
    bbox: BoundingBox;
    isPlaceholder: boolean;
    confidence: number;
    suggestedField: string;
}

export interface DetectedEmptySpace {
    id: string;
    y: number; // center Y
    height: number;
    suggestedField: string;
    label: string;
}

/**
 * Samples perimeter pixels around a bounding box and computes the
 * robust trimmed-average background color (filters out dark text and sharp edges).
 */
export function sampleBackgroundColor(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    padding = 6
): { r: number; g: number; b: number; hex: string } {
    const canvasW = ctx.canvas.width;
    const canvasH = ctx.canvas.height;

    const sampleLeft = Math.max(0, Math.round(x - padding));
    const sampleTop = Math.max(0, Math.round(y - padding));
    const sampleRight = Math.min(canvasW - 1, Math.round(x + w + padding));
    const sampleBottom = Math.min(canvasH - 1, Math.round(y + h + padding));

    const imgData = ctx.getImageData(0, 0, canvasW, canvasH);
    const data = imgData.data;

    const borderPixels: [number, number, number][] = [];

    // Top & bottom horizontal strips (outside the box)
    for (let sx = sampleLeft; sx <= sampleRight; sx++) {
        for (let p = 1; p <= padding; p++) {
            const topY = Math.max(0, Math.round(y - p));
            let idx = (topY * canvasW + sx) * 4;
            borderPixels.push([data[idx], data[idx + 1], data[idx + 2]]);

            const botY = Math.min(canvasH - 1, Math.round(y + h + p));
            idx = (botY * canvasW + sx) * 4;
            borderPixels.push([data[idx], data[idx + 1], data[idx + 2]]);
        }
    }

    // Left & right vertical strips
    for (let sy = sampleTop; sy <= sampleBottom; sy++) {
        for (let p = 1; p <= padding; p++) {
            const leftX = Math.max(0, Math.round(x - p));
            let idx = (sy * canvasW + leftX) * 4;
            borderPixels.push([data[idx], data[idx + 1], data[idx + 2]]);

            const rightX = Math.min(canvasW - 1, Math.round(x + w + p));
            idx = (sy * canvasW + rightX) * 4;
            borderPixels.push([data[idx], data[idx + 1], data[idx + 2]]);
        }
    }

    if (borderPixels.length === 0) {
        return { r: 255, g: 255, b: 255, hex: "#ffffff" };
    }

    // Sort pixels by luminance to discard text artifacts and dark/bright outlier strokes
    borderPixels.sort((a, b) => {
        const lumA = 0.299 * a[0] + 0.587 * a[1] + 0.114 * a[2];
        const lumB = 0.299 * b[0] + 0.587 * b[1] + 0.114 * b[2];
        return lumA - lumB;
    });

    // Discard top 25% and bottom 25% (trimmed mean)
    const start = Math.floor(borderPixels.length * 0.25);
    const end = Math.ceil(borderPixels.length * 0.75);

    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    for (let i = start; i < end; i++) {
        rSum += borderPixels[i][0];
        gSum += borderPixels[i][1];
        bSum += borderPixels[i][2];
        count++;
    }

    const r = count > 0 ? Math.round(rSum / count) : 255;
    const g = count > 0 ? Math.round(gSum / count) : 255;
    const b = count > 0 ? Math.round(bSum / count) : 255;

    const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    return { r, g, b, hex };
}

/**
 * Erases (inpaints) a specific rectangle from an image by drawing it on a full-res canvas,
 * filling the rectangle with the sampled background color, and returning a new HTMLImageElement.
 */
export async function inpaintRectOnImage(
    img: HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number,
    customColor?: string
): Promise<{ dataUrl: string; image: HTMLImageElement; color: string }> {
    return new Promise((resolve, reject) => {
        try {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Could not get canvas context");

            // Draw original image
            ctx.drawImage(img, 0, 0, img.width, img.height);

            // Determine fill color
            let fillColor = customColor;
            if (!fillColor) {
                const sampled = sampleBackgroundColor(ctx, x, y, w, h);
                fillColor = sampled.hex;
            }

            // Fill rectangle over the placeholder
            ctx.fillStyle = fillColor;
            ctx.fillRect(Math.max(0, x), Math.max(0, y), w, h);

            // Soft blur around the patch edges for seamless blending
            ctx.strokeStyle = fillColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(Math.max(0, x - 1), Math.max(0, y - 1), w + 2, h + 2);

            const dataUrl = canvas.toDataURL("image/png");
            const newImg = new Image();
            newImg.onload = () => resolve({ dataUrl, image: newImg, color: fillColor! });
            newImg.onerror = reject;
            newImg.src = dataUrl;
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Analyzes OCR text lines and identifies whether they are placeholders
 * (e.g. "[Name Here]", "John Doe", "Candidate Name", "DD/MM/YYYY").
 */
export function classifyOcrText(rawText: string): { isPlaceholder: boolean; suggestedField: string } {
    const text = rawText.trim().toLowerCase();

    // Check for explicit brackets like [Name], {Name}, <Name>
    if (/[\[{(<].*?[\]})>]/.test(rawText)) {
        if (/name|student|recipient|participant|person/.test(text)) {
            return { isPlaceholder: true, suggestedField: "Name" };
        }
        if (/event|competition|hackathon|workshop|symposium/.test(text)) {
            return { isPlaceholder: true, suggestedField: "Event" };
        }
        if (/date|day|year|time/.test(text)) {
            return { isPlaceholder: true, suggestedField: "Date" };
        }
        if (/role|position|rank|winner|place/.test(text)) {
            return { isPlaceholder: true, suggestedField: "Role" };
        }
        if (/college|school|university|institute/.test(text)) {
            return { isPlaceholder: true, suggestedField: "College" };
        }
        if (/id|verify|credential|code/.test(text)) {
            return { isPlaceholder: true, suggestedField: "Verification ID" };
        }
        return { isPlaceholder: true, suggestedField: "Name" };
    }

    // Common template placeholder dummy names and terms
    if (/^(john doe|jane doe|your name|full name|recipient name|student name|participant name|first last|name here|candidate name|insert name)$/.test(text)) {
        return { isPlaceholder: true, suggestedField: "Name" };
    }
    if (/^(event name|competition name|workshop name|insert event|event here)$/.test(text)) {
        return { isPlaceholder: true, suggestedField: "Event" };
    }
    if (/^(dd[\/\-\.]mm[\/\-\.]yyyy|mm[\/\-\.]dd[\/\-\.]yyyy|date here|issue date|00\/00\/0000|01\/01\/202\d)$/.test(text)) {
        return { isPlaceholder: true, suggestedField: "Date" };
    }
    if (/^(first place|second place|runner up|participant|winner|position here)$/.test(text)) {
        return { isPlaceholder: true, suggestedField: "Role" };
    }
    if (/^(university name|college name|institute name|school name)$/.test(text)) {
        return { isPlaceholder: true, suggestedField: "College" };
    }

    return { isPlaceholder: false, suggestedField: "Text" };
}

/**
 * Finds vertical empty spaces (gaps) between detected text lines in the middle
 * section of a certificate (where student names or events typically go).
 */
export function detectEmptySpaces(
    items: { bbox: BoundingBox; text: string }[],
    imgW: number,
    imgH: number
): DetectedEmptySpace[] {
    const spaces: DetectedEmptySpace[] = [];
    if (items.length < 2) return spaces;

    // Sort items by Y0 top coordinate
    const sorted = [...items].sort((a, b) => a.bbox.y0 - b.bbox.y0);

    for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];

        const gapY0 = current.bbox.y1;
        const gapY1 = next.bbox.y0;
        const gapHeight = gapY1 - gapY0;

        // Look for significant gap in upper/middle vertical section (25% to 75% height)
        const midY = (gapY0 + gapY1) / 2;
        if (midY >= imgH * 0.25 && midY <= imgH * 0.75 && gapHeight >= imgH * 0.07) {
            spaces.push({
                id: `space_${i}`,
                y: Math.round(midY),
                height: Math.round(gapHeight),
                suggestedField: spaces.length === 0 ? "Name" : "Event",
                label: `Empty Gap (${Math.round(gapHeight)}px) between "${current.text.slice(0, 20)}..." and "${next.text.slice(0, 20)}..."`
            });
        }
    }

    return spaces;
}
