# ID Cards Composer

**Applicazione web per comporre documenti di identità (fronte/retro) su formato A4**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

## Descrizione

ID Cards Composer è un'applicazione web offline che permette di:
- Caricare immagini di documenti di identità (PNG, JPG)
- Rilevare e croppare automaticamente i documenti presenti nelle immagini
- Allineare automaticamente i documenti ruotandoli per renderli orizzontali
- Comporre fronte e retro su un documento A4
- Esportare il risultato in PDF, PNG o JPG

## Caratteristiche

✨ **Rilevamento Automatico**: L'app rileva automaticamente i documenti nelle immagini caricate utilizzando algoritmi di edge detection

🔄 **Auto-Allineamento**: Corregge automaticamente la rotazione dei documenti per renderli perfettamente orizzontali

📄 **Canvas A4**: Area di lavoro in formato A4 (210x297mm a 300 DPI) per comporre i documenti

🎨 **Drag & Drop**: Interfaccia intuitiva per trascinare i documenti sul canvas

📐 **Layout Predefiniti**: Template pronti per disporre i documenti (verticale/orizzontale)

💾 **Export Multi-formato**: Esporta in PDF, PNG o JPG ad alta qualità

🌐 **Offline-Ready**: Funziona completamente offline dopo il primo caricamento

## Requisiti

