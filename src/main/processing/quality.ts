import sharp from "sharp";
import type { ProcessingSettings, QualityPreset } from "../../shared/types";

export interface FrameMetrics {
  sharpness: number;
  brightness: number;
  darkRatio: number;
  brightRatio: number;
  hash: string;
}

export interface QualityThresholds {
  minSharpness: number;
  minBrightness: number;
  maxBrightness: number;
  maxDarkRatio: number;
  maxBrightRatio: number;
  minHashDistance: number;
}

export interface FrameDecision {
  keep: boolean;
  reason?: "blur" | "exposure" | "duplicate";
}

const HASH_SIZE = 8;

export async function measureFrame(imagePath: string): Promise<FrameMetrics> {
  const grayscale = await sharp(imagePath)
    .greyscale()
    .resize(640, 640, { fit: "inside", withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = grayscale.data;
  const { width, height } = grayscale.info;
  let sum = 0;
  let dark = 0;
  let bright = 0;

  for (const value of pixels) {
    sum += value;
    if (value < 18) {
      dark += 1;
    }
    if (value > 238) {
      bright += 1;
    }
  }

  const brightness = sum / pixels.length;
  const sharpness = laplacianVariance(pixels, width, height);
  const hash = await differenceHash(imagePath);

  return {
    sharpness,
    brightness,
    darkRatio: dark / pixels.length,
    brightRatio: bright / pixels.length,
    hash,
  };
}

export function buildAdaptiveThresholds(
  metrics: FrameMetrics[],
  preset: QualityPreset,
): QualityThresholds {
  if (metrics.length === 0) {
    return presetThresholds(preset, 25);
  }

  const sharpnessValues = metrics.map((metric) => metric.sharpness).sort((a, b) => a - b);
  const medianSharpness = sharpnessValues[Math.floor(sharpnessValues.length / 2)] ?? 30;

  return presetThresholds(preset, medianSharpness);
}

export function decideFrame(
  metrics: FrameMetrics,
  thresholds: QualityThresholds,
  previousKeptHashes: string[],
  settings: ProcessingSettings,
): FrameDecision {
  if (settings.filterBlur && metrics.sharpness < thresholds.minSharpness) {
    return { keep: false, reason: "blur" };
  }

  if (
    settings.filterExposure &&
    (metrics.brightness < thresholds.minBrightness ||
      metrics.brightness > thresholds.maxBrightness ||
      metrics.darkRatio > thresholds.maxDarkRatio ||
      metrics.brightRatio > thresholds.maxBrightRatio)
  ) {
    return { keep: false, reason: "exposure" };
  }

  const isDuplicate = previousKeptHashes
    .slice(-4)
    .some((hash) => hammingDistance(hash, metrics.hash) < thresholds.minHashDistance);

  if (settings.filterDuplicates && isDuplicate) {
    return { keep: false, reason: "duplicate" };
  }

  return { keep: true };
}

export function hammingDistance(left: string, right: string): number {
  const length = Math.min(left.length, right.length);
  let distance = Math.abs(left.length - right.length);
  for (let index = 0; index < length; index += 1) {
    if (left[index] !== right[index]) {
      distance += 1;
    }
  }
  return distance;
}

function presetThresholds(preset: QualityPreset, medianSharpness: number): QualityThresholds {
  if (preset === "conservative") {
    return {
      minSharpness: Math.max(12, Math.min(55, medianSharpness * 0.32)),
      minBrightness: 25,
      maxBrightness: 235,
      maxDarkRatio: 0.82,
      maxBrightRatio: 0.62,
      minHashDistance: 4,
    };
  }

  if (preset === "aggressive") {
    return {
      minSharpness: Math.max(28, Math.min(100, medianSharpness * 0.62)),
      minBrightness: 45,
      maxBrightness: 215,
      maxDarkRatio: 0.55,
      maxBrightRatio: 0.32,
      minHashDistance: 11,
    };
  }

  return {
    minSharpness: Math.max(18, Math.min(80, medianSharpness * 0.45)),
    minBrightness: 35,
    maxBrightness: 225,
    maxDarkRatio: 0.7,
    maxBrightRatio: 0.45,
    minHashDistance: 7,
  };
}

function laplacianVariance(pixels: Buffer, width: number, height: number): number {
  const values: number[] = [];

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      const laplacian =
        pixels[index - width] +
        pixels[index - 1] +
        pixels[index + 1] +
        pixels[index + width] -
        4 * pixels[index];
      values.push(laplacian);
    }
  }

  if (values.length === 0) {
    return 0;
  }

  const mean = values.reduce((total, value) => total + value, 0) / values.length;
  return values.reduce((total, value) => total + (value - mean) ** 2, 0) / values.length;
}

async function differenceHash(imagePath: string): Promise<string> {
  const image = await sharp(imagePath)
    .greyscale()
    .resize(HASH_SIZE + 1, HASH_SIZE, { fit: "fill" })
    .raw()
    .toBuffer();

  let hash = "";
  for (let y = 0; y < HASH_SIZE; y += 1) {
    for (let x = 0; x < HASH_SIZE; x += 1) {
      const left = image[y * (HASH_SIZE + 1) + x];
      const right = image[y * (HASH_SIZE + 1) + x + 1];
      hash += left > right ? "1" : "0";
    }
  }
  return hash;
}
