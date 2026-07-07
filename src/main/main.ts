import { app, BrowserWindow, dialog, ipcMain, type OpenDialogOptions } from "electron";
import path from "node:path";
import { scanSourceFolder } from "./processing/fileDiscovery";
import { processSourceFolder } from "./processing/processor";
import type { ProcessingProgress, ProcessingSettings } from "../shared/types";

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 900,
    minHeight: 620,
    title: "RealityScan Frame Prep",
    backgroundColor: "#f6f5ef",
    webPreferences: {
      preload: path.join(__dirname, "../main/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    void mainWindow.loadURL(devServerUrl);
  } else {
    void mainWindow.loadFile(path.join(__dirname, "../../dist/index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("app:get-info", () => ({
  version: app.getVersion(),
}));

ipcMain.handle("folder:select", async () => {
  const options: OpenDialogOptions = {
    title: "Choose scan source folder",
    properties: ["openDirectory"],
  };
  const result = mainWindow
    ? await dialog.showOpenDialog(mainWindow, options)
    : await dialog.showOpenDialog(options);

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return scanSourceFolder(result.filePaths[0]);
});

ipcMain.handle("folder:scan", (_event, sourceFolder: string) => scanSourceFolder(sourceFolder));

ipcMain.handle("processing:run", async (event, sourceFolder: string, settings?: ProcessingSettings) => {
  const sendProgress = (progress: ProcessingProgress) => {
    event.sender.send("processing:progress", progress);
  };

  return processSourceFolder(sourceFolder, sendProgress, settings);
});
