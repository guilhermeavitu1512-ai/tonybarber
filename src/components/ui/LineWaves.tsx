"use client";
import { useEffect, useRef } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface LineWavesProps {
  speed?: number;
  innerLineCount?: number;
  outerLineCount?: number;
  warpIntensity?: number;
  rotation?: number;
  edgeFadeWidth?: number;
  colorCycleSpeed?: number;
  brightness?: number;
  color1?: string;
  color2?: string;
  color3?: string;
  enableMouseInteraction?: boolean;
  mouseInfluence?: number;
  className?: string;
  style?: React.CSSProperties;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r
    ? [parseInt(r[1], 16) / 255, parseInt(r[2], 16) / 255, parseInt(r[3], 16) / 255]
    : [1, 0.35, 0];
}

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(s) ?? 'Shader compile error');
  }
  return s;
}

// ─── Shaders ─────────────────────────────────────────────────────────────────
const VERT = /* glsl */`
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */`
  precision highp float;

  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec2  uMouse;
  uniform float uSpeed;
  uniform float uTotalLines;
  uniform float uWarpIntensity;
  uniform float uRotation;
  uniform float uEdgeFadeWidth;
  uniform float uColorCycleSpeed;
  uniform float uBrightness;
  uniform vec3  uColor1;
  uniform vec3  uColor2;
  uniform vec3  uColor3;
  uniform float uMouseInfluence;
  uniform int   uEnableMouse;

  #define PI 3.14159265358979323846

  vec3 triColor(float t) {
    t = fract(t);
    if (t < 0.333) return mix(uColor1, uColor2, t * 3.0);
    if (t < 0.667) return mix(uColor2, uColor3, (t - 0.333) * 3.0);
    return mix(uColor3, uColor1, (t - 0.667) * 3.0);
  }

  void main() {
    vec2 fragUv   = gl_FragCoord.xy / uResolution;   // original UV (for edge fade)
    vec2 uv       = fragUv;

    // Mouse warp (in UV space)
    if (uEnableMouse == 1) {
      vec2  toMouse = uMouse - uv;
      float d       = length(toMouse);
      float warp    = uMouseInfluence * exp(-d * 5.5) * 0.06;
      uv += normalize(toMouse + 0.0001) * warp;
    }

    // Rotation around centre
    float  angle = uRotation * PI / 180.0;
    vec2   rel   = uv - 0.5;
    float  ca    = cos(angle), sa = sin(angle);
    rel  = vec2(rel.x * ca - rel.y * sa, rel.x * sa + rel.y * ca);
    uv   = rel + 0.5;

    vec3  color = vec3(0.0);
    float t     = uTime * uSpeed;

    // Draw lines
    for (float i = 0.0; i < 70.0; i++) {
      if (i >= uTotalLines) break;

      float frac = (i + 0.5) / uTotalLines;

      // Organic multi-sine wave
      float wave =
        sin(uv.x * 7.3  + t       + i * 0.71) * 0.38 +
        sin(uv.x * 3.9  + t * 1.4 + i * 0.43) * 0.22 +
        sin(uv.x * 2.0  + t * 0.6 + i * 0.97) * 0.14 +
        sin(uv.x * 14.7 + t * 1.9 + i * 1.20) * 0.08;

      wave *= uWarpIntensity * 0.075;

      float lineY = frac + wave;
      float dist  = abs(uv.y - lineY);

      // Soft gaussian-ish line
      float k    = 0.0032;
      float glow = exp(-(dist * dist) / (k * k));

      float colorT = frac + t * uColorCycleSpeed * 0.018;
      color += glow * triColor(colorT) * uBrightness;
    }

    // Edge fade (use original fragUv so fade is axis-aligned, not rotated)
    float fx = smoothstep(0.0, uEdgeFadeWidth, fragUv.x) *
               smoothstep(1.0, 1.0 - uEdgeFadeWidth, fragUv.x);
    float fy = smoothstep(0.0, uEdgeFadeWidth, fragUv.y) *
               smoothstep(1.0, 1.0 - uEdgeFadeWidth, fragUv.y);
    color *= fx * fy;

    gl_FragColor = vec4(color, 1.0);
  }
