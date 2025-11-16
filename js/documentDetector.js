/**
 * DocumentDetector - Rileva e croppa documenti dalle immagini
 */
class DocumentDetector {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    /**
     * Rileva documenti in un'immagine
     * @param {HTMLImageElement} image - Immagine da processare
     * @returns {Promise<Array>} Array di documenti rilevati con coordinate
     */
    async detectDocuments(image) {
        this.canvas.width = image.width;
        this.canvas.height = image.height;
        this.ctx.drawImage(image, 0, 0);

        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const edges = this.detectEdges(imageData);
        const contours = this.findContours(edges);
        const documents = this.extractDocuments(contours, image);

        return documents;
    }

    /**
     * Rileva i bordi usando algoritmo Sobel semplificato
     */
    detectEdges(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const edges = new Uint8ClampedArray(width * height);

        // Converti in grayscale e applica Sobel
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;

                // Grayscale
                const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

                // Sobel kernel semplificato
                const gx = this.getGradientX(data, x, y, width);
                const gy = this.getGradientY(data, x, y, width);
                const magnitude = Math.sqrt(gx * gx + gy * gy);

                edges[y * width + x] = magnitude > 50 ? 255 : 0;
            }
        }

        return edges;
    }

    getGradientX(data, x, y, width) {
        const idx = (y * width + x) * 4;
        const left = this.getGrayscale(data, idx - 4);
        const right = this.getGrayscale(data, idx + 4);
        return right - left;
    }

    getGradientY(data, x, y, width) {
        const idx = (y * width + x) * 4;
        const top = this.getGrayscale(data, idx - width * 4);
        const bottom = this.getGrayscale(data, idx + width * 4);
        return bottom - top;
    }

    getGrayscale(data, idx) {
        return (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
    }

    /**
     * Trova contorni nell'immagine di edge
     */
    findContours(edges) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const visited = new Uint8Array(width * height);
        const contours = [];

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                if (edges[idx] === 255 && !visited[idx]) {
                    const contour = this.traceContour(edges, visited, x, y, width, height);
                    if (contour.length > 100) { // Minimo numero di punti
                        contours.push(contour);
                    }
                }
            }
        }

        return contours;
    }

    /**
     * Traccia un singolo contorno
     */
    traceContour(edges, visited, startX, startY, width, height) {
        const contour = [];
        const queue = [[startX, startY]];

        while (queue.length > 0 && contour.length < 10000) {
            const [x, y] = queue.shift();
            const idx = y * width + x;

            if (x < 0 || x >= width || y < 0 || y >= height) continue;
            if (visited[idx] || edges[idx] !== 255) continue;

            visited[idx] = 1;
            contour.push({x, y});

            // 8-connected neighbors
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    queue.push([x + dx, y + dy]);
                }
            }
        }

        return contour;
    }

    /**
     * Estrae documenti dai contorni rilevati
     */
    extractDocuments(contours, originalImage) {
        const documents = [];

        // Trova i bounding boxes dei contorni più grandi
        const boxes = contours
            .map(contour => this.getBoundingBox(contour))
            .filter(box => {
                const area = box.width * box.height;
                const imageArea = originalImage.width * originalImage.height;
                // Filtra solo aree significative (tra 5% e 90% dell'immagine)
                return area > imageArea * 0.05 && area < imageArea * 0.9;
            })
            .sort((a, b) => (b.width * b.height) - (a.width * a.height))
            .slice(0, 2); // Massimo 2 documenti

        // Croppa ogni documento
        boxes.forEach((box, index) => {
            const croppedCanvas = document.createElement('canvas');
            const croppedCtx = croppedCanvas.getContext('2d');

            // Aggiungi margine del 2%
            const margin = 10;
            const x = Math.max(0, box.x - margin);
            const y = Math.max(0, box.y - margin);
            const w = Math.min(box.width + margin * 2, originalImage.width - x);
            const h = Math.min(box.height + margin * 2, originalImage.height - y);

            croppedCanvas.width = w;
            croppedCanvas.height = h;
            croppedCtx.drawImage(originalImage, x, y, w, h, 0, 0, w, h);

            documents.push({
                id: `doc_${Date.now()}_${index}`,
                canvas: croppedCanvas,
                bounds: {x, y, width: w, height: h},
                originalImage: originalImage
            });
        });

        return documents;
    }

    /**
     * Calcola bounding box di un contorno
     */
    getBoundingBox(contour) {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        contour.forEach(point => {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        });

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    /**
     * Metodo alternativo: split immagine in 2 parti uguali
     * Usato come fallback se la detection automatica non trova documenti
     */
    splitImageInHalf(image) {
        const documents = [];
        const halfHeight = Math.floor(image.height / 2);

        for (let i = 0; i < 2; i++) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = image.width;
            canvas.height = halfHeight;

            const sy = i * halfHeight;
            ctx.drawImage(image, 0, sy, image.width, halfHeight, 0, 0, image.width, halfHeight);

            documents.push({
                id: `doc_${Date.now()}_${i}`,
                canvas: canvas,
                bounds: {x: 0, y: sy, width: image.width, height: halfHeight},
                originalImage: image
            });
        }

        return documents;
    }
}
