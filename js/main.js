/**
 * Main Application
 * Coordina tutti i componenti dell'app
 */

// Versione applicazione
const APP_VERSION = '1.4.1';
const APP_BUILD_DATE = '2024-11-16';

// Stato globale
const app = {
    detector: null,
    processor: null,
    canvasManager: null,
    exporter: null,
    manualEditor: null,
    documents: [], // Documenti rilevati
    usedDocuments: new Set(), // IDs dei documenti già aggiunti al canvas
    originalFiles: new Map(), // Mappa fileName -> {image, file} per editing manuale
    loadingOverlay: null,
    version: APP_VERSION
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
    app.manualEditor = new ManualEditor();

    const canvas = document.getElementById('a4Canvas');
    app.canvasManager = new CanvasManager(canvas);

    app.loadingOverlay = document.getElementById('loadingOverlay');

    // Mostra versione
    displayVersion();

    console.log(`✅ ID Cards Composer v${APP_VERSION} inizializzata correttamente`);
}

/**
 * Mostra la versione nell'UI
 */
function displayVersion() {
    const versionElement = document.getElementById('appVersion');
    const buildDateElement = document.getElementById('buildDate');

    if (versionElement) {
        versionElement.textContent = `v${APP_VERSION}`;
    }

    if (buildDateElement) {
        buildDateElement.textContent = APP_BUILD_DATE;
    }
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

    // Listener per riabilitare documenti quando vengono cancellati dal canvas
    document.addEventListener('documentRemoved', (e) => {
        const documentId = e.detail.documentId;
        reenableDocument(documentId);
    });
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
    console.log(`\n========================================`);
    console.log(`📁 Inizio processing di ${files.length} file`);
    console.log(`========================================`);

    showLoading(true, 'Caricamento e rilevamento documenti...');

    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            console.log(`\n--- FILE ${i + 1}/${files.length}: ${file.name} ---`);
            await processFile(file);
        }
    } catch (error) {
        console.error('Errore durante il processing:', error);
        alert(`Errore: ${error.message}`);
    } finally {
        showLoading(false);
        console.log(`\n========================================`);
        console.log(`✅ Processing completato: ${app.documents.length} documenti totali`);
        console.log(`========================================\n`);
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

    // Salva immagine originale per editing manuale
    app.originalFiles.set(file.name, { image, file });

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
            originalBounds: doc.bounds,
            fileName: file.name // Per editing manuale
        };

        app.documents.push(processedDoc);

        // Aggiungi alla UI
        addDocumentToGrid(processedDoc, file.name);
        console.log(`  ✓ Documento ${i + 1} pronto all'uso`);
    }

    updateDocumentsGrid();
    console.log('Tutti i documenti sono stati processati e sono pronti all\'uso');
}

/**
 * Aggiunge un documento alla griglia
 */
