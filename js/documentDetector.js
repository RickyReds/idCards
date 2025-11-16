/**
 * DocumentDetector - Rileva e croppa documenti dalle immagini
 * Versione migliorata con approccio più robusto
 */
class DocumentDetector {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.documentCounter = 0; // Counter per ID univoci
    }

    /**
     * Rileva documenti in un'immagine usando analisi avanzata
     * @param {HTMLImageElement} image - Immagine da processare
     * @returns {Promise<Array>} Array di documenti rilevati
     */
    async detectDocuments(image) {
        console.log('Avvio rilevamento documenti...');
        this.canvas.width = image.width;
        this.canvas.height = image.height;
        this.ctx.drawImage(image, 0, 0);

        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        // Prova approccio intelligente: analizza proiezioni orizzontali e verticali
        const documents = this.detectUsingProjection(imageData, image);

        if (documents.length > 0) {
            console.log(`✓ Rilevati ${documents.length} documenti con analisi proiezione`);
            return documents;
        }

        // Fallback: split semplice
        console.log('Nessun documento rilevato, uso split automatico');
        return this.splitImageInHalf(image);
    }

    /**
     * Rileva documenti usando projection profile
     */
    detectUsingProjection(imageData, originalImage) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;

        // Calcola luminosità media per riga e colonna
        const rowBrightness = new Array(height).fill(0);
        const colBrightness = new Array(width).fill(0);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                rowBrightness[y] += brightness;
                colBrightness[x] += brightness;
            }
        }

        // Normalizza
        for (let y = 0; y < height; y++) rowBrightness[y] /= width;
        for (let x = 0; x < width; x++) colBrightness[x] /= height;

        // Calcola luminosità media globale
        const avgBrightness = rowBrightness.reduce((a, b) => a + b, 0) / height;

        // Trova righe e colonne che sono molto più chiare (sfondo)
        const threshold = avgBrightness * 0.95; // 95% della luminosità media

        // SOGLIE PIÙ RESTRITTIVE per evitare falsi positivi
        // Gap minimo: 10% della dimensione (era 5%)
        const horizontalGap = this.findLargestGap(rowBrightness, threshold, height * 0.10);
        const verticalGap = this.findLargestGap(colBrightness, threshold, width * 0.10);

        const documents = [];

        // Aspect ratio tipico carte ID (come carta di credito): 85.6mm x 53.98mm ≈ 1.586
        const EXPECTED_ASPECT_RATIO = 1.586;
        const ASPECT_TOLERANCE = 0.5; // ±50% tolleranza

        // Se trova un gap significativo orizzontale, split verticale
        // Gap deve essere > 12% della dimensione (era 3%)
        if (horizontalGap && horizontalGap.size > height * 0.12) {
            console.log(`Gap orizzontale trovato a riga ${horizontalGap.position}, dimensione: ${horizontalGap.size}`);
            const splitY = horizontalGap.position + Math.floor(horizontalGap.size / 2);

            // Valida che le parti abbiano sense come documenti separati
            const topHeight = splitY;
            const bottomHeight = height - splitY;
            const topAspect = width / topHeight;
            const bottomAspect = width / bottomHeight;

            // Verifica aspect ratio ragionevoli
            const isTopValid = this.isValidAspectRatio(topAspect, EXPECTED_ASPECT_RATIO, ASPECT_TOLERANCE);
            const isBottomValid = this.isValidAspectRatio(bottomAspect, EXPECTED_ASPECT_RATIO, ASPECT_TOLERANCE);

            if (isTopValid && isBottomValid) {
                console.log(`  ✓ Split valido (aspect ratios: ${topAspect.toFixed(2)}, ${bottomAspect.toFixed(2)})`);
                documents.push(this.cropDocument(originalImage, 0, 0, width, splitY, 0));
                documents.push(this.cropDocument(originalImage, 0, splitY, width, height - splitY, 1));
            } else {
                console.log(`  ✗ Split scartato (aspect ratios non validi: ${topAspect.toFixed(2)}, ${bottomAspect.toFixed(2)})`);
                console.log(`  → Tratto come documento singolo`);
                // Gap invalido, tratta come documento singolo
                const bounds = this.findContentBounds(rowBrightness, colBrightness, threshold, width, height);
                if (bounds) {
                    console.log(`  Documento singolo: ${bounds.x}, ${bounds.y}, ${bounds.width}x${bounds.height}`);
                    documents.push(this.cropDocument(originalImage, bounds.x, bounds.y, bounds.width, bounds.height, 0));
                }
            }
        }
        // Se trova un gap significativo verticale, split orizzontale
        else if (verticalGap && verticalGap.size > width * 0.12) {
            console.log(`Gap verticale trovato a colonna ${verticalGap.position}, dimensione: ${verticalGap.size}`);
            const splitX = verticalGap.position + Math.floor(verticalGap.size / 2);

            // Valida che le parti abbiano senso come documenti separati
            const leftWidth = splitX;
            const rightWidth = width - splitX;
            const leftAspect = leftWidth / height;
            const rightAspect = rightWidth / height;

            const isLeftValid = this.isValidAspectRatio(leftAspect, EXPECTED_ASPECT_RATIO, ASPECT_TOLERANCE);
            const isRightValid = this.isValidAspectRatio(rightAspect, EXPECTED_ASPECT_RATIO, ASPECT_TOLERANCE);

            if (isLeftValid && isRightValid) {
                console.log(`  ✓ Split valido (aspect ratios: ${leftAspect.toFixed(2)}, ${rightAspect.toFixed(2)})`);
                documents.push(this.cropDocument(originalImage, 0, 0, splitX, height, 0));
                documents.push(this.cropDocument(originalImage, splitX, 0, width - splitX, height, 1));
            } else {
                console.log(`  ✗ Split scartato (aspect ratios non validi: ${leftAspect.toFixed(2)}, ${rightAspect.toFixed(2)})`);
                console.log(`  → Tratto come documento singolo`);
                // Gap invalido, tratta come documento singolo
                const bounds = this.findContentBounds(rowBrightness, colBrightness, threshold, width, height);
                if (bounds) {
                    console.log(`  Documento singolo: ${bounds.x}, ${bounds.y}, ${bounds.width}x${bounds.height}`);
                    documents.push(this.cropDocument(originalImage, bounds.x, bounds.y, bounds.width, bounds.height, 0));
                }
            }
        }
        // Nessun gap chiaro, probabilmente un solo documento
        else {
            console.log('Nessun gap significativo, ricerca documento singolo...');
            // Trova il bounding box del contenuto (escludendo margini bianchi)
            const bounds = this.findContentBounds(rowBrightness, colBrightness, threshold, width, height);

            if (bounds) {
                const boundsAspect = bounds.width / bounds.height;
                console.log(`Documento singolo trovato: ${bounds.x}, ${bounds.y}, ${bounds.width}x${bounds.height}, aspect: ${boundsAspect.toFixed(2)}`);

                // Verifica che non sia l'intera immagine (documento non rilevato correttamente)
                const isFullImage = (bounds.width > width * 0.95 && bounds.height > height * 0.95);

                if (!isFullImage) {
                    documents.push(this.cropDocument(originalImage, bounds.x, bounds.y, bounds.width, bounds.height, 0));
                } else {
                    console.log('⚠️ Bounds coprono quasi tutta l\'immagine, potrebbe non essere un rilevamento accurato');
                }
            }
        }

        return documents;
    }

    /**
     * Verifica se un aspect ratio è valido per un documento ID
     * @param {number} aspectRatio - Aspect ratio da verificare
     * @param {number} expected - Aspect ratio atteso
     * @param {number} tolerance - Tolleranza (es. 0.5 = ±50%)
     * @returns {boolean}
     */
    isValidAspectRatio(aspectRatio, expected, tolerance) {
        const minAspect = expected * (1 - tolerance);
        const maxAspect = expected * (1 + tolerance);

        // Accetta sia orientamento orizzontale che verticale
        const isHorizontalValid = aspectRatio >= minAspect && aspectRatio <= maxAspect;
        const isVerticalValid = (1 / aspectRatio) >= minAspect && (1 / aspectRatio) <= maxAspect;

        return isHorizontalValid || isVerticalValid;
    }

    /**
     * Trova il gap (spazio bianco) più grande in una projection
     */
    findLargestGap(projection, threshold, minGapSize) {
        let largestGap = null;
        let currentGapStart = -1;
        let currentGapSize = 0;

        for (let i = 0; i < projection.length; i++) {
            if (projection[i] >= threshold) {
                // Pixel chiaro (probabile sfondo)
                if (currentGapStart === -1) {
                    currentGapStart = i;
                    currentGapSize = 1;
                } else {
                    currentGapSize++;
                }
            } else {
                // Pixel scuro (probabile contenuto)
                if (currentGapStart !== -1) {
                    // Fine del gap
                    if (currentGapSize > minGapSize) {
                        if (!largestGap || currentGapSize > largestGap.size) {
                            largestGap = {
                                position: currentGapStart,
                                size: currentGapSize
                            };
                        }
                    }
                    currentGapStart = -1;
                    currentGapSize = 0;
                }
            }
        }

        return largestGap;
    }

    /**
     * Trova i bounds del contenuto (escludendo margini bianchi)
     */
    findContentBounds(rowBrightness, colBrightness, threshold, width, height) {
        let top = 0, bottom = height - 1;
        let left = 0, right = width - 1;

        // Usa threshold più basso (più sensibile) per catturare meglio i bordi
        const sensitiveThreshold = threshold * 0.98;

        // Trova top
        for (let y = 0; y < height; y++) {
            if (rowBrightness[y] < sensitiveThreshold) {
                top = y;
                break;
            }
        }

        // Trova bottom
        for (let y = height - 1; y >= 0; y--) {
            if (rowBrightness[y] < sensitiveThreshold) {
                bottom = y;
                break;
            }
        }

        // Trova left
        for (let x = 0; x < width; x++) {
            if (colBrightness[x] < sensitiveThreshold) {
                left = x;
                break;
            }
        }

        // Trova right
        for (let x = width - 1; x >= 0; x--) {
            if (colBrightness[x] < sensitiveThreshold) {
                right = x;
                break;
            }
        }

        // Margine ridotto per evitare di includere troppo spazio bianco
        const margin = 2;
        top = Math.max(0, top - margin);
        left = Math.max(0, left - margin);
        bottom = Math.min(height - 1, bottom + margin);
        right = Math.min(width - 1, right + margin);

        const boundsWidth = right - left;
        const boundsHeight = bottom - top;

        console.log(`  Bounds trovati: x=${left}, y=${top}, w=${boundsWidth}, h=${boundsHeight}`);

        // Verifica che i bounds siano validi (almeno 5% dell'immagine)
        if (boundsWidth > width * 0.05 && boundsHeight > height * 0.05) {
            return {x: left, y: top, width: boundsWidth, height: boundsHeight};
        }

        console.log(`  ⚠️ Bounds troppo piccoli, scartati`);
        return null;
    }

    /**
     * Croppa un documento dall'immagine originale
     */
    cropDocument(originalImage, x, y, width, height, index) {
        const croppedCanvas = document.createElement('canvas');
        const croppedCtx = croppedCanvas.getContext('2d');

        // Trim margini bianchi dal crop
        const trimmedBounds = this.trimWhitespace(originalImage, x, y, width, height);

        croppedCanvas.width = trimmedBounds.width;
        croppedCanvas.height = trimmedBounds.height;

        croppedCtx.drawImage(
            originalImage,
            trimmedBounds.x, trimmedBounds.y, trimmedBounds.width, trimmedBounds.height,
            0, 0, trimmedBounds.width, trimmedBounds.height
        );

        // ID univoco usando counter incrementale
        this.documentCounter++;
        const docId = `doc_${this.documentCounter}_${Date.now()}`;

        console.log(`  📄 Documento creato: ID=${docId}, dimensioni=${trimmedBounds.width}x${trimmedBounds.height}`);

        return {
            id: docId,
            canvas: croppedCanvas,
            bounds: trimmedBounds,
            originalImage: originalImage
        };
    }

    /**
     * Rimuove spazi bianchi attorno a una regione
     */
    trimWhitespace(image, x, y, width, height) {
        // Crea un canvas temporaneo per analizzare la regione
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');

        tempCtx.drawImage(image, x, y, width, height, 0, 0, width, height);
        const imageData = tempCtx.getImageData(0, 0, width, height);
        const data = imageData.data;

        let top = 0, bottom = height - 1;
        let left = 0, right = width - 1;

        // Soglia più sensibile per catturare meglio i bordi
        const whiteThreshold = 252; // Aumentato da 250 per essere ancora più aggressivo

        // Conta pixel non bianchi per riga/colonna (più robusto)
        const countNonWhitePixels = (startRow, endRow, startCol, endCol) => {
            let count = 0;
            for (let row = startRow; row <= endRow; row++) {
                for (let col = startCol; col <= endCol; col++) {
                    const idx = (row * width + col) * 4;
                    const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                    if (brightness < whiteThreshold) count++;
                }
            }
            return count;
        };

        // Soglia ridotta: almeno 1% della riga/colonna deve essere non-bianco (era 2%)
        const minPixelsThreshold = 0.01;

        // Trova top
        for (let row = 0; row < height; row++) {
            const nonWhite = countNonWhitePixels(row, row, 0, width - 1);
            if (nonWhite > width * minPixelsThreshold) {
                top = row;
                break;
            }
        }

        // Trova bottom
        for (let row = height - 1; row >= 0; row--) {
            const nonWhite = countNonWhitePixels(row, row, 0, width - 1);
            if (nonWhite > width * minPixelsThreshold) {
                bottom = row;
                break;
            }
        }

        // Trova left
        for (let col = 0; col < width; col++) {
            const nonWhite = countNonWhitePixels(0, height - 1, col, col);
            if (nonWhite > height * minPixelsThreshold) {
                left = col;
                break;
            }
        }

        // Trova right
        for (let col = width - 1; col >= 0; col--) {
            const nonWhite = countNonWhitePixels(0, height - 1, col, col);
            if (nonWhite > height * minPixelsThreshold) {
                right = col;
                break;
            }
        }

        // Margine minimo per sicurezza
        const margin = 1;
        top = Math.max(0, top - margin);
        left = Math.max(0, left - margin);
        bottom = Math.min(height - 1, bottom + margin);
        right = Math.min(width - 1, right + margin);

        const trimmedWidth = right - left + 1;
        const trimmedHeight = bottom - top + 1;

        const removedTop = top;
        const removedBottom = height - 1 - bottom;
        const removedLeft = left;
        const removedRight = width - 1 - right;

        console.log(`  Trim: ${width}x${height} → ${trimmedWidth}x${trimmedHeight} (rimosso: T=${removedTop}, B=${removedBottom}, L=${removedLeft}, R=${removedRight})`);

        return {
            x: x + left,
            y: y + top,
            width: trimmedWidth,
            height: trimmedHeight
        };
    }

    /**
     * Metodo fallback: split immagine in 2 parti uguali verticalmente
     */
    splitImageInHalf(image) {
        const documents = [];
        const halfHeight = Math.floor(image.height / 2);

        console.log('⚠️ Fallback: Split in 2 parti uguali (orizzontale)');

        for (let i = 0; i < 2; i++) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = image.width;
            canvas.height = halfHeight;

            const sy = i * halfHeight;
            ctx.drawImage(image, 0, sy, image.width, halfHeight, 0, 0, image.width, halfHeight);

            // ID univoco
            this.documentCounter++;
            const docId = `doc_${this.documentCounter}_${Date.now()}`;

            console.log(`  📄 Parte ${i + 1}/2: ID=${docId}, dimensioni=${canvas.width}x${canvas.height}`);

            documents.push({
                id: docId,
                canvas: canvas,
                bounds: {x: 0, y: sy, width: image.width, height: halfHeight},
                originalImage: image
            });
        }

        return documents;
    }
}
