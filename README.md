# Fractal Explorer

An interactive web app for exploring the Mandelbrot set and Julia sets, rendered in real-time using WebGL shaders.

## The Mandelbrot Set

The Mandelbrot set is the set of complex numbers **c** for which the sequence defined by:

```
z₀ = 0
z_{n+1} = zₙ² + c
```

**does not diverge** (i.e., |zₙ| remains bounded as n → ∞).

For each pixel on screen, we map its (x, y) position to a complex number **c = x + yi** and iterate the formula above. If |z| exceeds 2 (the escape radius), the point is **outside** the set — it will inevitably diverge to infinity. If it survives all iterations without escaping, we color it black — it's (likely) **inside** the set.

The boundary of the Mandelbrot set is where things get interesting. It's an infinitely complex fractal: no matter how far you zoom in, you'll find intricate structures, miniature copies of the full set, and spiraling tendrils that never repeat.

## Julia Sets

Julia sets use the same iteration formula **z = z² + c**, but with a twist:

- In the **Mandelbrot set**, each pixel is a different **c**, and z always starts at 0.
- In a **Julia set**, **c is fixed**, and each pixel represents a different starting **z₀**.

Every point in the complex plane has a corresponding Julia set. The Mandelbrot set acts as a "map" of all Julia sets:

- If **c** is **inside** the Mandelbrot set → the Julia set is **connected** (a single piece)
- If **c** is **outside** the Mandelbrot set → the Julia set is **disconnected** (Cantor dust)
- Points **near the boundary** produce the most visually intricate Julia sets

In this app, click "Pick Julia c" while viewing the Mandelbrot set, then click any point to see its corresponding Julia set.

## How Coloring Works

### The Problem with Naive Coloring

The simplest approach is to color each pixel based on its **escape iteration** — the number of steps before |z| > 2. This produces visible "bands" of solid color, which looks unnatural.

### Smooth Iteration Count

We use the **normalized iteration count** to eliminate banding:

```
smoothColor = n - log₂(log₂(|z|))
```

Where **n** is the escape iteration and **|z|** is the magnitude of z at the moment of escape. This gives a continuous (non-integer) value that transitions smoothly between iterations.

We use a bailout radius of 16 (rather than 2) to give the logarithms room to produce smoother gradients.

### Cosine Color Palettes

The smooth value is mapped to a color using the **Inigo Quilez cosine palette** formula:

```
color(t) = a + b · cos(2π(c · t + d))
```

Where **a**, **b**, **c**, **d** are RGB vectors that define the palette character. This is computed entirely on the GPU and produces beautiful, infinitely smooth gradients. The app includes four palettes:

| Palette | Description |
|---------|-------------|
| Classic | Blue-cyan-gold tones |
| Fire | Black through red-orange to yellow |
| Ice | Deep blue through cyan to white |
| Psychedelic | High-frequency multi-hue cycling |

## Controls

| Action | Effect |
|--------|--------|
| **Mouse wheel** | Zoom in/out (centered on cursor) |
| **Click + drag** | Pan the view |
| **Mandelbrot / Julia** button | Toggle between fractal types |
| **Pick Julia c** | Click a point on the Mandelbrot set to see its Julia set |
| **Iterations slider** | Adjust max iteration depth (64–2048) |
| **Palette button** | Cycle through color schemes |
| **Reset** | Return to the default view |

## Running Locally

This is a static site with no build step. You just need a local HTTP server (shader files are loaded via `fetch`, which requires a server — opening `index.html` directly from the filesystem won't work).

```bash
# Option 1: Python
python -m http.server 8000

# Option 2: Node.js
npx serve

# Option 3: PHP
php -S localhost:8000
```

Then open [http://localhost:8000](http://localhost:8000).

## Technical Details

- **Rendering**: WebGL 1.0 fragment shader — all fractal math runs on the GPU
- **Precision**: Float32 (WebGL native). Accurate to roughly 10¹²× zoom before precision artifacts appear
- **Dependencies**: None. Vanilla HTML/CSS/JS
- **Browser support**: Any browser with WebGL (all modern browsers)
