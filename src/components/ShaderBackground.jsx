import { useEffect, useRef } from 'react'
import styles from './ShaderBackground.module.css'

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

// FBM value-noise cloud drift, tinted to the Void Navy -> Steel Navy ladder
// with a faint, slow red pulse worked in at low opacity so it never competes
// with foreground content. Rendered at reduced internal resolution and
// upscaled via CSS for performance.
const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i + vec2(1.0,0.0));
  float c = hash(i + vec2(0.0,1.0)), d = hash(i + vec2(1.0,1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
float fbm(vec2 p) {
  float v = 0.0, amp = 0.5;
  for (int i = 0; i < 5; i++) {
    v += amp * noise(p);
    p *= 2.02;
    amp *= 0.52;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes.xy;
  vec2 p = uv * vec2(uRes.x / uRes.y, 1.0) * 2.4;
  float t = uTime * 0.015;
  vec2 drift = vec2(t * 0.6, t * 0.25);
  float n1 = fbm(p * 1.1 + drift);
  float n2 = fbm(p * 0.6 - drift * 0.7 + 4.2);
  float cloud = fbm(p + vec2(n1, n2) * 1.4);

  vec3 base = vec3(0.059, 0.098, 0.137);
  vec3 mid  = vec3(0.122, 0.153, 0.192);
  vec3 col = mix(base, mid, smoothstep(0.25, 0.85, cloud));

  float accent = smoothstep(0.62, 0.95, cloud) * 0.10;
  col = mix(col, vec3(1.0, 0.27, 0.33), accent);

  float vign = smoothstep(1.05, 0.25, length(uv - 0.5) * 1.3);
  col *= mix(0.7, 1.0, vign);

  gl_FragColor = vec4(col, 1.0);
}
`

function compile(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  return s
}

export default function ShaderBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false })
    if (!gl) return

    const prog = gl.createProgram()
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      // If shader compilation fails on an unusual GPU/browser combo, fail
      // silently — the section still looks correct with just the flat
      // background color, it just loses the drift texture.
      return
    }
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(prog, 'uRes')
    const uTime = gl.getUniformLocation(prog, 'uTime')

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const SCALE = 0.5 // render at half res, upscale via CSS for perf

    function resize() {
      const w = Math.max(1, Math.floor(canvas.clientWidth * SCALE))
      const h = Math.max(1, Math.floor(canvas.clientHeight * SCALE))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h
        gl.viewport(0, 0, w, h)
      }
    }

    let raf
    function draw(time) {
      resize()
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform1f(uTime, prefersReducedMotion ? 0 : time * 0.001)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      if (!prefersReducedMotion) raf = requestAnimationFrame(draw)
    }
    draw(0)

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} className={styles.canvas} />
}
