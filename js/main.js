/**
 * Main Application
 * Coordina tutti i componenti dell'app
 */

// Stato globale
const app = {
    detector: null,
    processor: null,
    canvasManager: null,
    exporter: null,
    documents: [], // Documenti rilevati
    loadingOverlay: null
};

/**
 * Inizializzazione
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

/**
 * Inizializza i componenti dell'app
 */
function initializeApp() {
    app.detector = new DocumentDetector();
    app.processor = new ImageProcessor();
    app.exporter = new Exporter();

    const canvas = document.getElementById('a4Canvas');
    app.canvasManager = new CanvasManager(canvas);

    app.loadingOverlay = document.getElementById('loadingOverlay');

    console.log('App inizializzata correttamente');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Drop zone
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);

    fileInput.addEventListener('change', handleFileSelect);

    // Zoom slider
    const zoomSlider = document.getElementById('zoomSlider');
    const zoomValue = document.getElementById('zoomValue');

    zoomSlider.addEventListener('input', (e) => {
        const zoom = parseFloat(e.target.value);
        app.canvasManager.setZoom(zoom);
        zoomValue.textContent = `${Math.round(zoom * 100)}%`;
    });

    // Template buttons
    document.getElementById('btnLayoutVertical').addEventListener('click', () => {
        app.canvasManager.applyVerticalLayout();
    });

    document.getElementById('btnLayoutHorizontal').addEventListener('click', () => {
        app.canvasManager.applyHorizontalLayout();
    });

    document.getElementById('btnClearCanvas').addEventListener('click', () => {
        if (confirm('Vuoi davvero pulire il canvas?')) {
            app.canvasManager.clear();
        }
    });

    // Export button
    document.getElementById('btnExport').addEventListener('click', handleExport);
}

/**
 * Gestione drag over
 */
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('drag-over');
}

/**
 * Gestione drag leave
 */
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
}

/**
 * Gestione drop
 */
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
}

/**
 * Gestione selezione file
 */
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    processFiles(files);
}

/**
 * Processa i file caricati
 */
