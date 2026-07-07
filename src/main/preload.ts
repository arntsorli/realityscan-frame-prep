import { contextBridge, ipcRenderer } from "electron";
import type {
  FolderScan,
  ProcessingProgress,
  ProcessingSettings,
  ProcessingSummary,
  RealityScanFramePrepApi,
} from "../shared/types";

const api: RealityScanFramePrepApi = {
  selectSourceFolder: () => ipcRenderer.invoke("folder:select") as Promise<FolderScan | null>,
  scanFolder: (sourceFolder: string) =>
    ipcRenderer.invoke("folder:scan", sourceFolder) as Promise<FolderScan>,
  runProcessing: (sourceFolder: string, settings?: ProcessingSettings) =>
    ipcRenderer.invoke("processing:run", sourceFolder, settings) as Promise<ProcessingSummary>,
  onProgress: (callback: (progress: ProcessingProgress) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, progress: ProcessingProgress) => {
      callback(progress);
    };
    ipcRenderer.on("processing:progress", listener);
    return () => ipcRenderer.removeListener("processing:progress", listener);
  },
};

contextBridge.exposeInMainWorld("realityScanFramePrep", api);
