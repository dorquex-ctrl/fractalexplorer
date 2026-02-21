import { initRenderer } from './renderer.js';
import { initInteraction } from './interaction.js';

const PALETTE_NAMES = ['Classic', 'Fire', 'Ice', 'Psychedelic'];
const DEFAULT_ZOOM = 3.5;

function computeAutoIter(zoom) {
    const zoomLevel = Math.max(1, DEFAULT_ZOOM / zoom);
    return Math.min(2048, Math.max(128, Math.floor(200 + 50 * Math.log2(zoomLevel))));
}

function zoomSpeedToFactor(sliderValue) {
    return 1.0 + sliderValue * 0.05;
}

async function main() {
    const canvas = document.getElementById('fractal-canvas');
    const renderer = await initRenderer(canvas);

    let mode = 0;
    let maxIter = 256;
    let colorScheme = 0;
    let autoIter = true;
    let juliaC = { x: -0.7, y: 0.27015 };

    const btnMode = document.getElementById('btn-mode');
    const btnJuliaPick = document.getElementById('btn-julia-pick');
    const btnColor = document.getElementById('btn-color');
    const btnReset = document.getElementById('btn-reset');
    const btnAutoIter = document.getElementById('btn-auto-iter');
    const sliderIter = document.getElementById('slider-iter');
    const sliderZoomSpeed = document.getElementById('slider-zoom-speed');
    const iterValue = document.getElementById('iter-value');
    const infoCoords = document.getElementById('info-coords');
    const infoZoom = document.getElementById('info-zoom');
    const infoPrecision = document.getElementById('info-precision');
    const infoJulia = document.getElementById('info-julia');

    const interaction = initInteraction(canvas, (cx, cy) => {
        juliaC = { x: cx, y: cy };
        mode = 1;
        renderer.setMode(1);
        renderer.setJuliaC(cx, cy);
        interaction.resetToOrigin();
        updateModeUI();
    });

    function updateModeUI() {
        btnMode.textContent = mode === 0 ? 'Mandelbrot' : 'Julia';
        btnJuliaPick.classList.toggle('active', interaction.isPickMode());
        btnJuliaPick.disabled = mode === 1;
        infoJulia.hidden = mode === 0;
        if (mode === 1) {
            infoJulia.textContent = `Julia c: ${juliaC.x.toFixed(4)} ${juliaC.y >= 0 ? '+' : '-'} ${Math.abs(juliaC.y).toFixed(4)}i`;
        }
    }

    function updateAutoIterUI() {
        btnAutoIter.classList.toggle('active', autoIter);
        sliderIter.disabled = autoIter;
        sliderIter.style.opacity = autoIter ? '0.4' : '1';
    }

    btnMode.addEventListener('click', () => {
        mode = mode === 0 ? 1 : 0;
        renderer.setMode(mode);
        if (mode === 0) {
            interaction.reset();
        } else {
            renderer.setJuliaC(juliaC.x, juliaC.y);
            interaction.resetToOrigin();
        }
        interaction.setJuliaPickMode(false);
        updateModeUI();
    });

    btnJuliaPick.addEventListener('click', () => {
        if (mode === 1) return;
        const on = !interaction.isPickMode();
        interaction.setJuliaPickMode(on);
        btnJuliaPick.classList.toggle('active', on);
    });

    sliderIter.addEventListener('input', () => {
        autoIter = false;
        maxIter = parseInt(sliderIter.value, 10);
        iterValue.textContent = maxIter;
        renderer.setMaxIter(maxIter);
        updateAutoIterUI();
    });

    btnAutoIter.addEventListener('click', () => {
        autoIter = !autoIter;
        updateAutoIterUI();
    });

    sliderZoomSpeed.addEventListener('input', () => {
        interaction.setZoomSpeed(zoomSpeedToFactor(parseInt(sliderZoomSpeed.value, 10)));
    });
    interaction.setZoomSpeed(zoomSpeedToFactor(parseInt(sliderZoomSpeed.value, 10)));

    btnColor.addEventListener('click', () => {
        colorScheme = (colorScheme + 1) % PALETTE_NAMES.length;
        renderer.setColorScheme(colorScheme);
        btnColor.textContent = 'Palette: ' + PALETTE_NAMES[colorScheme];
    });

    btnReset.addEventListener('click', () => {
        mode = 0;
        maxIter = 256;
        colorScheme = 0;
        autoIter = true;
        renderer.setMode(0);
        renderer.setMaxIter(256);
        renderer.setColorScheme(0);
        sliderIter.value = 256;
        iterValue.textContent = '256';
        btnColor.textContent = 'Palette: Classic';
        sliderZoomSpeed.value = 3;
        interaction.setZoomSpeed(zoomSpeedToFactor(3));
        interaction.reset();
        interaction.setJuliaPickMode(false);
        updateModeUI();
        updateAutoIterUI();
    });

    function updateInfoDisplay() {
        const c = interaction.getCenter();
        const z = interaction.getZoom();
        const zoomLevel = DEFAULT_ZOOM / z;
        infoCoords.textContent = `Center: ${c.x.toFixed(4)} ${c.y >= 0 ? '+' : '-'} ${Math.abs(c.y).toFixed(4)}i`;
        infoZoom.textContent = `Zoom: ${zoomLevel.toExponential(1)}x`;
        infoPrecision.textContent = renderer.isUsingDS() ? 'DS' : 'SP';
    }

    function frame() {
        interaction.updateAnimation();

        if (autoIter) {
            const iter = computeAutoIter(interaction.getZoom());
            if (iter !== maxIter) {
                maxIter = iter;
                renderer.setMaxIter(maxIter);
                sliderIter.value = Math.min(2048, maxIter);
                iterValue.textContent = maxIter;
            }
        }

        const c = interaction.getCenter();
        renderer.setCenter(c.x, c.y);
        renderer.setZoom(interaction.getZoom());
        renderer.render();
        updateInfoDisplay();
        requestAnimationFrame(frame);
    }

    window.addEventListener('resize', () => renderer.resize());
    renderer.resize();
    updateModeUI();
    updateAutoIterUI();
    requestAnimationFrame(frame);
}

main().catch(err => {
    document.body.innerHTML = `<div style="color:#f44;padding:2em;font-family:monospace"><h2>Failed to initialize Fractal Explorer</h2><pre>${err.message}</pre></div>`;
});