async function processFiles(files) {
    showLoading(true, 'Caricamento e rilevamento documenti...');

    try {
        for (const file of files) {
            await processFile(file);
        }
    } catch (error) {
        console.error('Errore durante il processing:', error);
        alert(`Errore: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

/**
 * Processa un singolo file
 */
async function processFile(file) {
    // Verifica tipo file
    if (!file.type.match(/image\/(png|jpeg|jpg)/)) {
        if (file.type === 'application/pdf') {
            alert('I file PDF non sono ancora supportati. Converti il PDF in immagine (PNG/JPG) prima del caricamento.');
            return;
        }
        throw new Error(`Tipo file non supportato: ${file.type}`);
    }

    // Carica immagine
    const image = await app.processor.loadImage(file);

    // Rileva documenti nell'immagine
    let detectedDocs = await app.detector.detectDocuments(image);

    // Se non trova documenti, usa split in metà come fallback
    if (detectedDocs.length === 0) {
        console.log('Nessun documento rilevato automaticamente, split in 2 parti');
        detectedDocs = app.detector.splitImageInHalf(image);
    }

    // Processa ogni documento rilevato
    console.log(`Rilevati ${detectedDocs.length} documento/i`);
    showLoading(true, `Rilevati ${detectedDocs.length} documento/i. Elaborazione...`);

    for (let i = 0; i < detectedDocs.length; i++) {
        const doc = detectedDocs[i];

        showLoading(true, `Elaborazione documento ${i + 1}/${detectedDocs.length}: allineamento...`);
        console.log(`Processando documento ${i + 1}/${detectedDocs.length}...`);

        // Auto-allinea (correggi rotazione)
        const alignedCanvas = app.processor.autoAlign(doc.canvas);
        console.log(`  ✓ Allineamento completato`);

        showLoading(true, `Elaborazione documento ${i + 1}/${detectedDocs.length}: ottimizzazione...`);

        // Ottimizza qualità
        const enhancedCanvas = app.processor.enhance(alignedCanvas);
        console.log(`  ✓ Ottimizzazione completata`);

        // Aggiungi alla lista documenti
        const processedDoc = {
            id: doc.id,
            canvas: enhancedCanvas,
            originalBounds: doc.bounds
        };

        app.documents.push(processedDoc);

        // Aggiungi alla UI
        addDocumentToGrid(processedDoc);
        console.log(`  ✓ Documento ${i + 1} pronto all'uso`);
    }

    updateDocumentsGrid();
    console.log('Tutti i documenti sono stati processati e sono pronti all\'uso');
}

/**
 * Aggiunge un documento alla griglia
 */
function addDocumentToGrid(doc) {
    const grid = document.getElementById('documentsGrid');

    // Rimuovi placeholder se presente
    const placeholder = grid.querySelector('.placeholder');
    if (placeholder) {
        placeholder.remove();
    }

    // Crea elemento documento
    const docElement = document.createElement('div');
    docElement.className = 'document-item';
    docElement.dataset.docId = doc.id;
    docElement.draggable = true;

    // Crea thumbnail
    const thumbnail = document.createElement('img');
    thumbnail.src = doc.canvas.toDataURL('image/png');
    thumbnail.alt = 'Documento';

    // Label
    const label = document.createElement('div');
    label.className = 'doc-label';
    label.textContent = `${doc.canvas.width}x${doc.canvas.height}px`;

    // Azioni (elimina)
    const actions = document.createElement('div');
    actions.className = 'doc-actions';

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>`;
    deleteBtn.title = 'Elimina';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeDocument(doc.id);
    });

    actions.appendChild(deleteBtn);

    docElement.appendChild(thumbnail);
    docElement.appendChild(label);
    docElement.appendChild(actions);

    // Drag events
    docElement.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', doc.id);
        docElement.classList.add('dragging');
    });

    docElement.addEventListener('dragend', () => {
        docElement.classList.remove('dragging');
    });

    // Click per aggiungere al canvas
    docElement.addEventListener('click', () => {
        addDocumentToCanvas(doc);
    });

    grid.appendChild(docElement);
}

/**
 * Aggiunge un documento al canvas A4
 */
function addDocumentToCanvas(doc) {
    app.canvasManager.addDocument(doc.canvas);

    // Nascondi la guida se è il primo documento
    const guide = document.querySelector('.canvas-guide');
    if (guide && app.canvasManager.objects.length > 0) {
        guide.style.display = 'none';
    }
}

/**
 * Rimuove un documento
 */
function removeDocument(docId) {
    // Rimuovi dalla lista
    app.documents = app.documents.filter(d => d.id !== docId);

    // Rimuovi dalla UI
    const element = document.querySelector(`[data-doc-id="${docId}"]`);
    if (element) {
        element.remove();
    }

    updateDocumentsGrid();
}

/**
 * Aggiorna la griglia documenti
 */
function updateDocumentsGrid() {
    const grid = document.getElementById('documentsGrid');

    if (grid.children.length === 0) {
        const placeholder = document.createElement('p');
        placeholder.className = 'placeholder';
        placeholder.textContent = 'Nessun documento caricato';
        grid.appendChild(placeholder);
    }
}

/**
 * Setup drag-drop sul canvas
 */
const canvasContainer = document.getElementById('canvasContainer');

canvasContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
});

canvasContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const docId = e.dataTransfer.getData('text/plain');
    const doc = app.documents.find(d => d.id === docId);

    if (doc) {
        const canvasRect = app.canvasManager.canvas.getBoundingClientRect();

        // Calcola posizione relativa sul canvas tenendo conto del display scale
        const scaleX = app.canvasManager.canvas.width / canvasRect.width;
        const scaleY = app.canvasManager.canvas.height / canvasRect.height;
        const x = (e.clientX - canvasRect.left) * scaleX;
        const y = (e.clientY - canvasRect.top) * scaleY;

        app.canvasManager.addDocument(doc.canvas, {x, y});

        // Nascondi guida
        const guide = document.querySelector('.canvas-guide');
        if (guide) {
            guide.style.display = 'none';
        }
    }
});

/**
 * Gestione export
 */
async function handleExport() {
    if (app.canvasManager.objects.length === 0) {
        alert('Aggiungi almeno un documento al canvas prima di esportare');
        return;
    }

    showLoading(true);

    try {
        // Ottieni formato selezionato
        const format = document.querySelector('input[name="exportFormat"]:checked').value;

        // Esporta canvas (senza griglia)
        const exportCanvas = app.canvasManager.export();

        // Esporta nel formato richiesto
        await app.exporter.export(exportCanvas, format);

        console.log(`Documento esportato come ${format.toUpperCase()}`);
    } catch (error) {
        console.error('Errore durante export:', error);
        alert(`Errore durante l'esportazione: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

/**
 * Mostra/nascondi loading overlay
 */
function showLoading(show, message = 'Elaborazione in corso...') {
    if (show) {
        app.loadingOverlay.classList.add('active');
        const loadingText = app.loadingOverlay.querySelector('p');
        if (loadingText) {
            loadingText.textContent = message;
        }
    } else {
        app.loadingOverlay.classList.remove('active');
    }
}

/**
 * Utility: Log info
 */
function logInfo(message) {
    console.log(`[INFO] ${message}`);
}

/**
 * Utility: Log error
 */
function logError(message, error) {
    console.error(`[ERROR] ${message}`, error);
}
