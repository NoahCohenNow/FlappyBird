'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform float iTime;
uniform vec2 iResolution;
varying vec2 vUv;

// Bayer matrix 4x4 for dithering
float bayer4x4(vec2 uv) {
    vec2 coord = floor(uv);
    int x = int(mod(coord.x, 4.0));
    int y = int(mod(coord.y, 4.0));
    int index = y * 4 + x;
    
    float matrix[16];
    matrix[0] = 0.0/16.0;  matrix[1] = 8.0/16.0;  matrix[2] = 2.0/16.0;  matrix[3] = 10.0/16.0;
    matrix[4] = 12.0/16.0; matrix[5] = 4.0/16.0;  matrix[6] = 14.0/16.0; matrix[7] = 6.0/16.0;
    matrix[8] = 3.0/16.0;  matrix[9] = 11.0/16.0; matrix[10] = 1.0/16.0; matrix[11] = 9.0/16.0;
    matrix[12] = 15.0/16.0; matrix[13] = 7.0/16.0; matrix[14] = 13.0/16.0; matrix[15] = 5.0/16.0;
    
    return matrix[index];
}

// Pseudo-random
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

void main() {
    vec2 uv = vUv;
    // Aspect correction handled by geometry or varying if needed, but plane fills screen
    
    // Distorted Coordinates for "Glitch" chart feel
    float dist = noise(vec2(uv.y * 10.0 - iTime * 0.5, iTime * 0.2));
    vec2 p = uv;
    p.x += dist * 0.05;
    
    // Base Pattern: Scrolling Grid / Data
    float grid = step(0.95, fract(p.x * 20.0)) + step(0.95, fract(p.y * 20.0 + iTime * 0.2));
    
    // Flowing gradient
    float flow = noise(vec2(uv.x * 5.0, uv.y * 5.0 - iTime));
    
    // Combine
    float brightness = flow * 0.5 + grid * 0.5;
    
    // Green tint
    vec3 color = vec3(0.0, brightness, 0.0);
    
    // Dithering
    vec2 pixelCoord = uv * iResolution; // Screen pixels
    // Scale resolution down for "retro" pixel look
    float ditherVal = bayer4x4(pixelCoord / 2.0); // Divide by 2.0 for bigger pixels
    
    if (brightness < ditherVal) {
        color = vec3(0.05, 0.08, 0.05); // Dark background
    } else {
        // Quantize colors
        if (brightness > 0.8) color = vec3(0.8, 1.0, 0.8);
        else if (brightness > 0.5) color = vec3(0.0, 1.0, 0.0);
        else color = vec3(0.0, 0.4, 0.0);
    }
    
    // Scanline
    float scanline = sin(uv.y * iResolution.y * 0.5) * 0.1;
    color -= scanline;
    
    // Vignette
    float vig = 1.0 - length(uv - 0.5) * 1.5;
    color *= vig;

    gl_FragColor = vec4(color, 1.0);
}
`;

const ShaderPlane = () => {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  
  const uniforms = useMemo(
    () => ({
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector2(1000, 1000) }, // Will update
    }),
    []
  );

  useFrame((state) => {
    if (material.current) {
      material.current.uniforms.iTime.value = state.clock.getElapsedTime();
      material.current.uniforms.iResolution.value.set(
        state.size.width,
        state.size.height
      );
    }
  });

  return (
    <mesh ref={mesh} scale={[20, 10, 1]}> {/* Scale to cover screen approx */}
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        fragmentShader={fragmentShader}
        vertexShader={vertexShader}
        uniforms={uniforms}
      />
    </mesh>
  );
};

export default function DegenBackground() {
  return (
    <div className="absolute top-0 left-0 w-full h-full -z-10 bg-black">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <ShaderPlane />
      </Canvas>
      {/* Overlay gradient for better text readability */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/70 via-transparent to-black/70 pointer-events-none"></div>
    </div>
  );
}
