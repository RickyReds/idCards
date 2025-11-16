/**
 * Exporter - Esporta il canvas in vari formati (PDF, PNG, JPG)
 */
class Exporter {
    constructor() {
        // jsPDF sarà caricato da CDN
        this.defaultDPI = 300;
    }

    /**
     * Calcola dimensioni reali in mm da pixel e DPI
     * @param {number} pixels - Dimensione in pixel
     * @param {number} dpi - DPI dell'immagine
     * @returns {number} Dimensione in mm
     */
    pixelsToMM(pixels, dpi = 300) {
        return (pixels / dpi) * 25.4; // inches to mm
    }

    /**
     * Esporta come PDF
     * @param {HTMLCanvasElement} canvas - Canvas da esportare
     * @param {string} filename - Nome del file
     */
    async exportAsPDF(canvas, filename = 'documento_identita.pdf') {
        const { jsPDF } = window.jspdf;

        // Leggi DPI dal canvas (se disponibili)
        const dpi = canvas.dpi || this.defaultDPI;

        // Calcola dimensioni reali in mm basandosi sui DPI
        const widthMM = this.pixelsToMM(canvas.width, dpi);
        const heightMM = this.pixelsToMM(canvas.height, dpi);

        console.log(`📄 Export PDF: ${canvas.width}×${canvas.height}px @ ${dpi}DPI → ${widthMM.toFixed(1)}×${heightMM.toFixed(1)}mm`);

        // Determina orientamento
        const isLandscape = widthMM > heightMM;

        // Crea PDF con dimensioni basate sulle dimensioni reali del canvas
        // Se il documento è più grande di A4, usa A4 come massimo
        const maxA4Width = isLandscape ? 297 : 210;
        const maxA4Height = isLandscape ? 210 : 297;

        // Calcola se serve ridimensionare per stare in A4
        const scaleWidth = widthMM > maxA4Width ? maxA4Width / widthMM : 1;
        const scaleHeight = heightMM > maxA4Height ? maxA4Height / heightMM : 1;
        const scale = Math.min(scaleWidth, scaleHeight, 1);

        const finalWidthMM = widthMM * scale;
        const finalHeightMM = heightMM * scale;

        const pdf = new jsPDF({
            orientation: isLandscape ? 'landscape' : 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Converti canvas in immagine
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        // Centra l'immagine sulla pagina A4
        const x = (maxA4Width - finalWidthMM) / 2;
        const y = (maxA4Height - finalHeightMM) / 2;

        // Aggiungi immagine con dimensioni corrette
        pdf.addImage(imgData, 'JPEG', x, y, finalWidthMM, finalHeightMM);

        if (scale < 1) {
            console.log(`⚠️ Documento ridimensionato a ${(scale * 100).toFixed(1)}% per stare in A4`);
        } else {
            console.log(`✅ Documento esportato a dimensioni originali`);
        }

        // Salva
        pdf.save(filename);
    }

    /**
     * Esporta come PNG
     * @param {HTMLCanvasElement} canvas - Canvas da esportare
     * @param {string} filename - Nome del file
     */
    async exportAsPNG(canvas, filename = 'documento_identita.png') {
        const blob = await this.canvasToBlob(canvas, 'image/png');
        this.downloadBlob(blob, filename);
    }

    /**
     * Esporta come JPG
     * @param {HTMLCanvasElement} canvas - Canvas da esportare
     * @param {string} filename - Nome del file
     */
    async exportAsJPG(canvas, filename = 'documento_identita.jpg') {
        const blob = await this.canvasToBlob(canvas, 'image/jpeg', 0.95);
        this.downloadBlob(blob, filename);
    }

    /**
     * Converti canvas in Blob
     * @param {HTMLCanvasElement} canvas - Canvas da convertire
     * @param {string} mimeType - Tipo MIME
     * @param {number} quality - Qualità (0-1)
     * @returns {Promise<Blob>}
     */
    canvasToBlob(canvas, mimeType = 'image/png', quality = 0.92) {
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, mimeType, quality);
        });
    }

    /**
     * Download di un Blob
     * @param {Blob} blob - Blob da scaricare
     * @param {string} filename - Nome del file
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Rilascia URL
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    /**
     * Esporta nel formato specificato
     * @param {HTMLCanvasElement} canvas - Canvas da esportare
     * @param {string} format - Formato ('pdf', 'png', 'jpg')
     * @param {string} filename - Nome del file (opzionale)
     */
    async export(canvas, format = 'pdf', filename = null) {
        if (!filename) {
            const timestamp = new Date().toISOString().slice(0, 10);
            filename = `documento_identita_${timestamp}`;
        }

        // Rimuovi estensione se presente
        filename = filename.replace(/\.(pdf|png|jpe?g)$/i, '');

        switch (format.toLowerCase()) {
            case 'pdf':
                await this.exportAsPDF(canvas, `${filename}.pdf`);
                break;

            case 'png':
                await this.exportAsPNG(canvas, `${filename}.png`);
                break;

            case 'jpg':
            case 'jpeg':
                await this.exportAsJPG(canvas, `${filename}.jpg`);
                break;

            default:
                throw new Error(`Formato non supportato: ${format}`);
        }
    }
}
