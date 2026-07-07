import path from "node:path";

export function sanitizeFilenameBase(input: string): string {
  const parsed = path.parse(input);
  return (
    parsed.name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w.-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 90) || "source"
  );
}

export function frameOutputName(videoName: string, frameNumber: number): string {
  return `${sanitizeFilenameBase(videoName)}_f${String(frameNumber).padStart(6, "0")}.jpg`;
}