function addDocumentToGrid(doc, fileName = null) {
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
    if (fileName) {
        docElement.dataset.fileName = fileName;
    }
    docElement.draggable = true;

    // Crea thumbnail
    const thumbnail = document.createElement('img');
    thumbnail.src = doc.canvas.toDataURL('image/png');
    thumbnail.alt = 'Documento';

    // Label
    const label = document.createElement('div');
    label.className = 'doc-label';
    label.textContent = `${doc.canvas.width}x${doc.canvas.height}px`;

    // Azioni (edit manuale + elimina)
    const actions = document.createElement('div');
    actions.className = 'doc-actions';

    // Bottone Edit Manuale (solo se c'è fileName)
    if (fileName && app.originalFiles.has(fileName)) {
        const editBtn = document.createElement('button');
        editBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>`;
        editBtn.title = 'Modifica Manualmente';
        editBtn.className = 'edit-manual-btn';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openManualEditor(fileName);
        });
        actions.appendChild(editBtn);
    }

    // Bottone Elimina
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
function addDocumentToCanvas(doc, position = null) {
    // Verifica se il documento è già stato usato
    if (app.usedDocuments.has(doc.id)) {
        console.log(`⚠️ Documento ${doc.id} già aggiunto al canvas`);
        // Mostra feedback visivo (opzionale)
        const docElement = document.querySelector(`[data-doc-id="${doc.id}"]`);
        if (docElement) {
            docElement.classList.add('already-used-flash');
            setTimeout(() => docElement.classList.remove('already-used-flash'), 600);
        }
        return;
    }

    // Aggiungi al canvas con documentId per tracking
    const options = position ? { ...position, documentId: doc.id } : { documentId: doc.id };
    app.canvasManager.addDocument(doc.canvas, options);

    // Marca come usato
    app.usedDocuments.add(doc.id);

    // Aggiorna UI del documento nella griglia
    const docElement = document.querySelector(`[data-doc-id="${doc.id}"]`);
    if (docElement) {
        docElement.classList.add('used');
        docElement.title = 'Documento già aggiunto al canvas';
    }

    // Nascondi la guida se è il primo documento
    const guide = document.querySelector('.canvas-guide');
    if (guide && app.canvasManager.objects.length > 0) {
        guide.style.display = 'none';
    }
}

/**
 * Riabilita un documento quando viene rimosso dal canvas
 */
function reenableDocument(docId) {
    // Rimuovi dal set dei documenti usati
    app.usedDocuments.delete(docId);

    // Rimuovi classe 'used' dall'UI
    const docElement = document.querySelector(`[data-doc-id="${docId}"]`);
    if (docElement) {
        docElement.classList.remove('used');
        docElement.title = '';
        console.log(`♻️ Documento ${docId} riabilitato e riutilizzabile`);
    }
}

/**
 * Rimuove un documento dalla lista (eliminazione permanente)
 */
function removeDocument(docId) {
    // Rimuovi dalla lista
    app.documents = app.documents.filter(d => d.id !== docId);

    // Rimuovi dal set usedDocuments se presente
    app.usedDocuments.delete(docId);

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

        // Usa la funzione addDocumentToCanvas che gestisce il single-use
        addDocumentToCanvas(doc, {x, y});
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


/**
 * Apre l'editor manuale per un file
 */
function openManualEditor(fileName) {
    const fileData = app.originalFiles.get(fileName);
    if (!fileData) {
        console.error('File originale non trovato: ' + fileName);
        return;
    }

    console.log('📝 Apertura editor manuale per: ' + fileName);

    // Rimuovi documenti automatici per questo file
    removeDocumentsFromFile(fileName);

    // Apri editor manuale
    app.manualEditor.open(fileData.image, fileName, (manualDocs) => {
        handleManualDocumentsComplete(manualDocs, fileName);
    });
}

/**
 * Rimuove tutti i documenti rilevati da un file specifico
 */
function removeDocumentsFromFile(fileName) {
    // Trova tutti i documenti da questo file
    const docsToRemove = app.documents.filter(doc => doc.fileName === fileName);

    console.log('🗑️ Rimozione ' + docsToRemove.length + ' documenti automatici da ' + fileName);

    // Rimuovi ogni documento
    docsToRemove.forEach(doc => {
        removeDocument(doc.id);
    });
}

/**
 * Gestisce i documenti creati manualmente
 */
function handleManualDocumentsComplete(manualDocs, fileName) {
    console.log('✅ Creati ' + manualDocs.length + ' documenti manuali da ' + fileName);

    showLoading(true, 'Elaborazione ' + manualDocs.length + ' documento/i manuali...');

    // Processa ogni documento manuale
    manualDocs.forEach((doc, index) => {
        // Ottimizza qualità
        const enhancedCanvas = app.processor.enhance(doc.canvas);

        // Crea documento processato
        const processedDoc = {
            id: doc.id,
            canvas: enhancedCanvas,
            originalBounds: doc.bounds,
            fileName: fileName,
            rotation: doc.rotation,
            source: 'manual'
        };

        app.documents.push(processedDoc);
        addDocumentToGrid(processedDoc, fileName);

        console.log('  ✓ Documento manuale ' + (index + 1) + '/' + manualDocs.length + ' pronto');
    });

    updateDocumentsGrid();
    showLoading(false);

    console.log('🎉 ' + manualDocs.length + ' documenti manuali aggiunti con successo');
}
