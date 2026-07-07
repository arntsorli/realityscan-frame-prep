import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import type {
  ProcessingSettings,
  ProcessingProgress,
  ProcessingSummary,
  VideoProcessingSummary,
} from "../../shared/types";
import { DEFAULT_PROCESSING_SETTINGS } from "../../shared/types";
import { OUTPUT_FOLDER_NAME, TEMP_FOLDER_NAME } from "./constants";
import { extractCandidateFrames } from "./ffmpeg";
import { getOutputFolder, scanSourceFolder } from "./fileDiscovery";
import { frameOutputName } from "./naming";
import {
  buildAdaptiveThresholds,
  decideFrame,
  measureFrame,
} from "./quality";
import { writeReports } from "./report";

type ProgressSender = (progress: ProcessingProgress) => void;

export async function processSourceFolder(
  sourceFolder: string,
  sendProgress: ProgressSender,
  settingsInput?: ProcessingSettings,
): Promise<ProcessingSummary> {
  const settings = normalizeProcessingSettings(settingsInput);
  const startedAt = new Date().toISOString();
  const scan = await scanSourceFolder(sourceFolder);
  const outputFolder = getOutputFolder(sourceFolder);
  const warnings: string[] = [];

  sendProgress({ stage: "preparing", message: "Preparing output folder" });
  await recreateOutputFolder(sourceFolder, outputFolder);

  let copiedImages = 0;
  if (settings.copyStillImages) {
    sendProgress({
      stage: "copying-images",
      message: "Copying still images",
      current: 0,
      total: scan.images.length,
    });
    for (let index = 0; index < scan.images.length; index += 1) {
      const image = scan.images[index];
      await fs.copyFile(image.path, path.join(outputFolder, image.name));
      copiedImages += 1;
      sendProgress({
        stage: "copying-images",
        message: `Copied ${image.name}`,
        current: index + 1,
        total: scan.images.length,
      });
    }
  }

  const videoSummaries: VideoProcessingSummary[] = [];
  for (let index = 0; index < scan.videos.length; index += 1) {
    const video = scan.videos[index];
    sendProgress({
      stage: "extracting-video",
      message: `Extracting frames from ${video.name}`,
      current: index,
      total: scan.videos.length,
    });

    try {
      videoSummaries.push(
        await processVideo(video.path, video.name, outputFolder, sendProgress, settings),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      videoSummaries.push({
        source: video.name,
        extractedCandidates: 0,
        keptFrames: 0,
        rejectedBlur: 0,
        rejectedExposure: 0,
        rejectedDuplicate: 0,
        rejectedLimit: 0,
        warnings: [message],
      });
      warnings.push(`Skipped ${video.name}: ${message}`);
    }
  }

  const summary: ProcessingSummary = {
    sourceFolder,
    outputFolder,
    settings,
    copiedImages,
    videos: videoSummaries,
    warnings,
    startedAt,
    finishedAt: new Date().toISOString(),
  };

  sendProgress({ stage: "writing-report", message: "Writing reports" });
  await writeReports(summary);
  sendProgress({ stage: "complete", message: "Done" });

  return summary;
}

async function processVideo(
  videoPath: string,
  videoName: string,
  outputFolder: string,
  sendProgress: ProgressSender,
  settings: ProcessingSettings,
): Promise<VideoProcessingSummary> {
  const tempFolder = await fs.mkdtemp(path.join(os.tmpdir(), `${TEMP_FOLDER_NAME}-`));
  const warnings: string[] = [];

  try {
    const { framePaths, stderr } = await extractCandidateFrames(
      videoPath,
      tempFolder,
      settings.candidateFps,
    );
    if (stderr.trim().length > 0) {
      warnings.push(stderr.trim());
    }

    sendProgress({
      stage: "analyzing-video",
      message: `Analyzing ${videoName}`,
      current: 0,
      total: framePaths.length,
    });

    const metrics = [];
    for (const framePath of framePaths) {
      metrics.push(await measureFrame(framePath));
    }

    const thresholds = buildAdaptiveThresholds(metrics, settings.qualityPreset);
    const keptHashes: string[] = [];
    let keptFrames = 0;
    let rejectedBlur = 0;
    let rejectedExposure = 0;
    let rejectedDuplicate = 0;
    let rejectedLimit = 0;

    for (let index = 0; index < framePaths.length; index += 1) {
      if (settings.maxFramesPerVideo > 0 && keptFrames >= settings.maxFramesPerVideo) {
        rejectedLimit += 1;
        sendProgress({
          stage: "analyzing-video",
          message: `Analyzed ${videoName}`,
          current: index + 1,
          total: framePaths.length,
        });
        continue;
      }

      const decision = decideFrame(metrics[index], thresholds, keptHashes, settings);
      if (decision.keep) {
        keptFrames += 1;
        keptHashes.push(metrics[index].hash);
        await fs.copyFile(framePaths[index], path.join(outputFolder, frameOutputName(videoName, index + 1)));
      } else if (decision.reason === "blur") {
        rejectedBlur += 1;
      } else if (decision.reason === "exposure") {
        rejectedExposure += 1;
      } else if (decision.reason === "duplicate") {
        rejectedDuplicate += 1;
      }

      sendProgress({
        stage: "analyzing-video",
        message: `Analyzed ${videoName}`,
        current: index + 1,
        total: framePaths.length,
      });
    }

    if (keptFrames === 0 && framePaths.length > 0) {
      warnings.push("No frames passed quality filters. Try better light or slower movement.");
    }

    return {
      source: videoName,
      extractedCandidates: framePaths.length,
      keptFrames,
      rejectedBlur,
      rejectedExposure,
      rejectedDuplicate,
      rejectedLimit,
      warnings,
    };
  } finally {
    await fs.rm(tempFolder, { recursive: true, force: true });
  }
}

export async function recreateOutputFolder(
  sourceFolder: string,
  outputFolder: string,
): Promise<void> {
  const resolvedSource = path.resolve(sourceFolder);
  const resolvedOutput = path.resolve(outputFolder);

  if (
    path.basename(resolvedOutput) !== OUTPUT_FOLDER_NAME ||
    path.dirname(resolvedOutput) !== resolvedSource
  ) {
    throw new Error("Refusing to delete output folder outside the selected source folder.");
  }

  await fs.rm(resolvedOutput, { recursive: true, force: true });
  await fs.mkdir(resolvedOutput, { recursive: true });
}

function normalizeProcessingSettings(settings?: ProcessingSettings): ProcessingSettings {
  return {
    ...DEFAULT_PROCESSING_SETTINGS,
    ...settings,
    candidateFps: clampInteger(settings?.candidateFps, 1, 10, DEFAULT_PROCESSING_SETTINGS.candidateFps),
    maxFramesPerVideo: clampInteger(
      settings?.maxFramesPerVideo,
      0,
      5000,
      DEFAULT_PROCESSING_SETTINGS.maxFramesPerVideo,
    ),
  };
}

function clampInteger(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  if (value === undefined || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.round(value)));
}
