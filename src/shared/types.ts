export type SupportedImageExtension =
  | ".jpg"
  | ".jpeg"
  | ".png"
  | ".webp"
  | ".tif"
  | ".tiff";

export type SupportedVideoExtension =
  | ".mp4"
  | ".mov"
  | ".m4v"
  | ".avi"
  | ".mkv";

export interface SourceFile {
  path: string;
  name: string;
  extension: string;
}

export interface FolderScan {
  sourceFolder: string;
  outputFolder: string;
  hasExistingOutput: boolean;
  images: SourceFile[];
  videos: SourceFile[];
  unsupportedFiles: SourceFile[];
  unsupportedCount: number;
}

export type ProgressStage =
  | "idle"
  | "preparing"
  | "copying-images"
  | "extracting-video"
  | "analyzing-video"
  | "writing-report"
  | "complete"
  | "error";

export interface ProcessingProgress {
  stage: ProgressStage;
  message: string;
  current?: number;
  total?: number;
}

export interface VideoProcessingSummary {
  source: string;
  extractedCandidates: number;
  keptFrames: number;
  rejectedBlur: number;
  rejectedExposure: number;
  rejectedDuplicate: number;
  warnings: string[];
}

export interface ProcessingSummary {
  sourceFolder: string;
  outputFolder: string;
  copiedImages: number;
  videos: VideoProcessingSummary[];
  warnings: string[];
  startedAt: string;
  finishedAt: string;
}

export interface RealityScanFramePrepApi {
  selectSourceFolder: () => Promise<FolderScan | null>;
  scanFolder: (sourceFolder: string) => Promise<FolderScan>;
  runProcessing: (sourceFolder: string) => Promise<ProcessingSummary>;
  onProgress: (callback: (progress: ProcessingProgress) => void) => () => void;
}

declare global {
  interface Window {
    realityScanFramePrep: RealityScanFramePrepApi;
  }
}
