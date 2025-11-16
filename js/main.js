/**
 * Main Application Controller
 * Orchestrazione del processo di rilevamento e processing
 */

class IDCardApp {
    constructor() {
        this.detector = new DocumentDetector();
        this.processor = new ImageProcessor();
        this.processedDocuments = [];

        this.init();
    }

    init() {
        console.log('🚀 App inizializzata');

        // Setup drag & drop
        this.setupDragAndDrop();

        // Setup file input
        const fileInput = document.getElementById('fileInput');
        const dropZone = document.getElementById('dropZone');

        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));
    }

    setupDragAndDrop() {
        const dropZone = document.getElementById('dropZone');

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });
    }

    async handleFiles(files) {
        if (!files || files.length === 0) return;

        console.log(`📁 Ricevuti ${files.length} file`);

        // Mostra status
        this.showProcessing(true);

        // Pulisci risultati precedenti
        this.processedDocuments = [];
        document.getElementById('results').innerHTML = '';

        // Processa ogni file
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            console.log(`\n📄 Processing file ${i + 1}/${files.length}: ${file.name}`);

            this.updateStatus(`Processando ${file.name} (${i + 1}/${files.length})...`);

            try {
                await this.processFile(file, i);
            } catch (error) {
                console.error(`❌ Errore processing ${file.name}:`, error);
                this.showError(`Errore processing ${file.name}: ${error.message}`);
            }
        }

        this.showProcessing(false);
        console.log(`\n✅ Tutti i file processati! Totale documenti: ${this.processedDocuments.length}`);
    }

    async processFile(file, fileIndex) {
        // Carica l'immagine
        const image = await this.loadImage(file);

        // Rileva documenti nell'immagine
        const documents = this.detector.detectDocuments(image);

        if (documents.length === 0) {
            console.warn('⚠️ Nessun documento rilevato in questo file');
            return;
        }

        console.log(`✅ Rilevati ${documents.length} documento/i`);

        // Processa ogni documento rilevato
        for (let i = 0; i < documents.length; i++) {
            const bounds = documents[i];
            console.log(`\n🔄 Processando documento ${i + 1}/${documents.length}...`);

            // Processa: estrai, ruota, ottimizza
            const processedCanvas = this.processor.processDocument(image, bounds);

            // Salva risultato
            const docData = {
                canvas: processedCanvas,
                originalFile: file.name,
                documentIndex: i + 1,
                totalDocuments: documents.length,
                fileIndex: fileIndex
            };

            this.processedDocuments.push(docData);

            // Mostra risultato
            this.displayDocument(docData);

            console.log(`✅ Documento ${i + 1} processato con successo`);
        }
    }

    loadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();

                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Errore caricamento immagine'));

                img.src = e.target.result;
            };

            reader.onerror = () => reject(new Error('Errore lettura file'));
            reader.readAsDataURL(file);
        });
    }

    displayDocument(docData) {
        const resultsGrid = document.getElementById('results');

        const card = document.createElement('div');
        card.className = 'result-card';

        const img = document.createElement('img');
        img.src = docData.canvas.toDataURL('image/png');
        img.alt = `Documento ${docData.documentIndex}`;

        const info = document.createElement('div');
        info.className = 'result-card-info';

        const title = document.createElement('div');
        title.className = 'result-card-title';
        title.textContent = `Documento ${docData.documentIndex}`;
        if (docData.totalDocuments > 1) {
            title.textContent += ` di ${docData.totalDocuments}`;
        }

        const meta = document.createElement('div');
        meta.className = 'result-card-meta';
        meta.textContent = `Da: ${docData.originalFile} • ${docData.canvas.width}×${docData.canvas.height}px`;

        const actions = document.createElement('div');
        actions.className = 'result-card-actions';

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn btn-primary';
        downloadBtn.textContent = 'Scarica';
        downloadBtn.onclick = () => this.downloadDocument(docData);

        const copyBtn = document.createElement('button');
        copyBtn.className = 'btn btn-secondary';
        copyBtn.textContent = 'Copia';
        copyBtn.onclick = () => this.copyToClipboard(docData);

        actions.appendChild(downloadBtn);
        actions.appendChild(copyBtn);

        info.appendChild(title);
        info.appendChild(meta);
        info.appendChild(actions);

        card.appendChild(img);
        card.appendChild(info);

        resultsGrid.appendChild(card);
    }

    async downloadDocument(docData) {
        const blob = await this.processor.canvasToBlob(docData.canvas, 'image/png', 0.95);

        // Genera nome file
        const baseName = docData.originalFile.replace(/\.[^/.]+$/, '');
        const suffix = docData.totalDocuments > 1 ? `_doc${docData.documentIndex}` : '';
        const fileName = `${baseName}${suffix}_processed.png`;

        // Download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();

        URL.revokeObjectURL(url);

        console.log(`📥 Download: ${fileName}`);
    }

    async copyToClipboard(docData) {
        try {
            const blob = await this.processor.canvasToBlob(docData.canvas, 'image/png', 0.95);

            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);

            console.log('📋 Copiato negli appunti');
            alert('Immagine copiata negli appunti!');
        } catch (error) {
            console.error('❌ Errore copia:', error);
            alert('Errore durante la copia. Usa il pulsante Scarica invece.');
        }
    }

    showProcessing(show) {
        const statusEl = document.getElementById('processingStatus');
        statusEl.style.display = show ? 'block' : 'none';
    }

    updateStatus(text) {
        document.getElementById('statusText').textContent = text;
    }

    showError(message) {
        alert(message);
    }
}

// Inizializza app quando DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    window.app = new IDCardApp();
});
