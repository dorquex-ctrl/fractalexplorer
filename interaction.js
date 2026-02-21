const DEFAULT_CENTER = { x: -0.5, y: 0.0 };
const DEFAULT_ZOOM = 3.5;
const LERP_SPEED = 0.15;

export function initInteraction(canvas, onJuliaPick) {
    let centerX = DEFAULT_CENTER.x;
    let centerY = DEFAULT_CENTER.y;
    let zoom = DEFAULT_ZOOM;
    let targetCenterX = centerX;
    let targetCenterY = centerY;
    let targetZoom = zoom;

    let zoomFactor = 1.15;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let juliaPickMode = false;

    function screenToComplex(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const ux = (clientX - rect.left) / rect.width;
        const uy = 1.0 - (clientY - rect.top) / rect.height;
        const aspect = canvas.width / canvas.height;
        return {
            x: (ux - 0.5) * zoom * aspect + centerX,
            y: (uy - 0.5) * zoom + centerY,
        };
    }

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const ux = (e.clientX - rect.left) / rect.width;
        const uy = 1.0 - (e.clientY - rect.top) / rect.height;
        const aspect = canvas.width / canvas.height;

        const cursorX = (ux - 0.5) * zoom * aspect + centerX;
        const cursorY = (uy - 0.5) * zoom + centerY;

        const factor = e.deltaY > 0 ? zoomFactor : 1 / zoomFactor;
        targetZoom = zoom * factor;

        targetCenterX = cursorX - (ux - 0.5) * targetZoom * aspect;
        targetCenterY = cursorY - (uy - 0.5) * targetZoom;
    }, { passive: false });

    canvas.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;

        if (juliaPickMode) {
            const c = screenToComplex(e.clientX, e.clientY);
            onJuliaPick(c.x, c.y);
            juliaPickMode = false;
            document.body.classList.remove('picking');
            return;
        }

        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;
        const aspect = canvas.width / canvas.height;

        centerX -= (dx / canvas.clientWidth) * zoom * aspect;
        centerY += (dy / canvas.clientHeight) * zoom;
        targetCenterX = centerX;
        targetCenterY = centerY;

        dragStartX = e.clientX;
        dragStartY = e.clientY;
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    function updateAnimation() {
        centerX += (targetCenterX - centerX) * LERP_SPEED;
        centerY += (targetCenterY - centerY) * LERP_SPEED;
        zoom += (targetZoom - zoom) * LERP_SPEED;
    }

    function reset() {
        centerX = DEFAULT_CENTER.x;
        centerY = DEFAULT_CENTER.y;
        zoom = DEFAULT_ZOOM;
        targetCenterX = centerX;
        targetCenterY = centerY;
        targetZoom = zoom;
    }

    function resetToOrigin() {
        centerX = 0;
        centerY = 0;
        zoom = DEFAULT_ZOOM;
        targetCenterX = 0;
        targetCenterY = 0;
        targetZoom = zoom;
    }

    function setJuliaPickMode(on) {
        juliaPickMode = on;
        document.body.classList.toggle('picking', on);
    }

    function setZoomSpeed(factor) {
        zoomFactor = factor;
    }

    return {
        updateAnimation,
        getCenter() { return { x: centerX, y: centerY }; },
        getZoom() { return zoom; },
        reset,
        resetToOrigin,
        setJuliaPickMode,
        isPickMode() { return juliaPickMode; },
        setZoomSpeed,
    };
}
