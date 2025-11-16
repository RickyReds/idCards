/**
 * ImageProcessor - Processa immagini (rotazione, allineamento, ottimizzazione)
 */
class ImageProcessor {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    /**
     * Carica un file immagine
     * @param {File} file - File da caricare
     * @returns {Promise<HTMLImageElement>}
     */
    async loadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = e.target.result;
            };

            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Carica PDF e converti in immagine
     * @param {File} file - File PDF
     * @returns {Promise<HTMLImageElement>}
     */
    async loadPDF(file) {
        // Per semplicità, chiediamo all'utente di convertire il PDF prima
        // In una versione completa, si userebbe PDF.js
        throw new Error('Per ora, converti il PDF in immagine (JPG/PNG) prima del caricamento');
    }

    /**
     * Rileva l'angolo di rotazione del documento
     * @param {HTMLCanvasElement} canvas - Canvas con il documento
     * @returns {number} Angolo in gradi
     */
    detectRotation(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Rileva linee orizzontali usando trasformata di Hough semplificata
        const edges = this.detectHorizontalEdges(imageData);
        const angle = this.calculateDominantAngle(edges, canvas.width, canvas.height);

        return angle;
    }

    /**
     * Rileva bordi orizzontali predominanti
     */
    detectHorizontalEdges(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const edges = [];

        // Scansiona ogni riga cercando variazioni di intensità
        for (let y = 1; y < height - 1; y++) {
            let edgeStrength = 0;

            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                const topIdx = ((y - 1) * width + x) * 4;
                const bottomIdx = ((y + 1) * width + x) * 4;

                const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                const top = (data[topIdx] + data[topIdx + 1] + data[topIdx + 2]) / 3;
                const bottom = (data[bottomIdx] + data[bottomIdx + 1] + data[bottomIdx + 2]) / 3;

                edgeStrength += Math.abs(current - top) + Math.abs(current - bottom);
            }

            if (edgeStrength > width * 10) { // Soglia arbitraria
                edges.push({y, strength: edgeStrength});
            }
        }

        return edges;
    }

    /**
     * Calcola l'angolo dominante dai bordi
     */
    calculateDominantAngle(edges, width, height) {
        if (edges.length < 2) return 0;

        // Trova le due linee più forti (probabilmente bordi superiore e inferiore)
        const sortedEdges = edges.sort((a, b) => b.strength - a.strength).slice(0, 2);

        // Calcola angolo medio (semplicistico)
        // In una versione completa, si userebbe la trasformata di Hough
        const avgY = sortedEdges.reduce((sum, e) => sum + e.y, 0) / sortedEdges.length;
        const deviation = Math.abs(avgY - height / 2);

        // Se la deviazione è alta, probabilmente il documento è ruotato
        // Calcola approssimazione dell'angolo
        const angle = Math.atan2(deviation, width) * (180 / Math.PI);

        // Limita a piccoli angoli (-15 a +15 gradi)
        return Math.max(-15, Math.min(15, angle * (avgY < height / 2 ? 1 : -1)));
    }

    /**
     * Ruota un canvas di un angolo specificato
     * @param {HTMLCanvasElement} sourceCanvas - Canvas sorgente
     * @param {number} angle - Angolo in gradi
     * @returns {HTMLCanvasElement} Nuovo canvas ruotato
     */
    rotateCanvas(sourceCanvas, angle) {
        const angleRad = (angle * Math.PI) / 180;

        // Calcola dimensioni del nuovo canvas
        const cos = Math.abs(Math.cos(angleRad));
        const sin = Math.abs(Math.sin(angleRad));
        const newWidth = Math.ceil(sourceCanvas.width * cos + sourceCanvas.height * sin);
        const newHeight = Math.ceil(sourceCanvas.width * sin + sourceCanvas.height * cos);

        const rotatedCanvas = document.createElement('canvas');
        rotatedCanvas.width = newWidth;
        rotatedCanvas.height = newHeight;
        const ctx = rotatedCanvas.getContext('2d');

        // Ruota attorno al centro
        ctx.translate(newWidth / 2, newHeight / 2);
        ctx.rotate(angleRad);
        ctx.drawImage(sourceCanvas, -sourceCanvas.width / 2, -sourceCanvas.height / 2);

        return rotatedCanvas;
    }

    /**
     * Auto-allinea un documento (rileva e corregge rotazione)
     * @param {HTMLCanvasElement} canvas - Canvas con il documento
     * @returns {HTMLCanvasElement} Canvas allineato
     */
    autoAlign(canvas) {
        const angle = this.detectRotation(canvas);

        if (Math.abs(angle) < 0.5) {
            return canvas; // Già allineato
        }

        return this.rotateCanvas(canvas, -angle);
    }

    /**
     * Ridimensiona un canvas mantenendo l'aspect ratio
     * @param {HTMLCanvasElement} sourceCanvas - Canvas sorgente
     * @param {number} maxWidth - Larghezza massima
     * @param {number} maxHeight - Altezza massima
     * @returns {HTMLCanvasElement} Canvas ridimensionato
     */
    resize(sourceCanvas, maxWidth, maxHeight) {
        const ratio = Math.min(
            maxWidth / sourceCanvas.width,
            maxHeight / sourceCanvas.height
        );

        if (ratio >= 1) return sourceCanvas;

        const resizedCanvas = document.createElement('canvas');
        resizedCanvas.width = Math.floor(sourceCanvas.width * ratio);
        resizedCanvas.height = Math.floor(sourceCanvas.height * ratio);

        const ctx = resizedCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(sourceCanvas, 0, 0, resizedCanvas.width, resizedCanvas.height);

        return resizedCanvas;
    }

    /**
     * Migliora la qualità dell'immagine (contrasto, luminosità)
     * @param {HTMLCanvasElement} canvas - Canvas da migliorare
     * @returns {HTMLCanvasElement} Canvas migliorato
     */
    enhance(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Applica leggero aumento del contrasto
        const contrast = 1.1;
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

        for (let i = 0; i < data.length; i += 4) {
            data[i] = factor * (data[i] - 128) + 128;         // R
            data[i + 1] = factor * (data[i + 1] - 128) + 128; // G
            data[i + 2] = factor * (data[i + 2] - 128) + 128; // B
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    /**
     * Converte canvas in data URL
     * @param {HTMLCanvasElement} canvas - Canvas da convertire
     * @param {string} format - Formato ('image/png', 'image/jpeg')
     * @param {number} quality - Qualità (0-1)
     * @returns {string} Data URL
     */
    toDataURL(canvas, format = 'image/png', quality = 0.92) {
        return canvas.toDataURL(format, quality);
    }

    /**
     * Converte canvas in Blob
     * @param {HTMLCanvasElement} canvas - Canvas da convertire
     * @param {string} format - Formato ('image/png', 'image/jpeg')
     * @param {number} quality - Qualità (0-1)
     * @returns {Promise<Blob>}
     */
    toBlob(canvas, format = 'image/png', quality = 0.92) {
        return new Promise((resolve) => {
            canvas.toBlob(resolve, format, quality);
        });
    }
}
