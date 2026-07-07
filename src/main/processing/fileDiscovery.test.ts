import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getOutputFolder, scanSourceFolder } from "./fileDiscovery";

let tempDir: string;

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "rsfp-discovery-"));
});

afterEach(async () => {
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe("scanSourceFolder", () => {
  it("classifies supported top-level files and ignores folders", async () => {
    await fs.writeFile(path.join(tempDir, "photo.JPG"), "image");
    await fs.writeFile(path.join(tempDir, "clip.mp4"), "video");
    await fs.writeFile(path.join(tempDir, "notes.txt"), "notes");
    await fs.mkdir(path.join(tempDir, "nested"));
    await fs.writeFile(path.join(tempDir, "nested", "inside.jpg"), "image");

    const scan = await scanSourceFolder(tempDir);

    expect(scan.images.map((file) => file.name)).toEqual(["photo.JPG"]);
    expect(scan.videos.map((file) => file.name)).toEqual(["clip.mp4"]);
    expect(scan.unsupportedCount).toBe(1);
    expect(scan.unsupportedFiles.map((file) => file.name)).toEqual(["notes.txt"]);
    expect(scan.hasExistingOutput).toBe(false);
    expect(scan.outputFolder).toBe(getOutputFolder(tempDir));
  });

  it("ignores common hidden metadata files instead of reporting unsupported files", async () => {
    await fs.writeFile(path.join(tempDir, "photo.jpg"), "image");
    await fs.writeFile(path.join(tempDir, "desktop.ini"), "metadata");
    await fs.writeFile(path.join(tempDir, "Thumbs.db"), "metadata");
    await fs.writeFile(path.join(tempDir, ".DS_Store"), "metadata");
    await fs.writeFile(path.join(tempDir, "._photo.jpg"), "metadata");

    const scan = await scanSourceFolder(tempDir);

    expect(scan.images.map((file) => file.name)).toEqual(["photo.jpg"]);
    expect(scan.unsupportedCount).toBe(0);
    expect(scan.unsupportedFiles).toEqual([]);
  });

  it("detects an existing generated output folder without counting its contents", async () => {
    await fs.mkdir(path.join(tempDir, "realityscan_result"));
    await fs.writeFile(path.join(tempDir, "realityscan_result", "old.jpg"), "image");

    const scan = await scanSourceFolder(tempDir);

    expect(scan.hasExistingOutput).toBe(true);
    expect(scan.images).toEqual([]);
    expect(scan.videos).toEqual([]);
    expect(scan.unsupportedCount).toBe(0);
    expect(scan.unsupportedFiles).toEqual([]);
  });
});
