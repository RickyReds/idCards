/**
 * Document Detector con algoritmi robusti
 * - Proiezioni luminosità con soglie adattive
 * - Validazione aspect ratio (carte ID ~1.586 come carta di credito)
 * - Prevenzione falsi positivi
 */

class DocumentDetector {
    constructor() {
        // Aspect ratio tipico delle carte ID (simile a carta di credito: 85.60mm × 53.98mm)
        this.CARD_ASPECT_RATIO = 1.586;
        this.ASPECT_RATIO_TOLERANCE = 0.4; // Tolleranza ±40%

        // Dimensioni minime ragionevoli per una carta (in pixel)
        this.MIN_CARD_WIDTH = 200;
        this.MIN_CARD_HEIGHT = 120;

        // Soglie per rilevamento gap
        this.GAP_MIN_SIZE_PERCENT = 0.08; // Gap minimo 8% della dimensione immagine
        this.BRIGHTNESS_THRESHOLD = 240; // Soglia per considerare "bianco" (su scala 0-255)
    }

    /**
     * Rileva uno o più documenti in un'immagine
     * @param {HTMLImageElement} image
     * @returns {Array} Array di rettangoli {x, y, width, height}
     */
    detectDocuments(image) {
        console.log('🔍 Avvio rilevamento documenti...');

        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(image, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { width, height } = imageData;

        // Calcola proiezioni di luminosità
        const horizontalProjection = this.calculateHorizontalProjection(imageData);
        const verticalProjection = this.calculateVerticalProjection(imageData);

        // Trova gap significativi
        const horizontalGaps = this.findGaps(horizontalProjection, height, 'orizzontale');
        const verticalGaps = this.findGaps(verticalProjection, width, 'verticale');

        console.log(`📊 Gap orizzontali trovati: ${horizontalGaps.length}`);
        console.log(`📊 Gap verticali trovati: ${verticalGaps.length}`);

        let documents = [];

        // Se non ci sono gap significativi, è un singolo documento
        if (horizontalGaps.length === 0 && verticalGaps.length === 0) {
            const bounds = this.findDocumentBounds(imageData);
            if (bounds) {
                documents = [bounds];
                console.log('📄 Documento singolo rilevato:', bounds);
            }
        } else {
            // Dividi l'immagine in base ai gap trovati
            documents = this.splitByGaps(imageData, horizontalGaps, verticalGaps);
        }

        // Valida e filtra documenti basandosi su dimensioni e aspect ratio
        documents = this.validateDocuments(documents, width, height);

        console.log(`✅ Rilevati ${documents.length} documento/i valido/i`);
        return documents;
    }

    /**
     * Calcola proiezione orizzontale (somma luminosità per riga)
     */
    calculateHorizontalProjection(imageData) {
        const { width, height, data } = imageData;
        const projection = new Float32Array(height);

        for (let y = 0; y < height; y++) {
            let rowBrightness = 0;
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                rowBrightness += brightness;
            }
            projection[y] = rowBrightness / width; // Media per la riga
        }

        return projection;
    }

    /**
     * Calcola proiezione verticale (somma luminosità per colonna)
     */
    calculateVerticalProjection(imageData) {
        const { width, height, data } = imageData;
        const projection = new Float32Array(width);

        for (let x = 0; x < width; x++) {
            let colBrightness = 0;
            for (let y = 0; y < height; y++) {
                const idx = (y * width + x) * 4;
                const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                colBrightness += brightness;
            }
            projection[x] = colBrightness / height; // Media per la colonna
        }

        return projection;
    }

    /**
     * Trova gap (zone bianche) nella proiezione
     */
    findGaps(projection, imageSize, direction) {
        const minGapSize = Math.floor(imageSize * this.GAP_MIN_SIZE_PERCENT);
        const gaps = [];
        let gapStart = -1;
        let gapSize = 0;

        for (let i = 0; i < projection.length; i++) {
            if (projection[i] >= this.BRIGHTNESS_THRESHOLD) {
                // Pixel bianco
                if (gapStart === -1) {
                    gapStart = i;
                    gapSize = 1;
                } else {
                    gapSize++;
                }
            } else {
                // Fine del gap
                if (gapStart !== -1 && gapSize >= minGapSize) {
                    const gap = {
                        position: gapStart,
                        size: gapSize,
                        center: gapStart + Math.floor(gapSize / 2)
                    };
                    gaps.push(gap);
                    console.log(`  Gap ${direction} a posizione ${gap.position}, dimensione: ${gap.size}px`);
                }
                gapStart = -1;
                gapSize = 0;
            }
        }

        // Controlla gap finale
        if (gapStart !== -1 && gapSize >= minGapSize) {
            const gap = {
                position: gapStart,
                size: gapSize,
                center: gapStart + Math.floor(gapSize / 2)
            };
            gaps.push(gap);
            console.log(`  Gap ${direction} a posizione ${gap.position}, dimensione: ${gap.size}px`);
        }

        return gaps;
    }

