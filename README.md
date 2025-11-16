# 🪪 ID Card Processor

Applicazione web per rilevare, raddrizzare e ottimizzare automaticamente immagini di carte d'identità e documenti.

## ✨ Caratteristiche

### 🔍 Rilevamento Documenti Robusto
- **Projection Profile Analysis**: Analizza le proiezioni di luminosità per identificare gap tra documenti
- **Validazione Aspect Ratio**: Verifica che i documenti abbiano proporzioni simili a una carta di credito (~1.586)
- **Soglie Adattive**: Previene falsi positivi ignorando gap troppo piccoli
- **Dimensioni Minime**: Filtra automaticamente frammenti e rumore

### 🔄 Auto-Rotazione Intelligente
- **Edge Detection con Sobel**: Rileva i bordi del documento
- **Regressione Lineare**: Calcola l'angolo dai bordi superiori, inferiori e laterali
- **Angolo Mediano**: Usa la mediana invece della media per robustezza contro outlier
- **Rotazione Effettiva**: Applica la rotazione con antialiasing e crop automatico

### ✨ Ottimizzazione Immagine
- Contrasto: +20%
- Luminosità: +8%
- Crop automatico spazi bianchi

## 🚀 Come Usare

1. Apri `index.html` nel browser
2. Trascina una o più immagini nella drop zone (o clicca per selezionare)
3. L'applicazione processa automaticamente ogni immagine:
   - Rileva documenti multipli se presenti
   - Raddrizza ogni documento
   - Ottimizza la qualità
4. Scarica o copia i risultati

## 📌 Versioning

**Versione Corrente: 1.3.3** (2024-11-16)

La versione è visibile nel footer dell'applicazione web. Ogni versione segue il formato [Semantic Versioning](https://semver.org/lang/it/) (MAJOR.MINOR.PATCH).

### Come Verificare la Versione
- Apri l'applicazione web: la versione è mostrata nel footer in basso
- Console del browser: apparirà "✅ ID Cards Composer vX.X.X inizializzata correttamente"
- File `js/main.js`: costante `APP_VERSION`

### Cronologia Versioni
Vedi [CHANGELOG.md](CHANGELOG.md) per la cronologia completa delle modifiche.

**Ultimi aggiornamenti:**
- **v1.3.3**: Trim ancora più aggressivo + riutilizzo documenti dopo cancellazione
- **v1.3.2**: Trim whitespace più aggressivo + sistema single-use per documenti
- **v1.3.1**: Soglie rotazione e rilevamento documenti migliorate, trim whitespace più accurato
- **v1.3.0**: Fix rotazione non necessaria su documenti già orientati correttamente + sistema versioning
- **v1.2.0**: Edge detection migliorato con analisi multi-bordo e mediana
- **v1.1.0**: Gap detection più robusto con validazione aspect ratio
- **v1.0.0**: Release iniziale con rilevamento, rotazione ed export

## 🛠️ Architettura

```
idCards/
├── index.html              # UI principale
├── css/
│   └── style.css          # Styling
├── js/
│   ├── documentDetector.js # Algoritmi rilevamento documenti
│   ├── imageProcessor.js   # Rotazione e ottimizzazione
│   └── main.js            # Orchestrazione e UI
└── README.md
```

### DocumentDetector

Rileva documenti in un'immagine usando:
- Proiezioni di luminosità (orizzontale e verticale)
- Rilevamento gap con soglie adattive
- Validazione aspect ratio e dimensioni

**Parametri Chiave:**
- `CARD_ASPECT_RATIO`: 1.586 (carta di credito standard)
- `ASPECT_RATIO_TOLERANCE`: 0.4 (±40%)
- `MIN_CARD_WIDTH`: 200px
- `MIN_CARD_HEIGHT`: 120px
- `GAP_MIN_SIZE_PERCENT`: 0.08 (gap minimo 8% della dimensione)

### ImageProcessor

