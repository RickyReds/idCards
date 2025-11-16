/**
 * Exporter - Esporta il canvas in vari formati (PDF, PNG, JPG)
 */
class Exporter {
    constructor() {
        // jsPDF sarà caricato da CDN
    }

    /**
     * Esporta come PDF
     * @param {HTMLCanvasElement} canvas - Canvas da esportare
     * @param {string} filename - Nome del file
     */
    async exportAsPDF(canvas, filename = 'documento_identita.pdf') {
        const { jsPDF } = window.jspdf;

        // Crea PDF in formato A4 (210 x 297 mm)
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Converti canvas in immagine
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        // Aggiungi immagine al PDF (copre tutta la pagina A4)
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);

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
