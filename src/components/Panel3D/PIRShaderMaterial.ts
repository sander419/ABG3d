import * as THREE from 'three';

/**
 * Procedural Closed-Cell Porosity ShaderMaterial for PIR (Polyisocyanurate) Insulation
 * 
 * Replaces generic plastic/smooth textures with a mathematically grounded 3D Perlin noise
 * closed-cell micro-cellular matrix.
 * 
 * Visual & physical features:
 * - 3D procedural Perlin noise & fBm: seamless across rounded edges and slab thickness
 * - Micro-cellular cavities with simulated micro-ambient occlusion
 * - Foam-specific diffuse scattering (anti-plastic, velvety falloff without hard specular shine)
 * - Continuous laminator foaming striations (subtle macro density gradient)
 * - Native support for selection glow and thermal analysis mode
 */

const PIRVertexShader = /* glsl */ `
  #include <clipping_planes_pars_vertex>

  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vObjectPosition;
  varying vec2 vUv;
  varying vec3 vViewPosition;

  void main() {
    vUv = uv;
    vObjectPosition = position;
    
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    // Normal in world space
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    
    #include <clipping_planes_vertex>

    gl_Position = projectionMatrix * mvPosition;
  }
`;

const PIRFragmentShader = /* glsl */ `
  #include <clipping_planes_pars_fragment>

  precision highp float;

  uniform mat4 modelMatrix;
  uniform float uTime;
  uniform vec3 uBaseColor;       // Warm honey/amber PIR core (#C9AE81)
  uniform vec3 uCavityColor;     // Darker micro-cavity tone (#8E6F40)
  uniform vec3 uWallColor;       // Cell boundary highlight (#EAD8B8)
  uniform float uCellScale;      // Frequency of closed cells (~70.0 - 110.0)
  uniform float uCavityDepth;    // Bump / cavity depth (~0.65)
  uniform float uSelected;       // Selection highlight lerp (0.0 to 1.0)
  uniform float uThermal;        // Thermal visualization mode (0.0 to 1.0)
  uniform float uIsoPosition;    // Position of the 0 °C isotherm inside the core (0 = interior face, 1 = exterior face)
  uniform float uBlurProgress;   // Progressive low-res blur to hi-res transition (1.0 = blur, 0.0 = sharp)
  uniform vec3 uLightDir;        // Key studio light vector
  uniform vec3 uFillLightDir;    // Secondary soft fill light vector

  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vObjectPosition;
  varying vec2 vUv;
  varying vec3 vViewPosition;

  // --- Classic 3D Perlin Noise by Stefan Gustavson ---
  vec4 permute(vec4 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
  }

  vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
  }

  vec3 fade(vec3 t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  }

  float cnoise(vec3 P) {
    vec3 Pi0 = floor(P); // Integer part for indexing
    vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
    Pi0 = mod(Pi0, 289.0);
    Pi1 = mod(Pi1, 289.0);
    vec3 Pf0 = fract(P); // Fractional part for interpolation
    vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);

    vec4 gx0 = ixy0 / 7.0;
    vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);

    vec4 gx1 = ixy1 / 7.0;
    vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);

    vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
    vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
    vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
    vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
    vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
    vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
    vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
    vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;

    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);

    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
    return 2.2 * n_xyz;
  }

  // Multi-octave fBm for closed-cell porosity matrix
  float pirPoreNoise(vec3 p) {
    // Octave 1: Core cellular boundaries
    float n1 = cnoise(p * uCellScale);
    // Octave 2: Micro-porosity pores (higher frequency)
    float n2 = cnoise(p * (uCellScale * 2.35)) * 0.48;
    // Octave 3: Ultra-fine foam tooth
    float n3 = cnoise(p * (uCellScale * 4.9)) * 0.22;
    
    return n1 + n2 + n3;
  }

  // Fast 2-octave evaluation for normal perturbation
  float pirBumpNoise(vec3 p) {
    float n1 = cnoise(p * uCellScale);
    float n2 = cnoise(p * (uCellScale * 2.35)) * 0.45;
    return n1 + n2;
  }

  // Macro laminator flow striations
  float laminatorFlow(vec3 p) {
    return cnoise(vec3(p.x * 3.5, p.y * 12.0, p.z * 4.0)) * 0.15;
  }

  void main() {
    #include <clipping_planes_fragment>

    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(vViewPosition);
    vec3 L1 = normalize(uLightDir);
    vec3 L2 = normalize(uFillLightDir);

    // 1. Procedural Closed-Cell Structure Evaluation (in Object Space to adhere to moving geometry)
    vec3 p = vObjectPosition;

    // Macro foaming density variation
    float macroFlow = laminatorFlow(p);

    // Micro-porous closed cell noise
    float poreRaw = pirPoreNoise(p);
    // When uBlurProgress > 0.0, soften high-frequency cellular noise for progressive low-res blur look
    float effectivePoreRaw = mix(poreRaw, 0.0, clamp(uBlurProgress, 0.0, 1.0) * 0.85);
    // Convert to closed-cell cavity value [0.0 = deep cavity, 1.0 = cell wall ridge]
    float cellStructure = smoothstep(-0.45, 0.55, effectivePoreRaw + macroFlow);

    // Optimized forward-differences gradient for normal bump mapping across micro-pores
    float eps = 0.0028;
    float c0 = pirBumpNoise(p);
    float nx = pirBumpNoise(p + vec3(eps, 0.0, 0.0)) - c0;
    float ny = pirBumpNoise(p + vec3(0.0, eps, 0.0)) - c0;
    float nz = pirBumpNoise(p + vec3(0.0, 0.0, eps)) - c0;
    vec3 objGrad = vec3(nx, ny, nz) / eps;
    vec3 worldGrad = mat3(modelMatrix) * objGrad;
    float effectiveCavityDepth = uCavityDepth * (1.0 - clamp(uBlurProgress, 0.0, 1.0) * 0.88);
    vec3 bumpNormal = normalize(N - worldGrad * (effectiveCavityDepth * 0.04));

    // 2. Anti-Plastic Organic Foam Scattering (Velvety Diffuse with Soft Ambient)
    // PIR foam does not have harsh specular sheen; it scatters light via sub-surface micro-porosity
    float NdotL1 = max(0.0, dot(bumpNormal, L1));
    float NdotL2 = max(0.0, dot(bumpNormal, L2));

    // Soft half-lambert wrapping for foam translucency & depth
    float halfLambert1 = pow(NdotL1 * 0.5 + 0.5, 1.35);
    float halfLambert2 = pow(NdotL2 * 0.5 + 0.5, 1.2) * 0.45;
    float diffuseLight = halfLambert1 + halfLambert2;

    // Micro-Ambient Occlusion inside deep closed-cell cavities
    float microAO = mix(0.70, 1.02, cellStructure);

    // Micro-velvet Fresnel grazing sheen (simulates light catching polyisocyanurate cell walls)
    float NdotV = max(0.0, dot(bumpNormal, V));
    float foamSheen = pow(1.0 - NdotV, 3.2) * 0.22 * cellStructure;

    // 3. Color Synthesis
    // Base gradient between cell micro-cavity and cell wall ridge
    vec3 cellColor = mix(uCavityColor, uBaseColor, cellStructure);
    // Highlights on rigid cell wall boundaries
    cellColor = mix(cellColor, uWallColor, pow(cellStructure, 3.0) * 0.35);

    // Add subtle warm tone modulation from laminator foaming
    cellColor += vec3(macroFlow * 0.06, macroFlow * 0.04, macroFlow * 0.02);

    // Apply lighting & micro-AO
    vec3 finalColor = cellColor * (diffuseLight * 0.88 + 0.28) * microAO;
    // Add soft micro-sheen on cell edges
    finalColor += uWallColor * foamSheen;

    // 4. State Interactions: Selection and Thermal Analysis
    // A. Selection Highlight: subtle illuminated tone
    if (uSelected > 0.01) {
      vec3 selectTint = vec3(1.06, 1.03, 0.96);
      finalColor = mix(finalColor, finalColor * selectTint + vec3(0.08, 0.07, 0.04), uSelected);
    }

    // B. Thermal Profile Mode: the PIR core IS the thermal barrier, so it carries
    // the whole -20 °C -> +22 °C field (R0 = 9.2). tZ runs from the interior face
    // (0.0, +22 °C) to the exterior face (1.0, -20 °C); the previous three-stop mix
    // saturated into flat paint at both ends, so here the ramp has four anchors and
    // crosses a near-white 0 °C isotherm band where the temperature actually passes 0.
    if (uThermal > 0.01) {
      float tZ = clamp((vObjectPosition.z + 0.1) / 0.2, 0.0, 1.0);

      vec3 warmTone = vec3(0.96, 0.55, 0.18);   // +22 °C, interior face
      vec3 amberTone = vec3(0.95, 0.72, 0.34);  // ~ +8 °C
      vec3 isothermTone = vec3(0.93, 0.93, 0.90); // 0 °C isotherm
      vec3 frostTone = vec3(0.58, 0.78, 0.93);  // ~ -8 °C
      vec3 coldTone = vec3(0.16, 0.42, 0.80);   // -20 °C, facade face

      float s1 = smoothstep(0.00, 0.46, tZ);
      float s2 = smoothstep(0.34, 0.68, tZ);
      float s3 = smoothstep(0.62, 0.94, tZ);

      vec3 thermalColor = mix(warmTone, amberTone, s1);
      thermalColor = mix(thermalColor, isothermTone, s2);
      thermalColor = mix(thermalColor, frostTone, s3);
      thermalColor = mix(thermalColor, coldTone, s3 * s3);

      // Thin bright line exactly at the 0 °C isotherm (the tag says "Точка 0 °C")
      float isoLine = 1.0 - smoothstep(0.0, 0.028, abs(tZ - uIsoPosition));
      thermalColor += vec3(0.16, 0.15, 0.12) * isoLine;

      // Modulate with closed-cell porosity so it still looks like authentic foam, not flat paint
      thermalColor = mix(thermalColor * 0.82, thermalColor * 1.04, cellStructure);
      finalColor = mix(finalColor, thermalColor * (diffuseLight * 0.62 + 0.46), uThermal);
    }

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export interface PIRShaderUniforms {
  uTime: { value: number };
  uBaseColor: { value: THREE.Color };
  uCavityColor: { value: THREE.Color };
  uWallColor: { value: THREE.Color };
  uCellScale: { value: number };
  uCavityDepth: { value: number };
  uSelected: { value: number };
  uThermal: { value: number };
  uIsoPosition: { value: number };
  uBlurProgress: { value: number };
  uLightDir: { value: THREE.Vector3 };
  uFillLightDir: { value: THREE.Vector3 };
}

/**
 * Creates an instance of the custom PIR ShaderMaterial
 */
export function createPIRShaderMaterial(): THREE.ShaderMaterial {
  const uniforms: PIRShaderUniforms = {
    uTime: { value: 0 },
    // Warm honey/amber polyisocyanurate core (#C9AE81) - matches the shader's documented
    // intent. The previous #D4CEBE sat within a few percent of the B30/B35 concrete tones,
    // so the insulation layer visually vanished into the slab.
    uBaseColor: { value: new THREE.Color(0xC9AE81) },
    // Deeper cell micro-cavities (#8E6F40)
    uCavityColor: { value: new THREE.Color(0x8E6F40) },
    // Cell ridge highlights (#EAD8B8)
    uWallColor: { value: new THREE.Color(0xEAD8B8) },
    // Optimal frequency for 2.4m x 1.4m x 0.2m precast slab:
    // Scale 85.0 delivers crisp closed-cell resolution without aliasing
    uCellScale: { value: 88.0 },
    uCavityDepth: { value: 0.65 },
    uSelected: { value: 0.0 },
    uThermal: { value: 0.0 },
    // 0 °C crossing for a +22 °C / -20 °C pair solved linearly across the 200 mm core:
    // 22 / (22 + 20) = 0.524. Kept as a uniform so the isotherm line can be moved
    // when the canonical temperatures of the widget change.
    uIsoPosition: { value: 0.524 },
    uBlurProgress: { value: 1.0 }, // Starts in progressive blur state, smoothly transitions to 0.0
    uLightDir: { value: new THREE.Vector3(5.0, 8.0, 6.0).normalize() },
    uFillLightDir: { value: new THREE.Vector3(-6.0, 2.0, -4.0).normalize() },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: PIRVertexShader,
    fragmentShader: PIRFragmentShader,
    uniforms: uniforms as unknown as { [uniform: string]: THREE.IUniform },
    clipping: true,
    side: THREE.DoubleSide,
    toneMapped: true,
  });

  return material;
}
