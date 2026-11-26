import { useEffect, useRef } from "react"
import type { Hex } from "../types"
import { inkFor, REST, type InkState } from "./palette"

// The background is driven from outside React: pages call setInk() on hover / open and the
// render loop eases towards it. Nothing re-renders, so the animation never restarts.
let target: InkState = REST
export function setInk(palette: [Hex, Hex, Hex] | null) {
  target = palette ? inkFor(palette) : REST
}

const VERT = "attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }"
const FRAG = `precision mediump float;
uniform vec2 r; uniform float t; uniform vec3 cg; uniform vec3 ca; uniform vec3 cb; uniform float k; uniform float sc;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(h(i), h(i+vec2(1.,0.)), f.x), mix(h(i+vec2(0.,1.)), h(i+vec2(1.,1.)), f.x), f.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for(int i=0;i<5;i++){ v += a*n(p); p = p*2.03 + 7.1; a *= 0.5; } return v; }
void main(){
  // fixed pixel scale anchored top-left: resizing the window reveals more of the same wash
  vec2 fc = vec2(gl_FragCoord.x, r.y - gl_FragCoord.y) * sc;
  vec2 p = fc / 900.0;
  float ux = gl_FragCoord.x / r.x;
  float uy = clamp(1.0 - fc.y / 900.0, 0.0, 1.0);
  vec2 q = vec2(fbm(p*1.4 + t*0.020), fbm(p*1.4 + vec2(5.2,1.3) - t*0.016));
  float f = fbm(p*1.8 + q*2.6 + t*0.012);
  float wash = smoothstep(0.42, 0.80, f);
  float pool = smoothstep(0.05, 0.0, abs(f - 0.46));
  float side = smoothstep(0.25, 1.0, ux) * (0.55 + 0.45*uy);
  side = mix(side, 0.45 + 0.55*side, k);
  vec3 col = cg - (h(gl_FragCoord.xy) - 0.5) * 0.018;
  col = mix(col, ca, wash * 0.34 * side);
  col = mix(col, cb, pool * 0.20 * side);
  gl_FragColor = vec4(col, 1.0);
}`

/** Full-window ink wash behind the page. Falls back to the plain paper colour without WebGL. */
export function InkBackground() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const gl = canvas?.getContext("webgl", { antialias: false, powerPreference: "low-power" })
    if (!canvas || !gl) return

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }
    const program = gl.createProgram()!
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return
    gl.useProgram(program)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(program, "a")
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const u = (name: string) => gl.getUniformLocation(program, name)
    const ur = u("r"),
      ut = u("t"),
      ug = u("cg"),
      ua = u("ca"),
      ub = u("cb"),
      uk = u("k")

    // half resolution: the wash is soft anyway and this keeps phones cool
    const SCALE = 2
    gl.uniform1f(u("sc"), SCALE)
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const cur = [...REST] as InkState
    let frame = 0
    const draw = (ms: number) => {
      const w = Math.max(2, Math.round(canvas.clientWidth / SCALE))
      const hgt = Math.max(2, Math.round(canvas.clientHeight / SCALE))
      if (canvas.width !== w || canvas.height !== hgt) {
        canvas.width = w
        canvas.height = hgt
        gl.viewport(0, 0, w, hgt)
      }
      for (let i = 0; i < 10; ++i) cur[i] = still ? target[i]! : cur[i]! + (target[i]! - cur[i]!) * 0.018
      gl.uniform2f(ur, w, hgt)
      gl.uniform1f(ut, still ? 40 : 40 + ms / 1000)
      gl.uniform3f(ug, cur[0], cur[1], cur[2])
      gl.uniform3f(ua, cur[3], cur[4], cur[5])
      gl.uniform3f(ub, cur[6], cur[7], cur[8])
      gl.uniform1f(uk, cur[9])
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [])

  return <canvas ref={ref} className="ink-bg" aria-hidden="true" />
}
