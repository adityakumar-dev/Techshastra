# 17 — Certificate Sender

## What It Is

A **full-featured certificate generation and distribution tool** embedded in the Admin panel's "Certificates" tab. This is the single most complex component in the entire project (962 lines).

### Capabilities

1. **Template Upload**: Upload any certificate template image as a background
2. **Signature Upload**: Upload a signature image, drag to position and resize
3. **Live Canvas Editor**: Add text fields (name, role, date, etc.) with:
   - Font family selection (Standard, Hindi/Devanagari, Cursive/Script, Handwritten — 30+ fonts)
   - Font size, colour, alignment, bold toggle
   - Drag-and-drop positioning on the canvas
4. **Excel Import**: Upload `.xlsx/.xls/.csv` → auto-creates fields from column headers
5. **Manual Data Entry**: Add recipient rows manually
6. **Preview Navigation**: Step through each recipient to preview their certificate
7. **Bulk Download**: Export all certificates as PNG or PDF
8. **Email Distribution**: Send certificates individually via EmailJS with recipient-specific data

## Why It Was Built — The Story

After every event, workshop, or hackathon, the club needs to **generate and distribute hundreds of personalised certificates**. Before this tool, the process was:

1. Open Canva/Photoshop
2. Manually type each participant's name
3. Export → attach to email → send one by one

This was **brutally slow** for 250+ participant events. The Certificate Sender automates the entire pipeline:

- Upload a template once → map fields → import an Excel spreadsheet → preview → bulk send.
- The Devanagari font support was added because some events require **Hindi certificates**.
- The EmailJS integration means certificates go directly to participants' inboxes — no manual emailing.

## How It Works

### Files
| File | Purpose |
|------|---------|
| `src/components/CertificateSender.tsx` | Full certificate tool (962 lines) |

### Technical Details — Canvas Engine

1. **Canvas API**: Uses HTML5 `<canvas>` for real-time rendering. Template image is drawn first, then text fields are overlaid, then the signature.
2. **Drag system**: `mousedown → mousemove → mouseup` handlers track field/signature positions with offset correction.
3. **Full-resolution export**: Generates certificates at the original template resolution (not the scaled canvas size) using an off-screen canvas (`document.createElement("canvas")`).
4. **Selection indicators**: Selected fields get a dashed indigo border (`#6366f1`).
5. **Scale factor**: Canvas is scaled to fit `CANVAS_MAX_W = 900px` for the editor, but exports at full resolution.

### Technical Details — Data Pipeline

1. **Excel parsing**: Uses `SheetJS (xlsx)` to read `.xlsx/.xls/.csv` into JSON rows.
2. **Auto-mapping**: Column headers become field labels; `email` column is auto-detected for email sending.
3. **EmailJS sending**: Each certificate is generated as a PNG blob → converted to base64 → sent via `emailjs.send()` with recipient data.
4. **PDF export**: Uses a print-window approach — opens a new window with the certificate image and triggers `window.print()` for browser-native PDF save.

### Supported Font Families

| Category | Fonts |
|----------|-------|
| Standard | Arial, Times New Roman, Georgia, Courier New, Verdana, Trebuchet MS, Impact, Poppins, Inter, Sora |
| Hindi | Noto Sans Devanagari, Tiro Devanagari Hindi, Hind, Baloo 2, Mukta |
| Cursive | Dancing Script, Great Vibes, Pacifico, Satisfy, Sacramento, Alex Brush, Allura, Marck Script, Playball, Cookie |
| Handwritten | Caveat, Kalam, Indie Flower, Shadows Into Light, Patrick Hand, Amatic SC, Permanent Marker, Rock Salt |
