# Changelog

Tutte le modifiche significative a questo progetto verranno documentate in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.0.0/),
e questo progetto aderisce a [Semantic Versioning](https://semver.org/lang/it/).

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
