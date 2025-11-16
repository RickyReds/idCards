# 🔬 Istruzioni Debug Trim Whitespace

## Scopo

Questo tool permette di testare e ottimizzare i parametri di trim per rimuovere lo spazio bianco attorno ai documenti (fronte e retro).

## Come usare

### 1. Avvia il server locale

```bash
cd /home/user/idCards
python3 -m http.server 8080
```

### 2. Apri il browser

Vai a: `http://localhost:8080/debug-trim.html`

### 3. Carica un'immagine

- Click sull'area di upload OPPURE
- Trascina un file con fronte e retro

### 4. Prova i preset

Il tool include 4 preset predefiniti:

| Preset | White Threshold | Min Pixels % | Margin | Uso |
|--------|----------------|--------------|--------|-----|
| **Corrente** | 252 | 1% | 1px | Parametri attuali del sistema |
| **Aggressivo** | 245 | 0.5% | 0px | Trim molto forte, rimuove anche grigio chiaro |
| **Moderato** | 248 | 1% | 2px | Bilanciato, con margine extra |
| **Gentile** | 250 | 2% | 3px | Trim leggero, preserva più bordo |

### 5. Regola manualmente

Usa gli slider per trovare i parametri perfetti:

- **White Threshold (240-255)**: Soglia di luminosità per considerare un pixel "bianco"
  - Più alto = solo bianco puro
  - Più basso = anche grigio chiaro viene rimosso

- **Min Pixels % (0-10%)**: Percentuale minima di pixel non-bianchi per considerare una riga/colonna come "contenuto"
  - Più alto = trim più conservativo
  - Più basso = trim più aggressivo

- **Margin (0-10px)**: Margine di sicurezza da aggiungere dopo il trim
  - 0px = nessun margine
  - Più alto = preserva più bordo

### 6. Verifica i risultati

Il tool mostra side-by-side:
- **FRONTE**: immagine originale e dopo trim
- **RETRO**: immagine originale e dopo trim

Per ogni documento vedi:
- Dimensioni originali
- Dimensioni dopo trim
- Quanti pixel rimossi per lato (Top, Bottom, Left, Right)
- Aspect ratio

### 7. Obiettivo

Trova i parametri che fanno sì che **fronte e retro abbiano dimensioni simili**.

Esempio ideale:
```
FRONTE: 2465 × 655 px (aspect ratio: 3.763)
RETRO:  2465 × 655 px (aspect ratio: 3.763)
```

### 8. Applica i parametri

Una volta trovati i parametri perfetti:

1. Annota i valori ottimali
2. Comunicali per applicarli a `js/documentDetector.js`
3. I parametri verranno aggiornati nel metodo `trimWhitespace()`

## Parametri attuali nel sistema

File: `js/documentDetector.js`, metodo `trimWhitespace()` (linea ~334):

```javascript
const whiteThreshold = 252;         // Linea 334
const minPixelsThreshold = 0.01;    // Linea 350 (1%)
const margin = 1;                   // Linea 389
```

## Troubleshooting

### Il fronte è più grande del retro
→ Prova preset "Aggressivo" o riduci White Threshold

### Il fronte è troppo piccolo
→ Prova preset "Gentile" o aumenta White Threshold

### Vengono tagliati pezzi del documento
→ Aumenta Margin e/o Min Pixels %

### Rimane troppo spazio bianco
→ Riduci Margin e/o riduci White Threshold

## Note tecniche

### Come funziona il trim

1. L'immagine viene analizzata pixel per pixel
2. Per ogni riga, conta i pixel con luminosità < White Threshold
3. Se una riga ha più di Min Pixels % di pixel non-bianchi, è considerata "contenuto"
4. Trova la prima e ultima riga/colonna con contenuto
5. Aggiunge Margin di sicurezza
6. Croppa l'immagine ai bounds trovati

### Differenze fronte/retro

Se fronte e retro hanno dimensioni molto diverse dopo il trim, significa che uno dei due ha:
- Più spazio bianco attorno
- Ombre o sfumature diverse
- Background leggermente colorato
- Bordi più o meno definiti

I parametri devono essere scelti per gestire il caso peggiore (quello con più variabilità).

## Esempi di configurazione

### Se il retro è perfetto ma il fronte è troppo grande
```
Problema: Il fronte include troppe ombre/grigio chiaro
Soluzione: Riduci White Threshold da 252 a 245-248
```

### Se entrambi sono OK ma con margini extra
```
Problema: C'è spazio bianco residuo
Soluzione: Riduci Min Pixels % da 1% a 0.5%
```

### Se vengono tagliati i bordi
```
Problema: Il trim è troppo aggressivo
Soluzione: Aumenta Margin da 1px a 2-3px
```
