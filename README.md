# Fractal Explorer

An interactive explorer for the Mandelbrot set and Julia sets, rendered in real-time using WebGL shaders.

## The Mandelbrot Set

The Mandelbrot set is the set of complex numbers **c** for which the sequence:

```
z₀ = 0
zₙ₊₁ = zₙ² + c
```

does not diverge (i.e., |zₙ| stays bounded as n grows).

For each pixel, we map its (x, y) position to a complex number **c = x + yi** and run the iteration. If |z| exceeds 2, the point escapes to infinity and is colored based on how quickly it left. If it never escapes within the iteration limit, it gets colored black and is considered inside the set.

The boundary is where things get interesting. It is infinitely complex: no matter how deep you zoom, you will find new structures, miniature copies of the full set, and spiraling tendrils that never repeat.

## Julia Sets

Julia sets use the same formula, but with one key difference:

- In the **Mandelbrot set**, each pixel is a different **c**, and z starts at 0.
- In a **Julia set**, **c is fixed**, and each pixel is a different starting **z₀**.

Every point c has a corresponding Julia set, and the Mandelbrot set acts as a map of all of them:

- **c inside** the Mandelbrot set → Julia set is connected (one piece)
- **c outside** the Mandelbrot set → Julia set is disconnected (Cantor dust)
- Points near the boundary produce the most intricate Julia sets

To try it, click "Pick Julia c" while viewing the Mandelbrot set, then click any point.

## How Coloring Works

Coloring each pixel by raw escape iteration produces ugly solid bands. Instead, we use the **normalized iteration count**:

```
smoothColor = n - log₂(log₂(|z|))
```

This gives a continuous, non-integer value that transitions smoothly across bands. We also use a bailout radius of 16 rather than 2, which gives the logarithms more room to work with.

The smooth value is then mapped to a color using the **Inigo Quilez cosine palette** formula:

```
color(t) = a + b * cos(2π(c * t + d))
```

where **a**, **b**, **c**, and **d** are RGB vectors that shape the palette. Everything runs on the GPU. There are four palettes to choose from:

| Palette | Description |
|---------|-------------|
| Classic | Blue, cyan, and gold tones |
| Fire | Black through red-orange to yellow |
| Ice | Deep blue through cyan to white |
| Psychedelic | High-frequency multi-hue cycling |

## Controls

| Action | Effect |
|--------|--------|
| **Mouse wheel** | Zoom in/out, centered on cursor |
| **Click + drag** | Pan the view |
| **Mandelbrot / Julia** | Toggle between fractal types |
| **Pick Julia c** | Click a point on the Mandelbrot set to load its Julia set |
| **Iterations slider** | Set the max iteration depth (64-2048) |
| **Auto** | Auto-scale iterations as you zoom deeper |
| **Zoom Speed** | Controls how much each scroll tick zooms (1 = fine, 10 = fast) |
| **Palette** | Cycle through color schemes |
| **Reset** | Return to the default view |

## Running Locally

No build step needed. You do need a local HTTP server though, since the shader files are fetched at runtime and browsers block that on the `file://` protocol.

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
- **Precision**: Auto-switches between single-precision (fast) and double-single emulation (good to ~10¹³x zoom) based on zoom depth
- **Dependencies**: None, vanilla HTML/CSS/JS
- **Browser support**: Any browser with WebGL (all modern browsers)