`;

// ─── Component ───────────────────────────────────────────────────────────────
export function LineWaves({
  speed             = 0.18,
  innerLineCount    = 28,
  outerLineCount    = 34,
  warpIntensity     = 0.7,
  rotation          = -35,
  edgeFadeWidth     = 0.15,
  colorCycleSpeed   = 0.5,
  brightness        = 0.08,
  color1            = '#ff5a00',
  color2            = '#ff7a00',
  color3            = '#ff9a3c',
  enableMouseInteraction = false,
  mouseInfluence    = 0.7,
  className,
  style,
}: LineWavesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef       = useRef<number>(0);
  const mouseRef     = useRef<[number, number]>([0.5, 0.5]);

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const container = containerRef.current;
    if (!container) return;

    // Canvas setup
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%;';
    container.appendChild(canvas);

    const gl = canvas.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power' });
    if (!gl) { container.removeChild(canvas); return; }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Resize
    let dpr = Math.min(window.devicePixelRatio, 2);
    function resize() {
      const w = container!.clientWidth;
      const h = container!.clientHeight;
      canvas.width  = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      gl!.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    // Compile program
    const vs = compileShader(gl, gl.VERTEX_SHADER,   VERT);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG);
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Fullscreen triangle strip quad
    const verts  = new Float32Array([-1, -1,  1, -1,  -1, 1,  1, 1]);
    const buf    = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const u = (n: string) => gl.getUniformLocation(program, n);
    const locs = {
      uTime:             u('uTime'),
      uResolution:       u('uResolution'),
      uMouse:            u('uMouse'),
      uSpeed:            u('uSpeed'),
      uTotalLines:       u('uTotalLines'),
      uWarpIntensity:    u('uWarpIntensity'),
      uRotation:         u('uRotation'),
      uEdgeFadeWidth:    u('uEdgeFadeWidth'),
      uColorCycleSpeed:  u('uColorCycleSpeed'),
      uBrightness:       u('uBrightness'),
      uColor1:           u('uColor1'),
      uColor2:           u('uColor2'),
      uColor3:           u('uColor3'),
      uMouseInfluence:   u('uMouseInfluence'),
      uEnableMouse:      u('uEnableMouse'),
    };

    // Mobile: reduce line count for performance
    const isMobile     = window.innerWidth < 768;
    const factor       = isMobile ? 0.55 : 1;
    const totalLines   = Math.floor((innerLineCount + outerLineCount) * factor);

    const [r1, g1, b1] = hexToRgb(color1);
    const [r2, g2, b2] = hexToRgb(color2);
    const [r3, g3, b3] = hexToRgb(color3);

    gl.uniform1f(locs.uSpeed,            speed);
    gl.uniform1f(locs.uTotalLines,       totalLines);
    gl.uniform1f(locs.uWarpIntensity,    warpIntensity);
    gl.uniform1f(locs.uRotation,         rotation);
    gl.uniform1f(locs.uEdgeFadeWidth,    edgeFadeWidth);
    gl.uniform1f(locs.uColorCycleSpeed,  colorCycleSpeed);
    gl.uniform1f(locs.uBrightness,       brightness);
    gl.uniform3f(locs.uColor1,           r1, g1, b1);
    gl.uniform3f(locs.uColor2,           r2, g2, b2);
    gl.uniform3f(locs.uColor3,           r3, g3, b3);
    gl.uniform1f(locs.uMouseInfluence,   mouseInfluence);
    gl.uniform1i(locs.uEnableMouse,      enableMouseInteraction ? 1 : 0);

    // Mouse tracking
    function onMouseMove(e: MouseEvent) {
      const rect = container!.getBoundingClientRect();
      mouseRef.current = [
        (e.clientX - rect.left) / rect.width,
        1.0 - (e.clientY - rect.top) / rect.height,
      ];
    }
    if (enableMouseInteraction) container.addEventListener('mousemove', onMouseMove);

    // Animation loop
    const startTime = performance.now();
    function frame() {
      rafRef.current = requestAnimationFrame(frame);
      const elapsed  = (performance.now() - startTime) * 0.001;

      gl!.uniform1f(locs.uTime,    elapsed);
      gl!.uniform2f(locs.uResolution, canvas.width, canvas.height);
      gl!.uniform2f(locs.uMouse, mouseRef.current[0], mouseRef.current[1]);

      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
    }
    frame();

    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
      if (enableMouseInteraction) container.removeEventListener('mousemove', onMouseMove);
      gl.deleteProgram(program);
      gl.deleteBuffer(buf);
      if (container.contains(canvas)) container.removeChild(canvas);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
}
