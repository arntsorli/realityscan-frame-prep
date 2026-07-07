import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { recreateOutputFolder } from "./processor";

let tempDir: string;

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "rsfp-processor-"));
});

afterEach(async () => {
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe("recreateOutputFolder", () => {
  it("deletes and recreates the generated output folder", async () => {
    const outputFolder = path.join(tempDir, "realityscan_result");
    await fs.mkdir(outputFolder);
    await fs.writeFile(path.join(outputFolder, "old.txt"), "old");

    await recreateOutputFolder(tempDir, outputFolder);

    await expect(fs.access(outputFolder)).resolves.toBeUndefined();
    await expect(fs.access(path.join(outputFolder, "old.txt"))).rejects.toThrow();
  });

  it("refuses to delete folders outside the selected source", async () => {
    const unsafeFolder = path.join(os.tmpdir(), "realityscan_result");

    await expect(recreateOutputFolder(tempDir, unsafeFolder)).rejects.toThrow(
      "Refusing to delete output folder",
    );
  });
});
