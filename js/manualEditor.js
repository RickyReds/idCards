/**
 * ManualEditor - Permette selezione manuale di documenti
 */
class ManualEditor {
    constructor() {
        this.modal = null;
        this.canvas = null;
        this.ctx = null;
        this.image = null;
        this.fileName = null;
        this.boundingBoxes = [];
        this.currentBox = null;
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.scale = 1;
        this.rotation = 0;
        this.onComplete = null;
        this.documentCounter = 0;
    }

    /**
     * Apre l'editor manuale per un file
     */
    open(image, fileName, onComplete) {
        this.image = image;
        this.fileName = fileName;
        this.onComplete = onComplete;
        this.boundingBoxes = [];
        this.rotation = 0;

        this.createModal();
        this.setupCanvas();
        this.drawImage();
    }

    /**
     * Crea il modal dell'editor
     */
    createModal() {
        // Rimuovi modal esistente se presente
        const existing = document.getElementById('manualEditorModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'manualEditorModal';
        modal.className = 'manual-editor-modal';
        modal.innerHTML = `
            <div class="manual-editor-content">
                <div class="manual-editor-header">
                    <h2>✏️ Editor Manuale: ${this.fileName}</h2>
                    <button class="close-btn" id="closeManualEditor">&times;</button>
                </div>

                <div class="manual-editor-body">
                    <div class="canvas-container">
                        <canvas id="manualEditorCanvas"></canvas>
                    </div>

                    <div class="manual-editor-controls">
                        <div class="control-section">
                            <h3>📐 Strumenti</h3>
                            <p class="instruction">
                                🖱️ <strong>Disegna</strong>: Trascina sull'immagine per selezionare un'area<br>
                                🔄 <strong>Rotazione</strong>: Usa lo slider per ruotare il documento<br>
                                ✅ <strong>Aggiungi</strong>: Conferma la selezione corrente
                            </p>
                        </div>

                        <div class="control-section">
                            <label for="rotationSlider">
                                🔄 Rotazione: <span id="rotationValue">0°</span>
                            </label>
                            <input type="range" id="rotationSlider" min="-180" max="180" value="0" step="1">
                        </div>

                        <div class="control-section">
                            <h3>📦 Selezioni (${this.boundingBoxes.length})</h3>
                            <div id="boxesList" class="boxes-list"></div>
                        </div>
                    </div>
                </div>

                <div class="manual-editor-footer">
                    <button class="btn btn-secondary" id="cancelManualEdit">❌ Annulla</button>
                    <button class="btn btn-primary" id="addCurrentBox">➕ Aggiungi Selezione</button>
                    <button class="btn btn-success" id="completeManualEdit" disabled>✅ Completa (0)</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modal = modal;

        // Event listeners
        document.getElementById('closeManualEditor').addEventListener('click', () => this.close());
        document.getElementById('cancelManualEdit').addEventListener('click', () => this.close());
        document.getElementById('addCurrentBox').addEventListener('click', () => this.addCurrentBox());
        document.getElementById('completeManualEdit').addEventListener('click', () => this.complete());

        const rotationSlider = document.getElementById('rotationSlider');
        rotationSlider.addEventListener('input', (e) => {
            this.rotation = parseInt(e.target.value);
            document.getElementById('rotationValue').textContent = this.rotation + '°';
            this.drawImage();
        });
    }

    /**
     * Setup canvas per disegnare
     */
    setupCanvas() {
        this.canvas = document.getElementById('manualEditorCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Dimensiona canvas per contenere l'immagine
        const maxWidth = 800;
        const maxHeight = 600;

        let width = this.image.width;
        let height = this.image.height;

        this.scale = Math.min(maxWidth / width, maxHeight / height, 1);

        this.canvas.width = width * this.scale;
        this.canvas.height = height * this.scale;

        // Event listeners per disegnare
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('mouseleave', () => this.isDrawing = false);
    }

    /**
     * Disegna l'immagine sul canvas
     */
    drawImage() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Disegna immagine scalata
        this.ctx.save();
        this.ctx.scale(this.scale, this.scale);
        this.ctx.drawImage(this.image, 0, 0);
        this.ctx.restore();

        // Disegna bounding boxes salvate
        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = 2;
        this.ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';

        this.boundingBoxes.forEach((box, index) => {
            this.ctx.fillRect(box.x, box.y, box.width, box.height);
            this.ctx.strokeRect(box.x, box.y, box.width, box.height);

            // Label
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillText(`#${index + 1}`, box.x + 5, box.y + 20);
            this.ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';
        });

