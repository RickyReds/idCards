/**
 * ImageProcessor - Processa immagini (rotazione, allineamento, ottimizzazione)
 * Versione migliorata con algoritmi più robusti
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
        throw new Error('Per ora, converti il PDF in immagine (JPG/PNG) prima del caricamento');
    }

    /**
     * Rileva l'angolo di rotazione del documento usando projection profile
     * @param {HTMLCanvasElement} canvas - Canvas con il documento
     * @returns {number} Angolo in gradi
     */
    detectRotation(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Prova angoli da -10 a +10 gradi e trova quello con projection più forte
        const angles = [];
        for (let angle = -10; angle <= 10; angle += 0.5) {
            const variance = this.calculateProjectionVariance(imageData, angle);
            angles.push({ angle, variance });
        }

        // L'angolo corretto è quello con la varianza massima nella proiezione orizzontale
        angles.sort((a, b) => b.variance - a.variance);

        const bestAngle = angles[0].angle;
        console.log(`Angolo ottimale rilevato: ${bestAngle.toFixed(2)}°`);

        return bestAngle;
    }

    /**
     * Calcola la varianza della proiezione orizzontale per un dato angolo
     * Una varianza alta indica che il testo è ben allineato orizzontalmente
     */
    calculateProjectionVariance(imageData, angle) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;

        // Crea projection profile orizzontale
        const projection = new Array(height).fill(0);

        const angleRad = (angle * Math.PI) / 180;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);

        // Calcola centro
        const cx = width / 2;
        const cy = height / 2;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // Ruota virtualmente il punto
                const rx = Math.floor((x - cx) * cos - (y - cy) * sin + cx);
                const ry = Math.floor((x - cx) * sin + (y - cy) * cos + cy);

                if (rx >= 0 && rx < width && ry >= 0 && ry < height) {
                    const idx = (ry * width + rx) * 4;
                    // Inverti: pixel scuri hanno peso maggiore
                    const darkness = 255 - ((data[idx] + data[idx + 1] + data[idx + 2]) / 3);
                    projection[y] += darkness;
                }
            }
        }

        // Calcola varianza della proiezione
        const mean = projection.reduce((a, b) => a + b, 0) / projection.length;
        const variance = projection.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / projection.length;

        return variance;
    }

    /**
     * Metodo alternativo più veloce: usa edge detection sui bordi del documento
     */
    detectRotationFast(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;

        // Trova bordi superiore e inferiore del documento
        let topY = -1, bottomY = -1;
        let topLeftX = -1, topRightX = -1;
        let bottomLeftX = -1, bottomRightX = -1;

        // Scansiona dall'alto
        outer: for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                if (brightness < 240) {
                    topY = y;
                    // Trova left e right di questa riga
                    for (let x2 = 0; x2 < width; x2++) {
                        const idx2 = (y * width + x2) * 4;
                        const br = (data[idx2] + data[idx2 + 1] + data[idx2 + 2]) / 3;
                        if (br < 240) {
                            topLeftX = x2;
                            break;
                        }
                    }
                    for (let x2 = width - 1; x2 >= 0; x2--) {
                        const idx2 = (y * width + x2) * 4;
                        const br = (data[idx2] + data[idx2 + 1] + data[idx2 + 2]) / 3;
                        if (br < 240) {
                            topRightX = x2;
                            break;
                        }
                    }
                    break outer;
                }
            }
        }

        // Scansiona dal basso
        outer: for (let y = height - 1; y >= 0; y--) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                if (brightness < 240) {
                    bottomY = y;
                    // Trova left e right di questa riga
                    for (let x2 = 0; x2 < width; x2++) {
                        const idx2 = (y * width + x2) * 4;
                        const br = (data[idx2] + data[idx2 + 1] + data[idx2 + 2]) / 3;
                        if (br < 240) {
                            bottomLeftX = x2;
                            break;
                        }
                    }
                    for (let x2 = width - 1; x2 >= 0; x2--) {
                        const idx2 = (y * width + x2) * 4;
                        const br = (data[idx2] + data[idx2 + 1] + data[idx2 + 2]) / 3;
                        if (br < 240) {
                            bottomRightX = x2;
                            break;
                        }
                    }
                    break outer;
                }
            }
        }

        if (topY === -1 || bottomY === -1) {
            console.log('Impossibile rilevare bordi del documento');
            return 0;
        }

        // Calcola angolo dal lato sinistro
        const leftAngle = Math.atan2(bottomLeftX - topLeftX, bottomY - topY) * (180 / Math.PI);

        // Calcola angolo dal lato destro
        const rightAngle = Math.atan2(bottomRightX - topRightX, bottomY - topY) * (180 / Math.PI);

        // Media dei due
        const avgAngle = (leftAngle + rightAngle) / 2;

        console.log(`Angolo rilevato (lato sx): ${leftAngle.toFixed(2)}°`);
        console.log(`Angolo rilevato (lato dx): ${rightAngle.toFixed(2)}°`);
        console.log(`Angolo medio: ${avgAngle.toFixed(2)}°`);

        // Limita a ±15 gradi
        const clampedAngle = Math.max(-15, Math.min(15, avgAngle));

        return clampedAngle;
    }

    /**
     * Ruota un canvas di un angolo specificato
     * @param {HTMLCanvasElement} sourceCanvas - Canvas sorgente
     * @param {number} angle - Angolo in gradi
     * @returns {HTMLCanvasElement} Nuovo canvas ruotato
     */
    rotateCanvas(sourceCanvas, angle) {
        if (Math.abs(angle) < 0.1) {
            console.log('Angolo troppo piccolo, skip rotazione');
            return sourceCanvas;
        }

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

        // Sfondo bianco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, newWidth, newHeight);

        // Ruota attorno al centro con antialiasing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.translate(newWidth / 2, newHeight / 2);
        ctx.rotate(angleRad);
        ctx.drawImage(sourceCanvas, -sourceCanvas.width / 2, -sourceCanvas.height / 2);

        console.log(`Rotazione applicata: ${angle.toFixed(2)}°`);

        return rotatedCanvas;
    }

    /**
     * Auto-allinea un documento (rileva e corregge rotazione)
     * @param {HTMLCanvasElement} canvas - Canvas con il documento
     * @returns {HTMLCanvasElement} Canvas allineato
     */
    autoAlign(canvas) {
        console.log('Inizio auto-allineamento...');

        // Usa metodo veloce basato su edge detection
        const angle = this.detectRotationFast(canvas);

        if (Math.abs(angle) < 0.3) {
            console.log('Documento già allineato');
            return canvas; // Già allineato
        }

        // Correggi angolo (negativo perché ruotiamo in senso opposto)
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
     * Migliora la qualità dell'immagine (contrasto, nitidezza)
     * @param {HTMLCanvasElement} canvas - Canvas da migliorare
     * @returns {HTMLCanvasElement} Canvas migliorato
     */
    enhance(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Applica leggero aumento del contrasto e nitidezza
        const contrast = 1.15;
        const brightness = 1.05;
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

        for (let i = 0; i < data.length; i += 4) {
            // Contrasto
            data[i] = factor * (data[i] - 128) + 128;         // R
            data[i + 1] = factor * (data[i + 1] - 128) + 128; // G
            data[i + 2] = factor * (data[i + 2] - 128) + 128; // B

            // Brightness
            data[i] = Math.min(255, data[i] * brightness);
            data[i + 1] = Math.min(255, data[i + 1] * brightness);
            data[i + 2] = Math.min(255, data[i + 2] * brightness);
        }

        ctx.putImageData(imageData, 0, 0);
        console.log('Ottimizzazione immagine completata');
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
