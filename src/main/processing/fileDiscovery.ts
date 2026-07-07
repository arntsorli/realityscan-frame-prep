import fs from "node:fs/promises";
import path from "node:path";
import type { FolderScan, SourceFile } from "../../shared/types";
import {
  ignoredMetadataFilenames,
  OUTPUT_FOLDER_NAME,
  supportedImageExtensions,
  supportedVideoExtensions,
} from "./constants";

function toSourceFile(folder: string, name: string): SourceFile {
  return {
    path: path.join(folder, name),
    name,
    extension: path.extname(name).toLowerCase(),
  };
}

export function getOutputFolder(sourceFolder: string): string {
  return path.join(sourceFolder, OUTPUT_FOLDER_NAME);
}

export async function scanSourceFolder(sourceFolder: string): Promise<FolderScan> {
  const entries = await fs.readdir(sourceFolder, { withFileTypes: true });
  const images: SourceFile[] = [];
  const videos: SourceFile[] = [];
  const unsupportedFiles: SourceFile[] = [];
  let hasExistingOutput = false;

  for (const entry of entries) {
    if (entry.name === OUTPUT_FOLDER_NAME) {
      hasExistingOutput = true;
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (isIgnoredMetadataFile(entry.name)) {
      continue;
    }

    const sourceFile = toSourceFile(sourceFolder, entry.name);
    if (supportedImageExtensions.has(sourceFile.extension)) {
      images.push(sourceFile);
    } else if (supportedVideoExtensions.has(sourceFile.extension)) {
      videos.push(sourceFile);
    } else {
      unsupportedFiles.push(sourceFile);
    }
  }

  const sortedUnsupportedFiles = unsupportedFiles.sort((a, b) => a.name.localeCompare(b.name));

  return {
    sourceFolder,
    outputFolder: getOutputFolder(sourceFolder),
    hasExistingOutput,
    images: images.sort((a, b) => a.name.localeCompare(b.name)),
    videos: videos.sort((a, b) => a.name.localeCompare(b.name)),
    unsupportedFiles: sortedUnsupportedFiles,
    unsupportedCount: sortedUnsupportedFiles.length,
  };
}

function isIgnoredMetadataFile(name: string): boolean {
  const normalized = name.toLowerCase();
  return ignoredMetadataFilenames.has(normalized) || normalized.startsWith("._");
}