    /**
     * Divide l'immagine in base ai gap trovati
     */
    splitByGaps(imageData, horizontalGaps, verticalGaps) {
        const { width, height } = imageData;
        const documents = [];

        // Seleziona il gap più grande e più centrale
        const primaryHGap = this.selectBestGap(horizontalGaps, height);
        const primaryVGap = this.selectBestGap(verticalGaps, width);

        if (primaryHGap && !primaryVGap) {
            // Dividi orizzontalmente (documenti uno sopra l'altro)
            const top = this.findDocumentBounds(imageData, 0, 0, width, primaryHGap.position);
            const bottom = this.findDocumentBounds(imageData, 0, primaryHGap.position + primaryHGap.size, width, height - (primaryHGap.position + primaryHGap.size));

            if (top) documents.push(top);
            if (bottom) documents.push(bottom);
        } else if (primaryVGap && !primaryHGap) {
            // Dividi verticalmente (documenti affiancati)
            const left = this.findDocumentBounds(imageData, 0, 0, primaryVGap.position, height);
            const right = this.findDocumentBounds(imageData, primaryVGap.position + primaryVGap.size, 0, width - (primaryVGap.position + primaryVGap.size), height);

            if (left) documents.push(left);
            if (right) documents.push(right);
        } else if (primaryHGap && primaryVGap) {
            // Griglia 2x2
            const splitY = primaryHGap.center;
            const splitX = primaryVGap.center;

            const topLeft = this.findDocumentBounds(imageData, 0, 0, splitX, splitY);
            const topRight = this.findDocumentBounds(imageData, splitX, 0, width - splitX, splitY);
            const bottomLeft = this.findDocumentBounds(imageData, 0, splitY, splitX, height - splitY);
            const bottomRight = this.findDocumentBounds(imageData, splitX, splitY, width - splitX, height - splitY);

            if (topLeft) documents.push(topLeft);
            if (topRight) documents.push(topRight);
            if (bottomLeft) documents.push(bottomLeft);
            if (bottomRight) documents.push(bottomRight);
        } else {
            // Nessun gap valido, documento singolo
            const bounds = this.findDocumentBounds(imageData);
            if (bounds) documents.push(bounds);
        }

        return documents;
    }

    /**
     * Seleziona il gap migliore (più grande e più centrale)
     */
    selectBestGap(gaps, imageSize) {
        if (gaps.length === 0) return null;
        if (gaps.length === 1) return gaps[0];

        // Preferisci gap più grandi e più centrali
        return gaps.reduce((best, gap) => {
            const centerDist = Math.abs(gap.center - imageSize / 2);
            const bestCenterDist = Math.abs(best.center - imageSize / 2);

            // Peso: 70% size, 30% centralità
            const score = gap.size * 0.7 - centerDist * 0.3;
            const bestScore = best.size * 0.7 - bestCenterDist * 0.3;

            return score > bestScore ? gap : best;
        });
    }

    /**
     * Trova i bounds precisi di un documento in una regione
     */
    findDocumentBounds(imageData, startX = 0, startY = 0, regionWidth = null, regionHeight = null) {
        const { width, height, data } = imageData;
        const endX = startX + (regionWidth || width);
        const endY = startY + (regionHeight || height);

        let minX = endX, maxX = startX;
        let minY = endY, maxY = startY;

        // Scansiona la regione per trovare i pixel non-bianchi
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const idx = (y * width + x) * 4;
                const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

                if (brightness < this.BRIGHTNESS_THRESHOLD) {
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            }
        }

        // Verifica se abbiamo trovato qualcosa
        if (maxX <= minX || maxY <= minY) {
            return null;
        }

        return {
            x: minX,
            y: minY,
            width: maxX - minX + 1,
            height: maxY - minY + 1
        };
    }

    /**
     * Valida documenti basandosi su dimensioni e aspect ratio
     */
    validateDocuments(documents, imageWidth, imageHeight) {
        return documents.filter(doc => {
            // Check dimensioni minime
            if (doc.width < this.MIN_CARD_WIDTH || doc.height < this.MIN_CARD_HEIGHT) {
                console.warn(`⚠️ Documento scartato: troppo piccolo (${doc.width}x${doc.height})`);
                return false;
            }

            // Check aspect ratio
            const aspectRatio = doc.width / doc.height;
            const minAspect = this.CARD_ASPECT_RATIO * (1 - this.ASPECT_RATIO_TOLERANCE);
            const maxAspect = this.CARD_ASPECT_RATIO * (1 + this.ASPECT_RATIO_TOLERANCE);

            // Accetta sia orizzontale che verticale
            const isValid = (aspectRatio >= minAspect && aspectRatio <= maxAspect) ||
                          (1/aspectRatio >= minAspect && 1/aspectRatio <= maxAspect);

            if (!isValid) {
                console.warn(`⚠️ Documento scartato: aspect ratio insolito (${aspectRatio.toFixed(2)}, atteso ~${this.CARD_ASPECT_RATIO.toFixed(2)})`);
                return false;
            }

            // Check che non sia troppo piccolo rispetto all'immagine (potrebbe essere rumore)
            const areaPercent = (doc.width * doc.height) / (imageWidth * imageHeight);
            if (areaPercent < 0.05) { // Meno del 5% dell'immagine
                console.warn(`⚠️ Documento scartato: area troppo piccola (${(areaPercent * 100).toFixed(1)}% dell'immagine)`);
                return false;
            }

            console.log(`✅ Documento valido: ${doc.width}x${doc.height}, aspect ratio: ${aspectRatio.toFixed(2)}`);
            return true;
        });
    }
}

// Export per uso in altri moduli
window.DocumentDetector = DocumentDetector;
