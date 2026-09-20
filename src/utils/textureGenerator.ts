import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

export interface GeneratedTextures {
  concreteBump: THREE.Texture;
  concreteRoughness: THREE.Texture;
  concreteFacade: THREE.Texture;
  concreteStructural: THREE.Texture;
  structuralBump: THREE.Texture;
  structuralRoughness: THREE.Texture;
  pirTexture: THREE.Texture;
  pirBump: THREE.Texture;
  pirRoughness: THREE.Texture;
}

export interface ProceduralTextureDataUrls {
  concreteFacade: string;
  concreteStructural: string;
  pirTexture: string;
  concreteBump: string;
  structuralBump: string;
  pirBump: string;
  concreteRoughness: string;
  structuralRoughness: string;
  pirRoughness: string;
}

// Pseudo-random helper with repeatable seed
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * 1. FACADE CONCRETE DIFFUSE (512x512)
 * High-grade architectural precast concrete B35 (светло-серый гладкий архитектурный бетон)
 * Features: subtle cement paste mottling, mineral aggregates (quartz specks), formwork seams, and micro-pores.
 */
function createFacadeDiffuseCanvas(size: number = 512): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base authentic architectural concrete: #EDEDE9 (warm architectural concrete B35)
  ctx.fillStyle = '#EDEDE9';
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  // Multi-octave cement cloud noise
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      // Low frequency cloud
      const wave1 = Math.sin(x * 0.02) * Math.cos(y * 0.02) * 10;
      const wave2 = Math.sin(x * 0.05 + y * 0.03) * 6;
      // High frequency fine cement paste grain
      const grain = (Math.random() - 0.5) * 12;

      const delta = wave1 + wave2 + grain;

      data[idx] = Math.min(255, Math.max(0, data[idx] + delta + 1));     // subtle warm tone
      data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + delta));
      data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + delta - 2)); // warm natural undertone
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Subtle formwork panel joint line across the middle
  ctx.strokeStyle = 'rgba(120, 124, 130, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, size * 0.5);
  ctx.lineTo(size, size * 0.5);
  ctx.stroke();

  // Subtle formwork tie-holes (технологические конусы опалубки с фаской)
  const tieHoles = [
    { x: size * 0.25, y: size * 0.25 },
    { x: size * 0.75, y: size * 0.25 },
    { x: size * 0.25, y: size * 0.75 },
    { x: size * 0.75, y: size * 0.75 },
  ];

  for (const h of tieHoles) {
    // Outer bevel ring
    ctx.beginPath();
    ctx.arc(h.x, h.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(140, 144, 150, 0.4)';
    ctx.fill();

    // Inner recess shadow
    ctx.beginPath();
    ctx.arc(h.x, h.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(75, 80, 85, 0.6)';
    ctx.fill();

    // Center plug
    ctx.beginPath();
    ctx.arc(h.x, h.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(155, 160, 165, 0.8)';
    ctx.fill();
  }

  // Scattered micro-pores (каверны с тенью)
  for (let i = 0; i < 180; i++) {
    const px = Math.random() * size;
    const py = Math.random() * size;
    const r = Math.random() * 1.8 + 0.6;

    // Dark pit
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${50 + Math.random() * 30}, ${55 + Math.random() * 30}, ${60 + Math.random() * 30}, ${0.45 + Math.random() * 0.3})`;
    ctx.fill();

    // Rim highlight (light catch on top edge)
    ctx.beginPath();
    ctx.arc(px - 0.5, py - 0.5, r * 0.8, Math.PI * 1.2, Math.PI * 1.8);
    ctx.strokeStyle = 'rgba(235, 240, 245, 0.35)';
    ctx.lineWidth = 0.75;
    ctx.stroke();
  }

  // Fine sand quartz particles (микро-песчинки)
  for (let i = 0; i < 300; i++) {
    const px = Math.random() * size;
    const py = Math.random() * size;
    const isDark = Math.random() > 0.4;
    ctx.fillStyle = isDark ? 'rgba(70, 72, 75, 0.3)' : 'rgba(230, 235, 240, 0.35)';
    ctx.fillRect(px, py, 1.2, 1.2);
  }

  return canvas;
}

/**
 * 2. STRUCTURAL CONCRETE DIFFUSE (512x512)
 * Load-bearing precast concrete (несущий конструкционный железобетон B25-B30)
 * Features: denser stone aggregate inclusions (щебень 5-20мм), rougher industrial cement matrix #969AA0
 */
function createStructuralDiffuseCanvas(size: number = 512): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base structural precast concrete: smooth stone-grey B30 #D6D3D1
  ctx.fillStyle = '#D6D3D1';
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  // Rich stone texture noise
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const wave = Math.sin(x * 0.035) * Math.sin(y * 0.035) * 16;
      const n = (Math.random() - 0.5) * 22;
      const delta = wave + n;

      data[idx] = Math.min(255, Math.max(0, data[idx] + delta));
      data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + delta));
      data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + delta));
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Gravel / Aggregate Stones (вкрапления гранитного щебня)
  for (let i = 0; i < 90; i++) {
    const px = Math.random() * size;
    const py = Math.random() * size;
    const rw = Math.random() * 6 + 3;
    const rh = Math.random() * 4 + 2;
    const angle = Math.random() * Math.PI;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2);

    const stoneType = Math.random();
    if (stoneType < 0.4) {
      // Dark basalt/granite
      ctx.fillStyle = 'rgba(65, 70, 75, 0.5)';
    } else if (stoneType < 0.7) {
      // Light quartz pebble
      ctx.fillStyle = 'rgba(180, 185, 192, 0.45)';
    } else {
      // Warm mineral pebble
      ctx.fillStyle = 'rgba(145, 138, 128, 0.4)';
    }
    ctx.fill();

    // Dark contact border around stone
    ctx.strokeStyle = 'rgba(50, 55, 60, 0.3)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();
  }

  // Industrial formwork grain lines
  ctx.strokeStyle = 'rgba(70, 75, 80, 0.15)';
  ctx.lineWidth = 1;
  for (let y = 0; y < size; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y + (Math.random() - 0.5) * 4);
    ctx.lineTo(size, y + (Math.random() - 0.5) * 4);
    ctx.stroke();
  }

  return canvas;
}

/**
 * 3. PIR INSULATION DIFFUSE (512x512)
 * High-performance polyisocyanurate foam board with reinforced facing (PIR-плита 200 мм)
 * Features: warm amber/honey cellular foam #C9AE81, micro-porosity, and subtle embossed waffle/diamond grid facer.
 */
function createPIRDiffuseCanvas(size: number = 512): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base warm PIR foam core color
  ctx.fillStyle = '#C8AD80';
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  // Closed-cell foam micro-porosity
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      // High frequency cellular cellular noise
      const n1 = (Math.random() - 0.5) * 26;
      const n2 = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 8;
      const delta = n1 + n2;

      data[idx] = Math.min(255, Math.max(0, data[idx] + delta + 4));     // R: warm golden
      data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + delta)); // G: amber
      data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + delta - 10)); // B: low blue for warmth
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Embossed Diamond / Waffle Grid (характерное тиснение фольги / стеклохолста плит PIR)
  ctx.strokeStyle = 'rgba(235, 220, 185, 0.4)';
  ctx.lineWidth = 1.0;
  const gridStep = 32;

  ctx.beginPath();
  for (let i = -size; i < size * 2; i += gridStep) {
    // Diagonal 45 deg
    ctx.moveTo(i, 0);
    ctx.lineTo(i + size, size);
    // Diagonal -45 deg
    ctx.moveTo(i, size);
    ctx.lineTo(i + size, 0);
  }
  ctx.stroke();

  // Darker shadow line parallel to embossed grid to create 3D stamped depth
  ctx.strokeStyle = 'rgba(130, 105, 70, 0.28)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let i = -size; i < size * 2; i += gridStep) {
    ctx.moveTo(i + 1.2, 1.2);
    ctx.lineTo(i + size + 1.2, size + 1.2);
  }
  ctx.stroke();

  // Dense micro-cells (микропоры жесткого пенополиизоцианурата)
  for (let i = 0; i < 400; i++) {
    const px = Math.random() * size;
    const py = Math.random() * size;
    const r = Math.random() * 1.5 + 0.4;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(100, 80, 50, 0.35)' : 'rgba(245, 230, 195, 0.45)';
    ctx.fill();
  }

  // Neutral material marking: no third-party product name is rendered in a client demo.
  ctx.save();
  ctx.font = '600 11px monospace';
  ctx.fillStyle = 'rgba(100, 80, 55, 0.32)';
  ctx.letterSpacing = '2px';
  ctx.fillText('EFFECTIVE INSULATION // PROJECT SPECIFICATION', 40, 70);
  ctx.fillText('MATERIAL / THICKNESS / λ — PER DESIGN DOCUMENTATION', 40, 88);
  ctx.restore();

  return canvas;
}

/**
 * 4. HIGH DYNAMIC RANGE BUMP & NORMAL MAPS (512x512)
 * Height maps giving genuine 3D tactile micro-relief
 */
function createConcreteBumpCanvas(size: number = 512, isStructural: boolean = false): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Neutral mid-grey (height = 0)
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  const mult = isStructural ? 1.6 : 1.0;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const n1 = (Math.sin(x * 0.15) + Math.cos(y * 0.15)) * 14 * mult;
      const n2 = (Math.random() - 0.5) * 32 * mult;
      const val = Math.min(255, Math.max(0, 128 + n1 + n2));

      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Deep pore pits
  const poreCount = isStructural ? 160 : 120;
  for (let i = 0; i < poreCount; i++) {
    const px = Math.random() * size;
    const py = Math.random() * size;
    const r = Math.random() * 2.5 + 0.8;

    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(20, 20, 20, 0.7)'; // deep indents
    ctx.fill();

    // Raised rim
    ctx.beginPath();
    ctx.arc(px, py, r + 0.8, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(220, 220, 220, 0.5)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  return canvas;
}

function createPIRBumpCanvas(size: number = 512): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const n = (Math.random() - 0.5) * 36;
      const val = Math.min(255, Math.max(0, 128 + n));
      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Waffle grid embossing in bump map
  ctx.strokeStyle = 'rgba(240, 240, 240, 0.6)';
  ctx.lineWidth = 1.8;
  const gridStep = 32;

  ctx.beginPath();
  for (let i = -size; i < size * 2; i += gridStep) {
    ctx.moveTo(i, 0);
    ctx.lineTo(i + size, size);
    ctx.moveTo(i, size);
    ctx.lineTo(i + size, 0);
  }
  ctx.stroke();

  // Parallel groove indent
  ctx.strokeStyle = 'rgba(20, 20, 20, 0.55)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = -size; i < size * 2; i += gridStep) {
    ctx.moveTo(i + 1.5, 1.5);
    ctx.lineTo(i + size + 1.5, size + 1.5);
  }
  ctx.stroke();

  return canvas;
}

/**
 * 5. ROUGHNESS MAPS (512x512)
 * Gives natural micro-specular variations across the surfaces
 */
function createRoughnessCanvas(size: number = 512, baseRough: number = 0.85): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const baseVal = Math.round(baseRough * 255);
  ctx.fillStyle = `rgb(${baseVal}, ${baseVal}, ${baseVal})`;
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 30;
    const v = Math.min(255, Math.max(0, data[i] + n));
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
  }
  ctx.putImageData(imgData, 0, 0);

  return canvas;
}

export type ProgressiveTextureStage = 'low-res-blur' | 'calculating' | 'ready';

export interface ProgressiveTextureState {
  textures: GeneratedTextures;
  stage: ProgressiveTextureStage;
  progress: number; // 0 to 100
  resolution: number; // 32 or 512
  isReady: boolean;
  recalculate: () => void;
}

/**
 * Generates an instant, low-resolution blurred representation (32x32) of a texture.
 * Applies a Gaussian-like canvas blur filter so the proxy has a gentle, smooth blur appearance
 * rather than harsh blocky pixels before high-resolution maps finish background calculation.
 */
function createLowResBlurredCanvas(type: keyof GeneratedTextures, size: number = 32): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  if (type === 'concreteFacade') {
    // Architectural B35 light grey precast base
    ctx.fillStyle = '#B8BCC0';
    ctx.fillRect(0, 0, size, size);

    // Low-frequency cement paste density clouds
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const wave = Math.sin((x / size) * Math.PI * 2) * Math.cos((y / size) * Math.PI * 2) * 12;
        data[idx] = Math.min(255, Math.max(0, data[idx] + wave));
        data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + wave));
        data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + wave - 1));
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Soft formwork panel joint
    ctx.strokeStyle = 'rgba(120, 124, 130, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, size * 0.5);
    ctx.lineTo(size, size * 0.5);
    ctx.stroke();

    // Four soft tie-hole impressions
    ctx.fillStyle = 'rgba(90, 95, 100, 0.35)';
    const tiePos = [0.25, 0.75];
    for (const tx of tiePos) {
      for (const ty of tiePos) {
        ctx.beginPath();
        ctx.arc(size * tx, size * ty, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (type === 'concreteStructural') {
    // Base load-bearing industrial grey
    ctx.fillStyle = '#9498A0';
    ctx.fillRect(0, 0, size, size);

    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const wave = Math.sin((x / size) * Math.PI * 3) * Math.sin((y / size) * Math.PI * 3) * 14;
        data[idx] = Math.min(255, Math.max(0, data[idx] + wave));
        data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + wave));
        data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + wave));
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Soft aggregate clusters
    ctx.fillStyle = 'rgba(65, 70, 75, 0.28)';
    ctx.beginPath();
    ctx.arc(size * 0.35, size * 0.4, 3, 0, Math.PI * 2);
    ctx.arc(size * 0.7, size * 0.65, 3.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'pirTexture') {
    // Base warm honey PIR foam
    ctx.fillStyle = '#C8AD80';
    ctx.fillRect(0, 0, size, size);

    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const wave = Math.sin((x / size) * Math.PI * 2) * 8;
        data[idx] = Math.min(255, Math.max(0, data[idx] + wave + 4));
        data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + wave));
        data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + wave - 8));
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Soft hint of waffle grid
    ctx.strokeStyle = 'rgba(235, 220, 185, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= size; i += 8) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i + size, size);
    }
    ctx.stroke();
  } else if (type === 'concreteBump' || type === 'structuralBump') {
    // Neutral mid-grey bump (smooth macro relief)
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);

    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    const mult = type === 'structuralBump' ? 1.5 : 1.0;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const wave = (Math.sin((x / size) * Math.PI * 2) + Math.cos((y / size) * Math.PI * 2)) * 8 * mult;
        const val = Math.min(255, Math.max(0, 128 + wave));
        data[idx] = val;
        data[idx + 1] = val;
        data[idx + 2] = val;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } else if (type === 'pirBump') {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);
  } else {
    // Roughness maps
    const baseVal = type === 'structuralRoughness' ? 235 : (type === 'concreteRoughness' ? 224 : 209);
    ctx.fillStyle = `rgb(${baseVal}, ${baseVal}, ${baseVal})`;
    ctx.fillRect(0, 0, size, size);
  }

  // Apply smooth Gaussian-like canvas blur filter
  try {
    const temp = document.createElement('canvas');
    temp.width = size;
    temp.height = size;
    const tempCtx = temp.getContext('2d');
    if (tempCtx) {
      tempCtx.drawImage(canvas, 0, 0);
      ctx.clearRect(0, 0, size, size);
      if ('filter' in ctx) {
        ctx.filter = 'blur(1.6px)';
      }
      ctx.drawImage(temp, 0, 0);
      if ('filter' in ctx) {
        ctx.filter = 'none';
      }
    }
  } catch {
    // Fallback gracefully to standard linear filtering
  }

  return canvas;
}

interface TextureConfig {
  isSRGB: boolean;
  repeat: number;
}

const TEXTURE_CONFIGS: Record<keyof GeneratedTextures, TextureConfig> = {
  concreteFacade: { isSRGB: true, repeat: 2 },
  concreteStructural: { isSRGB: true, repeat: 2 },
  pirTexture: { isSRGB: true, repeat: 3 },
  concreteBump: { isSRGB: false, repeat: 2 },
  structuralBump: { isSRGB: false, repeat: 2 },
  pirBump: { isSRGB: false, repeat: 3 },
  concreteRoughness: { isSRGB: false, repeat: 2 },
  structuralRoughness: { isSRGB: false, repeat: 2 },
  pirRoughness: { isSRGB: false, repeat: 3 },
};

let progressiveCanvases: Record<keyof GeneratedTextures, HTMLCanvasElement> | null = null;
let progressiveTextures: GeneratedTextures | null = null;
let progressiveStage: ProgressiveTextureStage = 'low-res-blur';
let progressiveProgress = 0;
let progressiveResolution = 32;
let isCalculating = false;
let calculationTimer: any = null;

type ProgressiveListener = (state: {
  stage: ProgressiveTextureStage;
  progress: number;
  resolution: number;
}) => void;
const listeners = new Set<ProgressiveListener>();

function notifyListeners() {
  listeners.forEach((fn) =>
    fn({
      stage: progressiveStage,
      progress: progressiveProgress,
      resolution: progressiveResolution,
    })
  );
}

/**
 * Initializes persistent canvas textures backed by 32x32 low-res blurred canvases.
 * Immediate execution (<1ms), fully eliminating initial thread stalls.
 */
export function initProgressiveTextures(): GeneratedTextures {
  if (progressiveTextures && progressiveCanvases) {
    return progressiveTextures;
  }

  if (typeof document === 'undefined') {
    return {} as unknown as GeneratedTextures;
  }

  const keys = Object.keys(TEXTURE_CONFIGS) as (keyof GeneratedTextures)[];
  const canvases: Partial<Record<keyof GeneratedTextures, HTMLCanvasElement>> = {};
  const textures: Partial<Record<keyof GeneratedTextures, THREE.CanvasTexture>> = {};

  keys.forEach((key) => {
    const cvs = document.createElement('canvas');
    cvs.width = 32;
    cvs.height = 32;
    const lowRes = createLowResBlurredCanvas(key, 32);
    const ctx = cvs.getContext('2d');
    if (ctx) {
      ctx.drawImage(lowRes, 0, 0);
    }

    const cfg = TEXTURE_CONFIGS[key];
    const tex = new THREE.CanvasTexture(cvs);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(cfg.repeat, cfg.repeat);
    if (cfg.isSRGB) {
      tex.colorSpace = THREE.SRGBColorSpace;
    }
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;

    canvases[key] = cvs;
    textures[key] = tex;
  });

  progressiveCanvases = canvases as Record<keyof GeneratedTextures, HTMLCanvasElement>;
  progressiveTextures = textures as unknown as GeneratedTextures;
  progressiveStage = 'low-res-blur';
  progressiveProgress = 0;
  progressiveResolution = 32;

  return progressiveTextures;
}

/**
 * Starts background calculation of the full 512x512 procedural maps across async macrotasks.
 * Slices CPU execution across multiple ticks so 3D navigation and user interface remain 60+ FPS.
 */
export function startProgressiveBackgroundCalculation(): void {
  if (progressiveStage === 'ready' || isCalculating) return;
  if (typeof document === 'undefined') return;

  initProgressiveTextures();
  isCalculating = true;
  progressiveStage = 'calculating';
  notifyListeners();

  // Step 1: 120ms initial pause ensuring the low-res blur is visually displayed first
  calculationTimer = setTimeout(() => {
    if (!progressiveCanvases || !progressiveTextures) return;

    // Batch 1: Facade diffuse & bump
    const facadeCanvas = createFacadeDiffuseCanvas(512);
    const concreteBumpCanvas = createConcreteBumpCanvas(512, false);

    const fCvs = progressiveCanvases.concreteFacade;
    fCvs.width = 512;
    fCvs.height = 512;
    fCvs.getContext('2d')!.drawImage(facadeCanvas, 0, 0);
    progressiveTextures.concreteFacade.needsUpdate = true;

    const bCvs = progressiveCanvases.concreteBump;
    bCvs.width = 512;
    bCvs.height = 512;
    bCvs.getContext('2d')!.drawImage(concreteBumpCanvas, 0, 0);
    progressiveTextures.concreteBump.needsUpdate = true;

    progressiveProgress = 35;
    notifyListeners();

    // Step 2: Structural concrete diffuse & bump (after 80ms)
    calculationTimer = setTimeout(() => {
      if (!progressiveCanvases || !progressiveTextures) return;

      const structCanvas = createStructuralDiffuseCanvas(512);
      const structBumpCanvas = createConcreteBumpCanvas(512, true);

      const sCvs = progressiveCanvases.concreteStructural;
      sCvs.width = 512;
      sCvs.height = 512;
      sCvs.getContext('2d')!.drawImage(structCanvas, 0, 0);
      progressiveTextures.concreteStructural.needsUpdate = true;

      const sbCvs = progressiveCanvases.structuralBump;
      sbCvs.width = 512;
      sbCvs.height = 512;
      sbCvs.getContext('2d')!.drawImage(structBumpCanvas, 0, 0);
      progressiveTextures.structuralBump.needsUpdate = true;

      progressiveProgress = 70;
      notifyListeners();

      // Step 3: PIR maps & all Roughness maps (after 80ms)
      calculationTimer = setTimeout(() => {
        if (!progressiveCanvases || !progressiveTextures) return;

        const pirCanvas = createPIRDiffuseCanvas(512);
        const pirBumpCanvas = createPIRBumpCanvas(512);
        const concreteRoughCanvas = createRoughnessCanvas(512, 0.88);
        const structRoughCanvas = createRoughnessCanvas(512, 0.92);
        const pirRoughCanvas = createRoughnessCanvas(512, 0.82);

        const pCvs = progressiveCanvases.pirTexture;
        pCvs.width = 512;
        pCvs.height = 512;
        pCvs.getContext('2d')!.drawImage(pirCanvas, 0, 0);
        progressiveTextures.pirTexture.needsUpdate = true;

        const pbCvs = progressiveCanvases.pirBump;
        pbCvs.width = 512;
        pbCvs.height = 512;
        pbCvs.getContext('2d')!.drawImage(pirBumpCanvas, 0, 0);
        progressiveTextures.pirBump.needsUpdate = true;

        const crCvs = progressiveCanvases.concreteRoughness;
        crCvs.width = 512;
        crCvs.height = 512;
        crCvs.getContext('2d')!.drawImage(concreteRoughCanvas, 0, 0);
        progressiveTextures.concreteRoughness.needsUpdate = true;

        const srCvs = progressiveCanvases.structuralRoughness;
        srCvs.width = 512;
        srCvs.height = 512;
        srCvs.getContext('2d')!.drawImage(structRoughCanvas, 0, 0);
        progressiveTextures.structuralRoughness.needsUpdate = true;

        const prCvs = progressiveCanvases.pirRoughness;
        prCvs.width = 512;
        prCvs.height = 512;
        prCvs.getContext('2d')!.drawImage(pirRoughCanvas, 0, 0);
        progressiveTextures.pirRoughness.needsUpdate = true;

        progressiveProgress = 100;
        progressiveResolution = 512;
        progressiveStage = 'ready';
        isCalculating = false;
        notifyListeners();
      }, 80);
    }, 80);
  }, 120);
}

/**
 * Triggers a live recalculation / re-simulation of the progressive texture pipeline.
 * Immediately reverts textures to 32x32 blurred proxy and calculates the 512x512 maps in background.
 */
export function triggerProgressiveRecalculation(): void {
  if (calculationTimer) {
    clearTimeout(calculationTimer);
  }
  isCalculating = false;

  if (!progressiveCanvases || !progressiveTextures) {
    initProgressiveTextures();
  } else {
    const keys = Object.keys(TEXTURE_CONFIGS) as (keyof GeneratedTextures)[];
    keys.forEach((key) => {
      const cvs = progressiveCanvases![key];
      cvs.width = 32;
      cvs.height = 32;
      const lowRes = createLowResBlurredCanvas(key, 32);
      const ctx = cvs.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 32, 32);
        ctx.drawImage(lowRes, 0, 0);
      }
      progressiveTextures![key].needsUpdate = true;
    });
  }

  progressiveStage = 'low-res-blur';
  progressiveProgress = 0;
  progressiveResolution = 32;
  notifyListeners();

  startProgressiveBackgroundCalculation();
}

/**
 * React Hook providing progressive procedural textures with active stage and progress metrics.
 */
export function useProgressiveProceduralTextures(): ProgressiveTextureState {
  const [stage, setStage] = useState<ProgressiveTextureStage>(progressiveStage);
  const [progress, setProgress] = useState<number>(progressiveProgress);
  const [resolution, setResolution] = useState<number>(progressiveResolution);

  useEffect(() => {
    initProgressiveTextures();
    startProgressiveBackgroundCalculation();

    const listener: ProgressiveListener = (state) => {
      setStage(state.stage);
      setProgress(state.progress);
      setResolution(state.resolution);
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    textures: initProgressiveTextures(),
    stage,
    progress,
    resolution,
    isReady: stage === 'ready',
    recalculate: triggerProgressiveRecalculation,
  };
}

let cachedTextures: GeneratedTextures | null = null;

export function getProceduralTextures(): GeneratedTextures {
  if (progressiveTextures) return progressiveTextures;
  return initProgressiveTextures();
}

let cachedDataUrls: ProceduralTextureDataUrls | null = null;

/**
 * Returns pre-rendered data URLs for all procedural textures (diffuse, bump, roughness, noise).
 * Cached in memory to prevent regenerating canvas pixels on re-renders.
 */
export function getProceduralTextureDataUrls(): ProceduralTextureDataUrls {
  if (cachedDataUrls) return cachedDataUrls;

  const facadeCanvas = createFacadeDiffuseCanvas(512);
  const structuralCanvas = createStructuralDiffuseCanvas(512);
  const pirCanvas = createPIRDiffuseCanvas(512);

  const concreteBumpCanvas = createConcreteBumpCanvas(512, false);
  const structuralBumpCanvas = createConcreteBumpCanvas(512, true);
  const pirBumpCanvas = createPIRBumpCanvas(512);

  const concreteRoughCanvas = createRoughnessCanvas(512, 0.88);
  const structuralRoughCanvas = createRoughnessCanvas(512, 0.92);
  const pirRoughCanvas = createRoughnessCanvas(512, 0.82);

  cachedDataUrls = {
    concreteFacade: facadeCanvas.toDataURL('image/png'),
    concreteStructural: structuralCanvas.toDataURL('image/png'),
    pirTexture: pirCanvas.toDataURL('image/png'),

    concreteBump: concreteBumpCanvas.toDataURL('image/png'),
    structuralBump: structuralBumpCanvas.toDataURL('image/png'),
    pirBump: pirBumpCanvas.toDataURL('image/png'),

    concreteRoughness: concreteRoughCanvas.toDataURL('image/png'),
    structuralRoughness: structuralRoughCanvas.toDataURL('image/png'),
    pirRoughness: pirRoughCanvas.toDataURL('image/png'),
  };

  return cachedDataUrls;
}

/**
 * Preloads the progressive textures.
 * Initializes the instant 32px blurred proxy immediately, then starts background 512px calculation.
 */
export function preloadProceduralTextures(): void {
  if (typeof window === 'undefined') return;
  try {
    initProgressiveTextures();
    startProgressiveBackgroundCalculation();
  } catch (err) {
    console.warn('Preload progressive procedural textures warning:', err);
  }
}

