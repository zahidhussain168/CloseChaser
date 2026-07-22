"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * A single, page-wide WebGL background: soft ribbons of the brand palette
 * (teal, emerald, brass) drifting across a pale base, like ink settling on
 * ledger paper. One fullscreen shader, one GPU context, fixed behind all
 * content so the same living surface flows through every section on scroll.
 * Cheap by design: layered sines (no textures), capped DPR, no antialias.
 */
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uAspect;

  float wave(vec2 p, float t) {
    float v = 0.0;
    v += sin(p.x * 2.6 + t * 0.7 + sin(p.y * 2.1 - t * 0.5));
    v += sin(p.y * 2.3 - t * 0.6 + cos(p.x * 2.9 + t * 0.4));
    v += sin((p.x + p.y) * 1.8 + t * 0.45);
    return v / 3.0;
  }

  void main() {
    vec2 p = vec2(vUv.x * uAspect, vUv.y);
    float t = uTime * 0.2;
    float a = wave(p * 1.2, t) * 0.5 + 0.5;
    float b = wave(p * 1.9 + 7.3, t * 0.85) * 0.5 + 0.5;

    vec3 base    = vec3(0.035, 0.055, 0.110);
    vec3 teal    = vec3(0.055, 0.360, 0.560);
    vec3 emerald = vec3(0.050, 0.360, 0.290);
    vec3 brass   = vec3(0.360, 0.290, 0.150);

    vec3 col = base;
    col = mix(col, teal,    smoothstep(0.40, 0.88, a) * 0.75);
    col = mix(col, emerald, smoothstep(0.50, 0.92, b) * 0.55);
    col = mix(col, brass,   smoothstep(0.70, 1.00, a * b + 0.05) * 0.40);
    gl_FragColor = vec4(col, 1.0);
  }
`;

function Ribbons() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uAspect: { value: 1 } }),
    [],
  );

  useFrame((state) => {
    if (!mat.current) return;
    mat.current.uniforms.uTime.value = state.clock.elapsedTime;
    mat.current.uniforms.uAspect.value = state.size.width / state.size.height;
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={mat}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export function SceneBackground() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: false }}
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%" }}
    >
      <Ribbons />
    </Canvas>
  );
}
