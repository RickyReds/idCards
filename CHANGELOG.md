# Changelog

Tutte le modifiche significative a questo progetto verranno documentate in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.0.0/),
e questo progetto aderisce a [Semantic Versioning](https://semver.org/lang/it/).

## [1.4.1] - 2024-11-16

### Fixed
- **Canvas A4 ora centrato correttamente**: Risolto problema margine alto clippato
  - Cambiato `align-items` da `flex-start` a `center` nel container
  - Aumentato padding verticale da 20px a 30px
  - Modificato max-height da fisso 800px a `calc(100vh - 200px)` dinamico
  - Aggiunto min-height 600px per consistenza
  - Risolto conflitto CSS tra `.canvas-container` principale e manual editor

### Added
- **Preservazione DPI automatica**: Sistema completo per mantenere dimensioni originali delle scansioni
  - Estrazione automatica DPI da file PNG (chunk pHYs) e JPEG (JFIF APP0)
  - DPI predefinito 300 se non trovati nei metadati
  - Log console mostra DPI estratti: `📷 Immagine: 2480×658px @ 300DPI`
- **Export PDF con dimensioni reali**: PDF esportati mantengono dimensioni fisiche corrette
  - Calcolo automatico mm da pixel basato su DPI: `(pixel / DPI) × 25.4`
  - Log mostra conversione: `📄 Export PDF: 2480×658px @ 300DPI → 209.5×55.6mm`
  - Centratura automatica su pagina A4
  - Ridimensionamento solo se necessario per stare in A4

### Changed
- Propagazione DPI attraverso tutte le operazioni: detection, trim, rotation, enhance
- `imageProcessor.extractDPI()`: Legge metadati PNG/JPEG per trovare DPI
- `documentDetector.cropDocument()`: Preserva DPI sul canvas croppato
- `imageProcessor.rotateCanvas()`: Mantiene DPI dopo rotazione
- `manualEditor.createDocument()`: Preserva DPI in selezioni manuali
- `exporter.exportAsPDF()`: Usa DPI per calcolare dimensioni reali
- Tutti i canvas ora hanno proprietà `.dpi` accessibile

### Technical Details
- PNG DPI: Lettura da chunk pHYs (pixels per meter → DPI)
- JPEG DPI: Lettura da JFIF APP0 marker (units 1=DPI, 2=DPC)
- Formula conversione: `mm = (pixels / DPI) × 25.4`
- DPI propagati in: loadImage → detectDocuments → cropDocument → autoAlign → enhance → export

## [1.4.0] - 2024-11-16

### Added
- **Editor Manuale Interattivo**: Sistema completo per selezione e cropping manuale documenti
  - Modal interattivo con canvas per disegnare bounding boxes
  - Selezione multipla: disegna più aree sulla stessa immagine
  - Slider per rotazione manuale (-180° a +180°)
  - Preview in tempo reale delle selezioni
  - Lista delle selezioni con possibilità di rimuovere singole aree
  - Statistiche: dimensioni, rotazione per ogni selezione
- **Bottone "Modifica Manualmente"**: Su ogni documento rilevato automaticamente
  - Click sul bottone elimina i documenti auto-rilevati da quel file
  - Apre l'editor manuale con l'immagine originale
  - Permette di riselezionare manualmente le aree corrette
- **Workflow Ibrido Auto+Manuale**:
  - Processing automatico come prima
  - Se insoddisfatto, click su "Modifica Manualmente"
  - Crea selezioni precise con mouse
  - Ruota se necessario con slider
  - Conferma e i documenti manuali sostituiscono quelli automatici

### Changed
- File originali ora salvati in `app.originalFiles` per editing successivo
- Documenti ora includono campo `fileName` per tracciare il file di origine
- Documenti manuali marcati con `source: 'manual'` per distinguerli
- Bottone edit manuale ha hover blu, bottone elimina rimane rosso

### Technical Details
- Nuovo file `js/manualEditor.js` con classe `ManualEditor`
- Canvas interattivo con eventi mouse per disegnare rettangoli
- Supporto rotazione con transform matrix
- Gestione stato per multiple selezioni
- CSS responsive per modal editor

## [1.3.5] - 2024-11-16

### Fixed
- **Risolto crash "Reduce of empty array"**: Fix errore quando tutti i threshold dell'algoritmo adattivo vengono scartati dalla validazione
  - Aggiunto fallback permissivo con validazione disabilitata quando nessun threshold produce risultati validi
  - Se il fallback fallisce, ritorna bounds originali senza trim invece di crashare
  - Aggiunto valore iniziale al reduce per sicurezza
  - Il metodo `findTrimBounds()` ora accetta parametro opzionale `skipValidation` per disabilitare validazione area ratio

### Changed
- Log migliorato mostra quando viene usato il fallback permissivo

## [1.3.4] - 2024-11-16

### Added
- **Debug Tool Interattivo**: Nuovo file `debug-trim.html` per testare e ottimizzare parametri di trim
  - Interfaccia visuale per caricare immagini e vedere risultati in tempo reale
  - 4 preset predefiniti: Corrente, Aggressivo, Moderato, Gentile
  - Controlli slider per regolare White Threshold, Min Pixels %, e Margin
  - Visualizzazione side-by-side di fronte e retro prima/dopo trim
  - Statistiche dettagliate: dimensioni, pixel rimossi, aspect ratio
- **Documentazione Debug**: File `DEBUG-TRIM-INSTRUCTIONS.md` con istruzioni complete per uso del tool

### Changed
- **Algoritmo Trim Adattivo**: Sistema intelligente di auto-ottimizzazione
  - Prova automaticamente 3 threshold diversi (248, 250, 252)
  - Calcola score per ogni risultato basato su area rimossa e aspect ratio
  - Sceglie automaticamente il threshold migliore per ogni documento
  - MinPixelsThreshold ridotto da 1% a 0.5% per maggiore aggressività
  - Validazione automatica: scarta trim troppo aggressivi (< 30% area) o conservativi (> 99% area)
- **Nuovi metodi DocumentDetector**:
  - `findTrimBounds()`: Calcola bounds con parametri specifici
  - `scoreTrimResult()`: Assegna score di qualità al trim
  - Log migliorato mostra threshold scelto e score

### Technical Details
- Il trim adattivo considera aspect ratio standard carte ID (1.586:1)
- Penalizza aspect ratio anomali per evitare trim eccessivi
- Migliore gestione differenze tra fronte e retro

## [1.3.3] - 2024-11-16

### Fixed
- **Trim whitespace ancora più aggressivo**: Ulteriore miglioramento algoritmo di ritaglio margini
  - Threshold bianco aumentato da 250 a 252
  - Soglia percentuale ridotta dall'2% all'1%
  - Risolve problema del fronte non croppato correttamente

### Added
- **Riutilizzo documenti dopo cancellazione**: I documenti possono essere riutilizzati dopo essere stati cancellati dal canvas
  - Quando si elimina un documento dal canvas (tasto Canc/Backspace), la spunta verde sparisce
  - Il documento torna cliccabile e draggabile
  - Implementato sistema CustomEvent per notifica rimozione
  - Aggiunto campo `documentId` agli oggetti canvas per tracking
  - Funzione `reenableDocument()` gestisce il riutilizzo

### Changed
- CanvasManager ora traccia l'ID del documento originale (`documentId`)
- Evento `documentRemoved` emesso quando un documento viene cancellato dal canvas
- Log migliorato: mostra quando un documento viene riabilitato

## [1.3.2] - 2024-11-16

### Fixed
- **Trim whitespace più aggressivo**: Migliorato algoritmo di ritaglio margini
  - Threshold bianco aumentato da 245 a 250 per rilevare meglio i bordi
  - Soglia percentuale ridotta dal 5% al 2% per essere più aggressivo
  - Margine ridotto da 2px a 1px
  - Log migliorato mostra quantità esatta di pixel rimossi per lato (T/B/L/R)

### Added
- **Sistema single-use per documenti**: Ogni documento può essere aggiunto al canvas una sola volta
  - Stato globale `usedDocuments` traccia i documenti già aggiunti
  - Feedback visivo: documenti usati mostrano checkmark verde e sono semi-trasparenti
  - Effetto flash rosso se si prova ad aggiungere un documento già usato
  - Funziona sia con click che drag-and-drop
  - Previene duplicazione accidentale di documenti sul canvas

### Changed
- Log di trim ora mostra esattamente quanti pixel vengono rimossi da ogni lato

## [1.3.1] - 2024-11-16

### Fixed
- **Soglia rotazione aumentata**: Soglia per skip rotazione aumentata da 3° a 5° per documenti landscape con aspect ratio corretto
  - Previene rotazioni inutili su documenti con piccole imperfezioni di scansione
  - Soglia generale per altri documenti aumentata da 0.3° a 2° (più realistica)

- **Rilevamento documenti migliorato**: Algoritmo di rilevamento bounds più robusto
  - Threshold di sensibilità migliorato (98% invece di 100%)
  - Margini ridotti da 5px a 2px per evitare inclusione spazi bianchi eccessivi
  - Requisito dimensione minima ridotto da 10% a 5% dell'immagine
  - Check aggiunto per evitare di accettare bounds che coprono 95%+ dell'immagine

- **Trim whitespace più accurato**: Algoritmo di ritaglio margini completamente rivisto
  - Conta pixel non-bianchi per riga/colonna invece di cercare primo pixel scuro
  - Richiede almeno 5% della riga/colonna non-bianco per considerarla bordo
  - Threshold bianco aumentato da 240 a 245 per maggiore sensibilità
  - Margine ridotto da 3px a 2px

### Changed
- Log migliorati con informazioni dettagliate su bounds, aspect ratio e angoli rilevati

## [1.3.0] - 2024-11-16

### Fixed
- **Rotazione non necessaria**: Risolto bug che proponeva di ruotare documenti già orientati correttamente
  - L'algoritmo `autoAlign()` ora verifica l'aspect ratio prima di applicare rotazioni
  - Se documento è landscape (width > height) con aspect ratio corretto (~1.586 ±50%) e angolo < 3°, la rotazione viene saltata
  - Previene rotazioni inutili su carte ID già scansionate in orientamento corretto

### Added
- Sistema di versioning visibile nell'applicazione
- Versione e data build mostrate nel footer dell'app
- Log migliorato che include versione all'avvio

## [1.2.0] - 2024-11-15

### Fixed
- **Edge Detection Migliorato**: Algoritmo di rilevamento rotazione più robusto
  - Analizza 4 bordi (superiore, inferiore, sinistro, destro) invece di uno solo
  - Usa regressione lineare per calcolare l'angolo di ogni bordo
  - Calcola mediana invece di media per robustezza contro outlier
  - Ridotta variabilità angoli da ±27° a ±2°

### Changed
- Limitazione rotazione a ±15° per evitare correzioni eccessive

## [1.1.0] - 2024-11-14

### Fixed
- **Gap Detection**: Risolto problema di split errato di documenti singoli
  - Soglia minima gap aumentata all'8% della dimensione immagine
  - Aggiunta validazione aspect ratio per scartare split con proporzioni sbagliate
  - Validazione area minima (5% dell'immagine)

### Changed
- Parametri di detection più conservativi per ridurre falsi positivi

## [1.0.0] - 2024-11-13

### Added
- **Rilevamento Documenti**: Algoritmo basato su projection profile analysis
  - Analizza proiezioni di luminosità orizzontale e verticale
  - Identifica gap tra documenti multipli
  - Validazione aspect ratio per carte ID (~1.586)

- **Auto-Rotazione**: Sistema di correzione automatica inclinazione
  - Edge detection con Sobel operator
  - Calcolo angolo tramite analisi bordi
  - Rotazione con antialiasing e crop automatico

- **Ottimizzazione Immagine**: Enhancement automatico qualità
  - Contrasto +20%
  - Luminosità +8%
  - Crop automatico spazi bianchi

- **Interfaccia Utente**: Web app completa
  - Drag & drop per caricamento immagini
  - Canvas A4 interattivo per composizione
  - Layout rapidi (verticale/orizzontale)
  - Export in PDF, PNG, JPG

- **Architettura Modulare**:
  - `DocumentDetector`: Rilevamento documenti
  - `ImageProcessor`: Rotazione e ottimizzazione
  - `CanvasManager`: Gestione canvas A4
  - `Exporter`: Export multi-formato

## Formato Versioni

Il numero di versione segue il formato MAJOR.MINOR.PATCH:

- **MAJOR**: Modifiche incompatibili con versioni precedenti
- **MINOR**: Nuove funzionalità compatibili con versioni precedenti
- **PATCH**: Bug fix compatibili con versioni precedenti

### Categorie di Modifiche

- **Added**: Nuove funzionalità
- **Changed**: Modifiche a funzionalità esistenti
- **Deprecated**: Funzionalità che verranno rimosse
- **Removed**: Funzionalità rimosse
- **Fixed**: Bug fix
- **Security**: Correzioni di sicurezza
