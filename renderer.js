const QUAD_VERTICES = new Float32Array([
    -1, -1,  1, -1,  -1, 1,
    -1,  1,  1, -1,   1, 1,
]);

const DS_ZOOM_THRESHOLD = 3.5e-4; // ~10,000x zoom triggers DS

function splitDouble(val) {
    const hi = Math.fround(val);
    const lo = Math.fround(val - hi);
    return [hi, lo];
}

function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error('Shader compile error: ' + info);
    }
    return shader;
}

function linkProgram(gl, vertShader, fragShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error('Program link error: ' + info);
    }
    return program;
}

function getUniformLocations(gl, program) {
    return {
        u_resolution: gl.getUniformLocation(program, 'u_resolution'),
        u_center_hi: gl.getUniformLocation(program, 'u_center_hi'),
        u_center_lo: gl.getUniformLocation(program, 'u_center_lo'),
        u_zoom: gl.getUniformLocation(program, 'u_zoom'),
        u_maxIter: gl.getUniformLocation(program, 'u_maxIter'),
        u_mode: gl.getUniformLocation(program, 'u_mode'),
        u_juliaC_hi: gl.getUniformLocation(program, 'u_juliaC_hi'),
        u_juliaC_lo: gl.getUniformLocation(program, 'u_juliaC_lo'),
        u_colorScheme: gl.getUniformLocation(program, 'u_colorScheme'),
    };
}

export async function initRenderer(canvas) {
    const gl = canvas.getContext('webgl', {
        antialias: false,
        depth: false,
        stencil: false,
    });
    if (!gl) throw new Error('WebGL not supported');

    const [vertSrc, fragSrc] = await Promise.all([
        fetch('shaders/vertex.glsl').then(r => r.text()),
        fetch('shaders/fractal.glsl').then(r => r.text()),
    ]);

    // Compile both single-precision and double-single programs
    const vertShaderSP = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
    const fragShaderSP = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
    const programSP = linkProgram(gl, vertShaderSP, fragShaderSP);
    const uniformsSP = getUniformLocations(gl, programSP);
    const aPosSP = gl.getAttribLocation(programSP, 'a_position');

    const vertShaderDS = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
    const fragShaderDS = compileShader(gl, gl.FRAGMENT_SHADER,
        '#define DOUBLE_SINGLE\n' + fragSrc);
    const programDS = linkProgram(gl, vertShaderDS, fragShaderDS);
    const uniformsDS = getUniformLocations(gl, programDS);
    const aPosDS = gl.getAttribLocation(programDS, 'a_position');

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, QUAD_VERTICES, gl.STATIC_DRAW);

    const state = {
        center: [-0.5, 0.0],
        zoom: 3.5,
        maxIter: 256,
        mode: 0,
        juliaC: [-0.7, 0.27015],
        colorScheme: 0,
        usingDS: false,
    };

    function resize() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(canvas.clientWidth * dpr);
        canvas.height = Math.floor(canvas.clientHeight * dpr);
        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function render() {
        const useDS = state.zoom < DS_ZOOM_THRESHOLD;
        state.usingDS = useDS;

        const program = useDS ? programDS : programSP;
        const uniforms = useDS ? uniformsDS : uniformsSP;
        const aPos = useDS ? aPosDS : aPosSP;

        gl.useProgram(program);
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

        const [cxHi, cxLo] = splitDouble(state.center[0]);
        const [cyHi, cyLo] = splitDouble(state.center[1]);
        const [jxHi, jxLo] = splitDouble(state.juliaC[0]);
        const [jyHi, jyLo] = splitDouble(state.juliaC[1]);

        gl.uniform2f(uniforms.u_resolution, canvas.width, canvas.height);
        gl.uniform2f(uniforms.u_center_hi, cxHi, cyHi);
        if (uniforms.u_center_lo) gl.uniform2f(uniforms.u_center_lo, cxLo, cyLo);
        gl.uniform1f(uniforms.u_zoom, state.zoom);
        gl.uniform1i(uniforms.u_maxIter, state.maxIter);
        gl.uniform1i(uniforms.u_mode, state.mode);
        gl.uniform2f(uniforms.u_juliaC_hi, jxHi, jyHi);
        if (uniforms.u_juliaC_lo) gl.uniform2f(uniforms.u_juliaC_lo, jxLo, jyLo);
        gl.uniform1i(uniforms.u_colorScheme, state.colorScheme);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    return {
        resize,
        render,
        setCenter(x, y) { state.center[0] = x; state.center[1] = y; },
        setZoom(z) { state.zoom = z; },
        setMaxIter(n) { state.maxIter = n; },
        setMode(m) { state.mode = m; },
        setJuliaC(x, y) { state.juliaC[0] = x; state.juliaC[1] = y; },
        setColorScheme(s) { state.colorScheme = s; },
        isUsingDS() { return state.usingDS; },
    };
}