        // Disegna box corrente in progress
        if (this.currentBox) {
            this.ctx.strokeStyle = '#2196F3';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.fillStyle = 'rgba(33, 150, 243, 0.1)';

            this.ctx.fillRect(this.currentBox.x, this.currentBox.y, this.currentBox.width, this.currentBox.height);
            this.ctx.strokeRect(this.currentBox.x, this.currentBox.y, this.currentBox.width, this.currentBox.height);
            this.ctx.setLineDash([]);
        }
    }

    /**
     * Mouse down - inizia a disegnare
     */
    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.startX = e.clientX - rect.left;
        this.startY = e.clientY - rect.top;
        this.isDrawing = true;
        this.currentBox = null;
    }

    /**
     * Mouse move - disegna box
     */
    onMouseMove(e) {
        if (!this.isDrawing) return;

        const rect = this.canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        const x = Math.min(this.startX, currentX);
        const y = Math.min(this.startY, currentY);
        const width = Math.abs(currentX - this.startX);
        const height = Math.abs(currentY - this.startY);

        this.currentBox = { x, y, width, height };
        this.drawImage();
    }

    /**
     * Mouse up - completa box
     */
    onMouseUp(e) {
        this.isDrawing = false;

        // Verifica che il box sia abbastanza grande (almeno 20x20)
        if (this.currentBox && this.currentBox.width > 20 && this.currentBox.height > 20) {
            // Box valido, pronto per essere aggiunto
            console.log('Box disegnato:', this.currentBox);
        } else {
            this.currentBox = null;
            this.drawImage();
        }
    }

    /**
     * Aggiungi box corrente alla lista
     */
    addCurrentBox() {
        if (!this.currentBox) {
            alert('⚠️ Disegna prima una selezione sull\'immagine!');
            return;
        }

        // Converti coordinate da canvas a immagine originale
        const box = {
            x: this.currentBox.x / this.scale,
            y: this.currentBox.y / this.scale,
            width: this.currentBox.width / this.scale,
            height: this.currentBox.height / this.scale,
            rotation: this.rotation
        };

        this.boundingBoxes.push(box);
        this.currentBox = null;

        this.updateBoxesList();
        this.drawImage();

        // Aggiorna pulsante completa
        const completeBtn = document.getElementById('completeManualEdit');
        completeBtn.disabled = false;
        completeBtn.textContent = `✅ Completa (${this.boundingBoxes.length})`;

        console.log(`✅ Selezione aggiunta. Totale: ${this.boundingBoxes.length}`);
    }

    /**
     * Aggiorna lista boxes
     */
    updateBoxesList() {
        const list = document.getElementById('boxesList');

        if (this.boundingBoxes.length === 0) {
            list.innerHTML = '<p class="empty-list">Nessuna selezione</p>';
            return;
        }

        list.innerHTML = this.boundingBoxes.map((box, index) => `
            <div class="box-item">
                <span class="box-number">#${index + 1}</span>
                <span class="box-info">${Math.round(box.width)}×${Math.round(box.height)}px, ${box.rotation}°</span>
                <button class="btn-remove" onclick="app.manualEditor.removeBox(${index})">🗑️</button>
            </div>
        `).join('');
    }

    /**
     * Rimuovi un box dalla lista
     */
    removeBox(index) {
        this.boundingBoxes.splice(index, 1);
        this.updateBoxesList();
        this.drawImage();

        const completeBtn = document.getElementById('completeManualEdit');
        if (this.boundingBoxes.length === 0) {
            completeBtn.disabled = true;
        }
        completeBtn.textContent = `✅ Completa (${this.boundingBoxes.length})`;
    }

    /**
     * Completa e crea documenti
     */
    complete() {
        if (this.boundingBoxes.length === 0) {
            alert('⚠️ Aggiungi almeno una selezione!');
            return;
        }

        console.log(`📦 Creazione di ${this.boundingBoxes.length} documenti...`);

        const documents = this.boundingBoxes.map((box, index) => {
            return this.createDocument(box, index);
        });

        if (this.onComplete) {
            this.onComplete(documents);
        }

        this.close();
    }

    /**
     * Crea un documento da una bounding box
     */
    createDocument(box, index) {
        // Crea canvas per il documento
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Se c'è rotazione, calcola dimensioni ruotate
        if (box.rotation !== 0) {
            const angle = box.rotation * Math.PI / 180;
            const cos = Math.abs(Math.cos(angle));
            const sin = Math.abs(Math.sin(angle));

            canvas.width = box.width * cos + box.height * sin;
            canvas.height = box.width * sin + box.height * cos;

            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(angle);
            ctx.drawImage(this.image, box.x, box.y, box.width, box.height, -box.width / 2, -box.height / 2, box.width, box.height);
        } else {
            canvas.width = box.width;
            canvas.height = box.height;
            ctx.drawImage(this.image, box.x, box.y, box.width, box.height, 0, 0, box.width, box.height);
        }

        // Crea ID univoco
        this.documentCounter++;
        const docId = `manual_${this.documentCounter}_${Date.now()}`;

        // Preserva DPI dall'immagine originale
        const dpi = this.image.dpi || 300;
        canvas.dpi = dpi;

        return {
            id: docId,
            canvas: canvas,
            bounds: { x: box.x, y: box.y, width: box.width, height: box.height },
            rotation: box.rotation,
            originalImage: this.image,
            source: 'manual',
            dpi: dpi
        };
    }

    /**
     * Chiudi editor
     */
    close() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }

        this.boundingBoxes = [];
        this.currentBox = null;
        this.image = null;
    }
}
