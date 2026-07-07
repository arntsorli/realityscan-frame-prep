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
    expect(scan.outputFolder).toBe(getOutputFolder(tempDir));
  });
});
