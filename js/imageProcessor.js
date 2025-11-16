/**
 * Image Processor con rotazione automatica robusta
 * - Edge detection migliorato
 * - Hough-like line detection
 * - Rotazione effettiva delle immagini
 */

class ImageProcessor {
    constructor() {
        this.MAX_ROTATION_ANGLE = 15; // Gradi massimi di correzione
        this.EDGE_THRESHOLD = 50; // Soglia per rilevamento bordi
    }

    /**
     * Processa un documento rilevato: estrae, ruota, ottimizza
     * @param {HTMLImageElement} sourceImage - Immagine originale
     * @param {Object} bounds - {x, y, width, height}
     * @returns {HTMLCanvasElement} Canvas con documento processato
     */
    processDocument(sourceImage, bounds) {
        console.log('🔄 Inizio processing documento:', bounds);

        // 1. Estrai il documento
        const extractedCanvas = this.extractDocument(sourceImage, bounds);

        // 2. Auto-allinea (rileva e correggi rotazione)
        const alignedCanvas = this.autoAlign(extractedCanvas);

        // 3. Ottimizza (contrasto, luminosità, nitidezza)
        const optimizedCanvas = this.optimize(alignedCanvas);

        return optimizedCanvas;
    }

    /**
     * Estrae un documento dall'immagine sorgente
     */
    extractDocument(sourceImage, bounds) {
        const canvas = document.createElement('canvas');
        canvas.width = bounds.width;
        canvas.height = bounds.height;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(
            sourceImage,
            bounds.x, bounds.y, bounds.width, bounds.height,
            0, 0, bounds.width, bounds.height
        );

        return canvas;
    }

    /**
     * Auto-allinea il documento rilevando e correggendo la rotazione
     */
    autoAlign(canvas) {
        console.log('🔍 Inizio rilevamento rotazione...');

        const angle = this.detectRotationAngle(canvas);

        if (Math.abs(angle) < 0.5) {
            console.log('✅ Documento già allineato (angolo <0.5°)');
            return canvas;
        }

        console.log(`🔄 Rotazione di ${angle.toFixed(2)}°`);
        return this.rotateCanvas(canvas, angle);
    }

    /**
     * Rileva l'angolo di rotazione usando edge detection robusto
     */
    detectRotationAngle(canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Converti in grayscale e applica edge detection
        const edges = this.detectEdges(imageData);

        // Trova le linee orizzontali dominanti usando Hough-like approach
        const angles = this.findDominantAngles(edges, canvas.width, canvas.height);

        if (angles.length === 0) {
            console.warn('⚠️ Nessun bordo rilevato, nessuna rotazione applicata');
            return 0;
        }

        // Calcola l'angolo mediano (più robusto della media contro outlier)
        const medianAngle = this.getMedian(angles);

        console.log(`📐 Angoli rilevati: ${angles.map(a => a.toFixed(2)).join(', ')}`);
        console.log(`📐 Angolo mediano: ${medianAngle.toFixed(2)}°`);

        // Limita l'angolo di correzione
        const correctionAngle = Math.max(-this.MAX_ROTATION_ANGLE, Math.min(this.MAX_ROTATION_ANGLE, medianAngle));

        if (Math.abs(medianAngle) > this.MAX_ROTATION_ANGLE) {
            console.warn(`⚠️ Angolo rilevato (${medianAngle.toFixed(2)}°) oltre il limite, limitato a ${correctionAngle.toFixed(2)}°`);
        }

        return -correctionAngle; // Inverti per correggere
    }

