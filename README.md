# Fractal Explorer

An interactive explorer for the Mandelbrot set and Julia sets, rendered in real-time using WebGL shaders.

## The Mandelbrot Set

The Mandelbrot set is the set of complex numbers **c** for which the sequence defined by:

```
z₀ = 0
z_{n+1} = zₙ² + c
```

**does not diverge** (i.e., |zₙ| remains bounded as n approaches infinity).

For each pixel on screen, we map its (x, y) position to a complex number **c = x + yi** and iterate the formula. If |z| exceeds 2 (the escape radius), the point is **outside** the set and will diverge to infinity. If it survives all iterations without escaping, we color it black, meaning it is (likely) **inside** the set.

The boundary is where things get interesting. It is an infinitely complex fractal: no matter how far you zoom in, you will find intricate structures, miniature copies of the full set, and spiraling tendrils that never repeat.

## Julia Sets

Julia sets use the same iteration formula **z = z² + c**, but with one key difference:

- In the **Mandelbrot set**, each pixel is a different **c**, and z always starts at 0.
- In a **Julia set**, **c is fixed**, and each pixel represents a different starting **z₀**.

Every point in the complex plane has a corresponding Julia set, and the Mandelbrot set acts as a kind of map of all of them:

- If **c** is **inside** the Mandelbrot set, the Julia set is **connected** (one piece)
- If **c** is **outside** the Mandelbrot set, the Julia set is **disconnected** (Cantor dust)
- Points **near the boundary** tend to produce the most intricate Julia sets

To try it, click "Pick Julia c" while viewing the Mandelbrot set, then click any point to see its Julia set.

## How Coloring Works

### The Problem with Naive Coloring

The simplest approach is to color each pixel based on its **escape iteration**, which is the number of steps before |z| > 2. This produces visible bands of solid color that look pretty unnatural.

### Smooth Iteration Count

To fix this, we use the **normalized iteration count**:

```
smoothColor = n - log₂(log₂(|z|))
```

Here **n** is the escape iteration and **|z|** is the magnitude of z at the moment of escape. This produces a continuous, non-integer value that transitions smoothly between iteration bands.

We use a bailout radius of 16 rather than 2 to give the logarithms room to produce smoother gradients.

### Cosine Color Palettes

The smooth value gets mapped to a color using the **Inigo Quilez cosine palette** formula:

```
color(t) = a + b · cos(2π(c · t + d))
```

Here **a**, **b**, **c**, and **d** are RGB vectors that define the character of the palette. It runs entirely on the GPU and produces smooth, continuous gradients. There are four palettes to choose from:

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
| **Iterations slider** | Adjust max iteration depth (64-2048) |
| **Auto button** | Auto-scale iterations based on zoom depth |
| **Zoom Speed slider** | Control how fast each scroll tick zooms (1 = fine, 10 = fast) |
| **Palette button** | Cycle through color schemes |
| **Reset** | Return to the default view |

## Running Locally

There is no build step. You just need a local HTTP server, since the shader files are loaded via `fetch` and that does not work when opening `index.html` directly from the filesystem.

```bash
# Python
python -m http.server 8000

# Node.js
npx serve

# PHP
php -S localhost:8000
```

Then open [http://localhost:8000](http://localhost:8000).

## Technical Details

- **Rendering**: WebGL 1.0 fragment shader, all fractal math runs on the GPU
- **Precision**: Automatically switches between single-precision (fast) and double-single emulation (~10^13x zoom) based on zoom depth
- **Dependencies**: None, vanilla HTML/CSS/JS
- **Browser support**: Any browser with WebGL support (all modern browsers)
