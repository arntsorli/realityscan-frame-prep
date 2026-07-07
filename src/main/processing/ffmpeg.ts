import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { CANDIDATE_FPS } from "./constants";

export interface ExtractFramesResult {
  framePaths: string[];
  stderr: string;
}

function getFfmpegPath(): string {
  return ffmpegInstaller.path.replace("app.asar", "app.asar.unpacked");
}

export async function assertFfmpegAvailable(): Promise<string> {
  const ffmpegPath = getFfmpegPath();
  await fs.access(ffmpegPath);
  return ffmpegPath;
}

export async function extractCandidateFrames(
  videoPath: string,
  outputFolder: string,
): Promise<ExtractFramesResult> {
  await fs.mkdir(outputFolder, { recursive: true });
  const outputPattern = path.join(outputFolder, "candidate_%06d.jpg");
  const ffmpegPath = await assertFfmpegAvailable();

  const args = [
    "-hide_banner",
    "-loglevel",
    "warning",
    "-i",
    videoPath,
    "-vf",
    `fps=${CANDIDATE_FPS}`,
    "-q:v",
    "2",
    outputPattern,
  ];

  const stderr = await new Promise<string>((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { windowsHide: true });
    let errorOutput = "";

    child.stderr.on("data", (chunk: Buffer) => {
      errorOutput += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(errorOutput);
      } else {
        reject(new Error(`ffmpeg exited with code ${code}: ${errorOutput.trim()}`));
      }
    });
  });

  const frameNames = await fs.readdir(outputFolder);
  return {
    framePaths: frameNames
      .filter((name) => /^candidate_\d+\.jpg$/i.test(name))
      .sort()
      .map((name) => path.join(outputFolder, name)),
    stderr,
  };
}