    /**
     * Rileva i bordi nell'immagine usando Sobel operator
     */
    detectEdges(imageData) {
        const { width, height, data } = imageData;
        const edges = new Uint8Array(width * height);

        // Converti in grayscale e applica Sobel
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;

                // Sobel kernels
                const gx = (
                    -1 * this.getGray(data, x - 1, y - 1, width) +
                    1 * this.getGray(data, x + 1, y - 1, width) +
                    -2 * this.getGray(data, x - 1, y, width) +
                    2 * this.getGray(data, x + 1, y, width) +
                    -1 * this.getGray(data, x - 1, y + 1, width) +
                    1 * this.getGray(data, x + 1, y + 1, width)
                );

                const gy = (
                    -1 * this.getGray(data, x - 1, y - 1, width) +
                    -2 * this.getGray(data, x, y - 1, width) +
                    -1 * this.getGray(data, x + 1, y - 1, width) +
                    1 * this.getGray(data, x - 1, y + 1, width) +
                    2 * this.getGray(data, x, y + 1, width) +
                    1 * this.getGray(data, x + 1, y + 1, width)
                );

                const magnitude = Math.sqrt(gx * gx + gy * gy);
                edges[idx] = magnitude > this.EDGE_THRESHOLD ? 255 : 0;
            }
        }

        return edges;
    }

    /**
     * Ottiene il valore di grigio per un pixel
     */
    getGray(data, x, y, width) {
        const idx = (y * width + x) * 4;
        return (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
    }

    /**
     * Trova gli angoli dominanti analizzando i bordi
     * Usa una Hough-like approach semplificata
     */
    findDominantAngles(edges, width, height) {
        const angles = [];
        const samplePoints = [];

        // Raccogli punti bordo (campionamento per performance)
        for (let y = 0; y < height; y += 2) {
            for (let x = 0; x < width; x += 2) {
                if (edges[y * width + x] > 0) {
                    samplePoints.push({ x, y });
                }
            }
        }

        if (samplePoints.length < 10) {
            return [];
        }

        // Analizza i bordi superiore e inferiore (più affidabili per carte)
        const topEdges = samplePoints.filter(p => p.y < height * 0.2);
        const bottomEdges = samplePoints.filter(p => p.y > height * 0.8);

        // Calcola angolo dal bordo superiore
        if (topEdges.length >= 2) {
            const topAngle = this.calculateLineAngle(topEdges);
            if (topAngle !== null) angles.push(topAngle);
        }

        // Calcola angolo dal bordo inferiore
        if (bottomEdges.length >= 2) {
            const bottomAngle = this.calculateLineAngle(bottomEdges);
            if (bottomAngle !== null) angles.push(bottomAngle);
        }

        // Analizza anche i bordi laterali
        const leftEdges = samplePoints.filter(p => p.x < width * 0.2);
        const rightEdges = samplePoints.filter(p => p.x > width * 0.8);

        if (leftEdges.length >= 2) {
            const leftAngle = this.calculateVerticalLineAngle(leftEdges);
            if (leftAngle !== null) angles.push(leftAngle);
        }

        if (rightEdges.length >= 2) {
            const rightAngle = this.calculateVerticalLineAngle(rightEdges);
            if (rightAngle !== null) angles.push(rightAngle);
        }

        return angles;
    }

    /**
     * Calcola l'angolo di una linea usando regressione lineare
     */
    calculateLineAngle(points) {
        if (points.length < 2) return null;

        // Regressione lineare: y = mx + b
        const n = points.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

        for (const p of points) {
            sumX += p.x;
            sumY += p.y;
            sumXY += p.x * p.y;
            sumX2 += p.x * p.x;
        }

        const denominator = n * sumX2 - sumX * sumX;
        if (Math.abs(denominator) < 0.001) return null;

        const slope = (n * sumXY - sumX * sumY) / denominator;

        // Converti slope in gradi
        const angleRad = Math.atan(slope);
        const angleDeg = angleRad * (180 / Math.PI);

        return angleDeg;
    }

    /**
     * Calcola l'angolo di una linea verticale
     */
    calculateVerticalLineAngle(points) {
        if (points.length < 2) return null;

        // Per linee verticali, invertiamo x e y
        const swappedPoints = points.map(p => ({ x: p.y, y: p.x }));
        const angle = this.calculateLineAngle(swappedPoints);

        return angle !== null ? 90 - angle : null;
    }

    /**
     * Calcola la mediana di un array (più robusta contro outlier)
     */
    getMedian(values) {
        if (values.length === 0) return 0;

        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);

        if (sorted.length % 2 === 0) {
            return (sorted[mid - 1] + sorted[mid]) / 2;
        } else {
            return sorted[mid];
        }
    }

    /**
     * Ruota il canvas di un dato angolo (in gradi)
     */
    rotateCanvas(canvas, angleDeg) {
        const angleRad = angleDeg * Math.PI / 180;

        // Calcola nuove dimensioni per contenere l'immagine ruotata
        const cos = Math.abs(Math.cos(angleRad));
        const sin = Math.abs(Math.sin(angleRad));
        const newWidth = Math.ceil(canvas.width * cos + canvas.height * sin);
        const newHeight = Math.ceil(canvas.width * sin + canvas.height * cos);

        const rotatedCanvas = document.createElement('canvas');
        rotatedCanvas.width = newWidth;
        rotatedCanvas.height = newHeight;
        const ctx = rotatedCanvas.getContext('2d');

        // Riempimento bianco
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, newWidth, newHeight);

        // Trasla al centro, ruota, disegna
        ctx.translate(newWidth / 2, newHeight / 2);
        ctx.rotate(angleRad);
        ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

        // Crop allo spazio utile per rimuovere margini bianchi extra
        return this.cropWhiteSpace(rotatedCanvas);
    }

    /**
     * Rimuove lo spazio bianco attorno al documento
     */
    cropWhiteSpace(canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { width, height, data } = imageData;

        let minX = width, maxX = 0;
        let minY = height, maxY = 0;

        // Trova bounds del contenuto non-bianco
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

                if (brightness < 250) { // Non bianco puro
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            }
        }

        // Aggiungi piccolo margine
        const margin = 5;
        minX = Math.max(0, minX - margin);
        minY = Math.max(0, minY - margin);
        maxX = Math.min(width - 1, maxX + margin);
        maxY = Math.min(height - 1, maxY + margin);

        const croppedWidth = maxX - minX + 1;
        const croppedHeight = maxY - minY + 1;

        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = croppedWidth;
        croppedCanvas.height = croppedHeight;
        const croppedCtx = croppedCanvas.getContext('2d');

        croppedCtx.drawImage(
            canvas,
            minX, minY, croppedWidth, croppedHeight,
            0, 0, croppedWidth, croppedHeight
        );

        return croppedCanvas;
    }

    /**
     * Ottimizza l'immagine (contrasto, luminosità, nitidezza)
     */
    optimize(canvas) {
        console.log('✨ Ottimizzazione immagine...');

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Applica contrasto +20% e luminosità +8%
        const contrastFactor = 1.2;
        const brightnessFactor = 1.08;

        for (let i = 0; i < data.length; i += 4) {
            // Contrasto e luminosità
            data[i] = Math.min(255, data[i] * contrastFactor * brightnessFactor);
            data[i + 1] = Math.min(255, data[i + 1] * contrastFactor * brightnessFactor);
            data[i + 2] = Math.min(255, data[i + 2] * contrastFactor * brightnessFactor);
        }

        ctx.putImageData(imageData, 0, 0);

        console.log('✅ Ottimizzazione completata');
        return canvas;
    }

    /**
     * Converte canvas in blob per download
     */
    canvasToBlob(canvas, mimeType = 'image/png', quality = 0.95) {
        return new Promise(resolve => {
            canvas.toBlob(blob => resolve(blob), mimeType, quality);
        });
    }
}

// Export
window.ImageProcessor = ImageProcessor;
