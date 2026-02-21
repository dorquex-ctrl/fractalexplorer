precision highp float;

varying vec2 v_uv;

uniform vec2 u_resolution;
uniform vec2 u_center_hi;
uniform vec2 u_center_lo;
uniform float u_zoom;
uniform int u_maxIter;
uniform int u_mode;          // 0 = Mandelbrot, 1 = Julia
uniform vec2 u_juliaC_hi;
uniform vec2 u_juliaC_lo;
uniform int u_colorScheme;

// ========== Double-Single Arithmetic ==========
#ifdef DOUBLE_SINGLE

vec2 quickTwoSum(float a, float b) {
    float s = a + b;
    float e = b - (s - a);
    return vec2(s, e);
}

vec2 twoSum(float a, float b) {
    float s = a + b;
    float v = s - a;
    float e = (a - (s - v)) + (b - v);
    return vec2(s, e);
}

vec2 dsplit(float a) {
    float t = 4097.0 * a;
    float hi = t - (t - a);
    float lo = a - hi;
    return vec2(hi, lo);
}

vec2 twoProd(float a, float b) {
    float p = a * b;
    vec2 sa = dsplit(a);
    vec2 sb = dsplit(b);
    float err = ((sa.x * sb.x - p) + sa.x * sb.y + sa.y * sb.x) + sa.y * sb.y;
    return vec2(p, err);
}

vec2 ds_add(vec2 a, vec2 b) {
    vec2 s = twoSum(a.x, b.x);
    s.y += a.y + b.y;
    return quickTwoSum(s.x, s.y);
}

vec2 ds_sub(vec2 a, vec2 b) {
    return ds_add(a, vec2(-b.x, -b.y));
}

vec2 ds_mul(vec2 a, vec2 b) {
    vec2 p = twoProd(a.x, b.x);
    p.y += a.x * b.y + a.y * b.x;
    return quickTwoSum(p.x, p.y);
}

vec2 ds_scale(vec2 a, float s) {
    vec2 p = twoProd(a.x, s);
    p.y += a.y * s;
    return quickTwoSum(p.x, p.y);
}

#endif

// ========== Color Palettes ==========

vec3 cosinePalette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
}

vec3 getColor(float smoothVal) {
    float t = smoothVal * 0.02;

    if (u_colorScheme == 0) {
        return cosinePalette(t,
            vec3(0.5, 0.5, 0.5),
            vec3(0.5, 0.5, 0.5),
            vec3(1.0, 1.0, 1.0),
            vec3(0.00, 0.10, 0.20));
    } else if (u_colorScheme == 1) {
        return cosinePalette(t,
            vec3(0.5, 0.5, 0.5),
            vec3(0.5, 0.5, 0.5),
            vec3(1.0, 0.7, 0.4),
            vec3(0.00, 0.15, 0.20));
    } else if (u_colorScheme == 2) {
        return cosinePalette(t,
            vec3(0.5, 0.5, 0.7),
            vec3(0.5, 0.5, 0.3),
            vec3(1.0, 1.0, 1.0),
            vec3(0.00, 0.33, 0.67));
    } else {
        return cosinePalette(t * 4.0,
            vec3(0.5, 0.5, 0.5),
            vec3(0.5, 0.5, 0.5),
            vec3(2.0, 1.0, 0.0),
            vec3(0.50, 0.20, 0.25));
    }
}

// ========== Main ==========

void main() {
    float aspect = u_resolution.x / u_resolution.y;

#ifdef DOUBLE_SINGLE
    float offsetX = (v_uv.x - 0.5) * u_zoom * aspect;
    float offsetY = (v_uv.y - 0.5) * u_zoom;

    vec2 coordR = ds_add(vec2(u_center_hi.x, u_center_lo.x), vec2(offsetX, 0.0));
    vec2 coordI = ds_add(vec2(u_center_hi.y, u_center_lo.y), vec2(offsetY, 0.0));

    vec2 zr, zi, cr, ci;

    if (u_mode == 0) {
        zr = vec2(0.0); zi = vec2(0.0);
        cr = coordR; ci = coordI;
    } else {
        zr = coordR; zi = coordI;
        cr = vec2(u_juliaC_hi.x, u_juliaC_lo.x);
        ci = vec2(u_juliaC_hi.y, u_juliaC_lo.y);
    }

    int escaped = 0;
    float smoothVal = 0.0;

    for (int n = 0; n < 2048; n++) {
        if (n >= u_maxIter) break;

        vec2 zr2 = ds_mul(zr, zr);
        vec2 zi2 = ds_mul(zi, zi);

        float mag2 = (zr2.x + zr2.y) + (zi2.x + zi2.y);
        if (mag2 > 256.0) {
            escaped = 1;
            smoothVal = float(n) - log2(log2(sqrt(mag2)));
            break;
        }

        vec2 zri = ds_mul(zr, zi);
        zi = ds_add(ds_scale(zri, 2.0), ci);
        zr = ds_add(ds_sub(zr2, zi2), cr);
    }
#else
    vec2 coord = vec2(
        (v_uv.x - 0.5) * u_zoom * aspect + u_center_hi.x,
        (v_uv.y - 0.5) * u_zoom + u_center_hi.y
    );

    float zr, zi, cr, ci;

    if (u_mode == 0) {
        zr = 0.0; zi = 0.0;
        cr = coord.x; ci = coord.y;
    } else {
        zr = coord.x; zi = coord.y;
        cr = u_juliaC_hi.x; ci = u_juliaC_hi.y;
    }

    int escaped = 0;
    float smoothVal = 0.0;
    float zr2, zi2;

    for (int n = 0; n < 2048; n++) {
        if (n >= u_maxIter) break;
        zr2 = zr * zr;
        zi2 = zi * zi;
        if (zr2 + zi2 > 256.0) {
            escaped = 1;
            smoothVal = float(n) - log2(log2(sqrt(zr2 + zi2)));
            break;
        }
        zi = 2.0 * zr * zi + ci;
        zr = zr2 - zi2 + cr;
    }
#endif

    if (escaped == 0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
        gl_FragColor = vec4(getColor(smoothVal), 1.0);
    }
}
