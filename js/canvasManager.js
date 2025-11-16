/**
 * CanvasManager - Gestisce il canvas A4 e il drag-and-drop dei documenti
 */
class CanvasManager {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.wrapper = document.getElementById('canvasWrapper');
        this.objects = []; // Array di oggetti posizionati sul canvas
        this.selectedObject = null;
        this.isDragging = false;
        this.isResizing = false;
        this.dragStart = {x: 0, y: 0};
        this.zoom = 1;

        // Dimensioni A4 in pixel (300 DPI per export)
        this.A4_WIDTH = 2480;  // 210mm a 300 DPI
        this.A4_HEIGHT = 3508; // 297mm a 300 DPI

        // Display scale per mostrare a dimensioni ragionevoli
        this.DISPLAY_SCALE = 0.25; // 25% delle dimensioni reali

        this.initCanvas();
        this.setupEventListeners();
    }

    /**
     * Inizializza il canvas con dimensioni A4
     */
    initCanvas() {
        this.canvas.width = this.A4_WIDTH;
        this.canvas.height = this.A4_HEIGHT;

        // Applica display scale
        this.canvas.style.width = `${this.A4_WIDTH * this.DISPLAY_SCALE}px`;
        this.canvas.style.height = `${this.A4_HEIGHT * this.DISPLAY_SCALE}px`;

        this.clear();
    }

    /**
     * Pulisce il canvas
     */
    clear() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.objects = [];
        this.render();
    }

    /**
     * Setup event listeners per drag-and-drop e interazione
     */
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));

        // Previeni context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Keyboard shortcuts
        document.addEventListener('keydown', this.onKeyDown.bind(this));
    }

    /**
     * Aggiunge un documento al canvas
     * @param {HTMLCanvasElement} docCanvas - Canvas del documento
     * @param {Object} options - Opzioni di posizionamento {x, y, width, height}
     */
    addDocument(docCanvas, options = {}) {
        // Calcola dimensioni mantenendo aspect ratio
        const maxWidth = this.A4_WIDTH * 0.9;
        const maxHeight = this.A4_HEIGHT * 0.45; // Massimo metà pagina

        let width = options.width || docCanvas.width;
        let height = options.height || docCanvas.height;

        const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);

        const obj = {
            id: `obj_${Date.now()}_${Math.random()}`,
            canvas: docCanvas,
            x: options.x || (this.A4_WIDTH - width) / 2,
            y: options.y || (this.A4_HEIGHT - height) / 2,
            width: width,
            height: height,
            rotation: options.rotation || 0,
            selected: false
        };

        this.objects.push(obj);
        this.render();

        return obj;
    }

    /**
     * Mouse down handler
     */
    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        // Trova oggetto sotto il cursore
        const clickedObject = this.getObjectAt(x, y);

        if (clickedObject) {
            this.selectedObject = clickedObject;
            this.isDragging = true;
            this.dragStart = {
                x: x - clickedObject.x,
                y: y - clickedObject.y
            };

            // Porta in primo piano
            this.bringToFront(clickedObject);
        } else {
            this.selectedObject = null;
        }

        this.render();
    }

    /**
     * Mouse move handler
     */
    onMouseMove(e) {
        if (!this.isDragging || !this.selectedObject) return;

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        // Aggiorna posizione
        this.selectedObject.x = x - this.dragStart.x;
        this.selectedObject.y = y - this.dragStart.y;

        // Limita ai bordi del canvas
        this.selectedObject.x = Math.max(0, Math.min(this.selectedObject.x, this.A4_WIDTH - this.selectedObject.width));
        this.selectedObject.y = Math.max(0, Math.min(this.selectedObject.y, this.A4_HEIGHT - this.selectedObject.height));

        this.render();
    }

    /**
     * Mouse up handler
     */
    onMouseUp(e) {
        this.isDragging = false;
        this.isResizing = false;
    }

    /**
     * Trova oggetto alle coordinate specificate
     */
    getObjectAt(x, y) {
        // Cerca dall'ultimo al primo (ordine di rendering)
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];

            if (x >= obj.x && x <= obj.x + obj.width &&
                y >= obj.y && y <= obj.y + obj.height) {
                return obj;
            }
        }

        return null;
    }

    /**
     * Porta un oggetto in primo piano
     */
    bringToFront(obj) {
        const index = this.objects.indexOf(obj);
        if (index > -1) {
            this.objects.splice(index, 1);
            this.objects.push(obj);
        }
    }

    /**
     * Rimuove un oggetto dal canvas
     */
    removeObject(obj) {
        const index = this.objects.indexOf(obj);
        if (index > -1) {
            this.objects.splice(index, 1);
            if (this.selectedObject === obj) {
                this.selectedObject = null;
            }
            this.render();
        }
    }

    /**
     * Keyboard handler
     */
    onKeyDown(e) {
        if (!this.selectedObject) return;

        switch (e.key) {
            case 'Delete':
            case 'Backspace':
                this.removeObject(this.selectedObject);
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.selectedObject.y = Math.max(0, this.selectedObject.y - (e.shiftKey ? 10 : 1));
                this.render();
                break;

            case 'ArrowDown':
                e.preventDefault();
                this.selectedObject.y = Math.min(this.A4_HEIGHT - this.selectedObject.height, this.selectedObject.y + (e.shiftKey ? 10 : 1));
                this.render();
                break;

            case 'ArrowLeft':
                e.preventDefault();
                this.selectedObject.x = Math.max(0, this.selectedObject.x - (e.shiftKey ? 10 : 1));
                this.render();
                break;

            case 'ArrowRight':
                e.preventDefault();
                this.selectedObject.x = Math.min(this.A4_WIDTH - this.selectedObject.width, this.selectedObject.x + (e.shiftKey ? 10 : 1));
                this.render();
                break;
        }
    }

    /**
     * Applica layout verticale (fronte sopra, retro sotto)
     */
    applyVerticalLayout() {
        if (this.objects.length === 0) return;

        const spacing = 50;
        const availableHeight = (this.A4_HEIGHT - spacing) / 2;

        this.objects.forEach((obj, index) => {
            if (index >= 2) return; // Massimo 2 oggetti

            // Ridimensiona per fittare
            const ratio = Math.min(
                (this.A4_WIDTH * 0.9) / obj.canvas.width,
                availableHeight / obj.canvas.height
            );

            obj.width = Math.floor(obj.canvas.width * ratio);
            obj.height = Math.floor(obj.canvas.height * ratio);

            // Posiziona
            obj.x = (this.A4_WIDTH - obj.width) / 2;
            obj.y = index === 0 ? spacing : (this.A4_HEIGHT / 2 + spacing / 2);
        });

        this.render();
    }

    /**
     * Applica layout orizzontale (fronte e retro affiancati)
     */
    applyHorizontalLayout() {
        if (this.objects.length === 0) return;

        const spacing = 50;
        const availableWidth = (this.A4_WIDTH - spacing) / 2;

        this.objects.forEach((obj, index) => {
            if (index >= 2) return; // Massimo 2 oggetti

            // Ridimensiona per fittare
            const ratio = Math.min(
                availableWidth / obj.canvas.width,
                (this.A4_HEIGHT * 0.9) / obj.canvas.height
            );

            obj.width = Math.floor(obj.canvas.width * ratio);
            obj.height = Math.floor(obj.canvas.height * ratio);

            // Posiziona
            obj.x = index === 0 ? spacing : (this.A4_WIDTH / 2 + spacing / 2);
            obj.y = (this.A4_HEIGHT - obj.height) / 2;
        });

        this.render();
    }

    /**
     * Imposta zoom
     */
    setZoom(zoomLevel) {
        this.zoom = zoomLevel;
        if (this.wrapper) {
            this.wrapper.style.transform = `scale(${zoomLevel})`;
            this.wrapper.style.transformOrigin = 'top center';
        }
    }

    /**
     * Renderizza il canvas
     */
    render() {
        // Pulisci
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Disegna griglia leggera (opzionale)
        this.drawGrid();

        // Disegna oggetti
        this.objects.forEach(obj => {
            this.ctx.save();

            // Applica trasformazioni
            this.ctx.translate(obj.x + obj.width / 2, obj.y + obj.height / 2);
            this.ctx.rotate((obj.rotation * Math.PI) / 180);
            this.ctx.translate(-obj.width / 2, -obj.height / 2);

            // Disegna immagine
            this.ctx.drawImage(obj.canvas, 0, 0, obj.width, obj.height);

            // Disegna bordo se selezionato
            if (obj === this.selectedObject) {
                this.ctx.strokeStyle = '#3b82f6';
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(0, 0, obj.width, obj.height);
            }

            this.ctx.restore();
        });
    }

    /**
     * Disegna griglia guida
     */
    drawGrid() {
        this.ctx.strokeStyle = '#f0f0f0';
        this.ctx.lineWidth = 1;

        const gridSize = 100;

        // Linee verticali
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // Linee orizzontali
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        // Linea centrale
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 5]);

        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height / 2);
        this.ctx.lineTo(this.canvas.width, this.canvas.height / 2);
        this.ctx.stroke();

        this.ctx.setLineDash([]);
    }

    /**
     * Esporta il canvas (senza griglia)
     */
    export() {
        // Crea un canvas temporaneo senza griglia
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = this.A4_WIDTH;
        exportCanvas.height = this.A4_HEIGHT;
        const exportCtx = exportCanvas.getContext('2d');

        // Sfondo bianco
        exportCtx.fillStyle = '#ffffff';
        exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

        // Disegna solo gli oggetti
        this.objects.forEach(obj => {
            exportCtx.save();
            exportCtx.translate(obj.x + obj.width / 2, obj.y + obj.height / 2);
            exportCtx.rotate((obj.rotation * Math.PI) / 180);
            exportCtx.translate(-obj.width / 2, -obj.height / 2);
            exportCtx.drawImage(obj.canvas, 0, 0, obj.width, obj.height);
            exportCtx.restore();
        });

        return exportCanvas;
    }
}