- Browser moderno (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Nessuna installazione richiesta

## Installazione

### Opzione 1: Server HTTP semplice (Python)

```bash
# Clona il repository
git clone https://github.com/RickyReds/idCards.git
cd idCards

# Avvia server locale
python3 -m http.server 8000

# Apri browser all'indirizzo
# http://localhost:8000
```

### Opzione 2: Apertura diretta

Apri semplicemente il file `index.html` nel tuo browser.

**Nota**: Alcune funzionalità potrebbero richiedere un server HTTP per motivi di sicurezza (CORS).

## Utilizzo

### 1. Carica Documenti

Ci sono due modi per caricare i documenti:

- **Drag & Drop**: Trascina i file PNG/JPG nell'area di caricamento
- **Click**: Clicca sull'area di caricamento per selezionare i file

L'app supporta:
- File singoli o multipli
- Immagini con 1 o 2 documenti per file
- Documenti su sfondo contrastato

### 2. Documenti Rilevati

Dopo il caricamento, i documenti vengono:
1. **Rilevati automaticamente** usando edge detection
2. **Croppati** per isolare ogni documento
3. **Allineati** correggendo la rotazione
4. **Visualizzati** nella griglia "Documenti Rilevati"

Se il rilevamento automatico non funziona, l'app divide l'immagine in 2 parti uguali come fallback.

### 3. Componi su A4

Aggiungi i documenti al canvas A4:

- **Click**: Clicca su un documento nella griglia per aggiungerlo al centro del canvas
- **Drag & Drop**: Trascina un documento direttamente sul canvas nella posizione desiderata

Una volta sul canvas puoi:
- **Spostare**: Trascina con il mouse
- **Selezionare**: Clicca sul documento
- **Eliminare**: Premi `Delete` o `Backspace` sul documento selezionato
- **Muovere con precisione**: Usa le frecce direzionali (tieni `Shift` per movimenti più veloci)

### 4. Layout Rapidi

Usa i pulsanti template per disporre automaticamente i documenti:

- **Verticale**: Fronte sopra, retro sotto
- **Orizzontale**: Fronte e retro affiancati
- **Pulisci**: Rimuove tutti i documenti dal canvas

### 5. Esporta

1. Scegli il formato di export (PDF, PNG, JPG)
2. Clicca su "Scarica Documento"
3. Il file verrà scaricato automaticamente

**Formati disponibili:**
- **PDF**: Ideale per stampa, mantiene il formato A4 esatto
- **PNG**: Alta qualità senza compressione, file più grande
- **JPG**: Buona qualità con compressione, file più piccolo

## Struttura del Progetto

```
idCards/
├── index.html              # Pagina principale
├── css/
│   └── styles.css          # Stili dell'applicazione
├── js/
│   ├── main.js             # Logica principale e coordinamento
│   ├── documentDetector.js # Rilevamento e crop documenti
│   ├── imageProcessor.js   # Processing immagini (rotazione, enhance)
│   ├── canvasManager.js    # Gestione canvas A4 e drag-drop
│   └── exporter.js         # Export PDF/PNG/JPG
├── LICENSE                 # Licenza MIT
├── README.md               # Questo file
├── CLAUDE.md               # Guida per AI assistants
└── package.json            # Configurazione progetto
```

## Tecnologie Utilizzate

- **Vanilla JavaScript**: Nessun framework, massima compatibilità
- **Canvas API**: Rendering e manipolazione immagini
- **jsPDF**: Generazione PDF
- **HTML5 Drag & Drop API**: Interfaccia drag-and-drop
- **CSS Grid & Flexbox**: Layout responsive

## Algoritmi Implementati

### Rilevamento Documenti

1. **Edge Detection**: Algoritmo Sobel semplificato per rilevare i bordi
2. **Contour Tracing**: Tracciamento dei contorni nell'immagine
3. **Bounding Box Extraction**: Estrazione delle aree rettangolari
4. **Filtering**: Filtraggio delle aree in base a dimensioni (5%-90% dell'immagine)

### Auto-Allineamento

1. **Horizontal Edge Detection**: Rilevamento linee orizzontali predominanti
2. **Angle Calculation**: Calcolo dell'angolo di rotazione necessario
3. **Rotation**: Rotazione del canvas con interpolazione bilineare

### Image Enhancement

- Aumento del contrasto (10%)
- Miglioramento della nitidezza
- Normalizzazione dei livelli

## Limitazioni

- **File PDF**: Non ancora supportati direttamente (usa conversione in PNG/JPG)
- **Massimo 2 documenti per immagine**: Ottimizzato per rilevare al massimo 2 documenti
- **Sfondo contrastato**: I documenti devono essere su sfondo che contrasta con il documento stesso
- **Formati supportati**: Solo PNG e JPG in input

## Risoluzione Problemi

### I documenti non vengono rilevati

- Assicurati che i documenti siano su sfondo contrastato (chiaro su scuro o viceversa)
- L'immagine deve essere di buona qualità
- I documenti devono occupare almeno il 5% dell'immagine
- Se il rilevamento fallisce, l'app divide automaticamente l'immagine a metà

### L'allineamento non è perfetto

- L'algoritmo di allineamento funziona meglio con documenti che hanno bordi netti
- Se necessario, usa gli strumenti di movimento (frecce direzionali) per aggiustamenti manuali
- L'angolo di correzione è limitato a ±15 gradi per sicurezza

### Il file esportato è troppo grande

- Usa formato JPG invece di PNG per file più piccoli
- La dimensione è proporzionale al formato A4 a 300 DPI (alta qualità per stampa)

### Browser non supportato

- Aggiorna il browser all'ultima versione
- Usa Chrome, Firefox, Safari o Edge recenti

## Sviluppo Futuro

Possibili miglioramenti:

- [ ] Supporto PDF in input (usando PDF.js)
- [ ] Riconoscimento OCR per validazione documenti
- [ ] Rilevamento automatico fronte/retro
- [ ] Supporto per più di 2 documenti per pagina
- [ ] Watermarking e annotazioni
- [ ] Salvataggio progetti in locale (LocalStorage)
- [ ] PWA (Progressive Web App) per installazione
- [ ] Batch processing di multiple immagini

## Contribuire

Contributi sono benvenuti! Per favore:

1. Fai fork del repository
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push sul branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi il file [LICENSE](LICENSE) per dettagli.

## Autore

**RickyReds**

## Supporto

Per bug, richieste di funzionalità o domande, apri una issue su GitHub:
https://github.com/RickyReds/idCards/issues

---

**Nota sulla Privacy**: Questa applicazione funziona completamente lato client. Nessuna immagine o dato viene inviato a server esterni. Tutte le elaborazioni avvengono nel tuo browser.