Processa ogni documento rilevato:
1. **Estrazione**: Ritaglia il documento dall'immagine originale
2. **Auto-Allineamento**:
   - Edge detection con Sobel operator
   - Analisi bordi superiori, inferiori, laterali
   - Calcolo angolo con regressione lineare
   - Rotazione con limitazione a ±15°
3. **Ottimizzazione**: Contrasto, luminosità, nitidezza

**Algoritmo Rotazione:**
```
1. Rileva bordi con Sobel
2. Identifica bordi top/bottom/left/right
3. Calcola angolo per ogni bordo (regressione lineare)
4. Usa angolo mediano (robusto contro outlier)
5. Limita a ±15°
6. Ruota e crop automatico
```

## 🐛 Debug

Apri la Console (F12) per vedere log dettagliati:
- Numero di documenti rilevati
- Gap trovati e loro dimensioni
- Angoli rilevati per ogni bordo
- Angolo mediano e rotazione applicata
- Dimensioni finali documenti

Esempio log:
```
🔍 Avvio rilevamento documenti...
📊 Gap orizzontali trovati: 0
📊 Gap verticali trovati: 0
📄 Documento singolo rilevato: {x: 12, y: 0, width: 1021, height: 658}
✅ Documento valido: 1021x658, aspect ratio: 1.55

🔍 Inizio rilevamento rotazione...
📐 Angoli rilevati: -2.34, -2.18, -2.45, -2.29
📐 Angolo mediano: -2.31°
🔄 Rotazione di -2.31°
✅ Ottimizzazione completata
```

## 🔧 Problemi Risolti

### ❌ Problema: Documento singolo diviso erroneamente
**Causa**: Gap detection troppo sensibile
**Soluzione**:
- Soglia minima gap aumentata all'8% della dimensione
- Validazione aspect ratio (scarta rettangoli con proporzioni sbagliate)
- Validazione area minima (5% dell'immagine)

### ❌ Problema: Angoli calcolati ma rotazione non applicata
**Causa**: Canvas non veniva effettivamente ruotato
**Soluzione**:
- Metodo `rotateCanvas()` crea nuovo canvas ruotato
- `cropWhiteSpace()` rimuove margini bianchi extra
- Rotazione viene sempre applicata e restituita

### ❌ Problema: Angoli troppo variabili (-37° vs -10°)
**Causa**: Edge detection su singolo bordo instabile
**Soluzione**:
- Analizza 4 bordi (top, bottom, left, right)
- Usa regressione lineare per ogni bordo
- Calcola mediana invece di media (robusto contro outlier)

### ❌ Problema: Rotazione proposta per documenti già orientati correttamente
**Causa**: L'algoritmo `autoAlign()` proponeva di ruotare documenti già in formato landscape (orizzontale) con aspect ratio corretto
**Soluzione**:
- Verifica aspect ratio PRIMA di applicare rotazione
- Se documento è landscape (width > height) CON aspect ratio corretto (~1.586 ±50%) E angolo < 3°, NON ruota
- Previene rotazioni inutili su carte già orientate correttamente
- Log migliorato per mostrare aspect ratio e orientamento rilevato

## 📝 Note Tecniche

- **Aspect Ratio Carte**: Le carte d'identità standard hanno proporzioni simili alle carte di credito (85.60mm × 53.98mm = 1.586)
- **Tolleranza**: ±40% per accettare anche carte con proporzioni leggermente diverse
- **Dimensioni Minime**: 200×120px per evitare di rilevare rumore o frammenti
- **Gap Minimo**: 8% della dimensione immagine per evitare falsi positivi
- **Limitazione Rotazione**: ±15° per evitare correzioni eccessive su rilevamenti errati

## 🎯 Performance

- Processing client-side (nessun upload a server)
- Canvas API per manipolazione immagini
- Soglie ottimizzate per bilanciare accuratezza e velocità
- Campionamento edge detection (ogni 2 pixel) per performance

## 📜 Licenza

MIT License - vedi LICENSE file
