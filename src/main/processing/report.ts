import fs from "node:fs/promises";
import path from "node:path";
import type { ProcessingSummary } from "../../shared/types";

export async function writeReports(summary: ProcessingSummary): Promise<void> {
  await fs.writeFile(
    path.join(summary.outputFolder, "report.json"),
    JSON.stringify(summary, null, 2),
    "utf8",
  );

  await fs.writeFile(path.join(summary.outputFolder, "report.html"), renderHtml(summary), "utf8");
}

function renderHtml(summary: ProcessingSummary): string {
  const videoRows = summary.videos
    .map(
      (video) => `<tr>
        <td>${escapeHtml(video.source)}</td>
        <td>${video.extractedCandidates}</td>
        <td>${video.keptFrames}</td>
        <td>${video.rejectedBlur}</td>
        <td>${video.rejectedExposure}</td>
        <td>${video.rejectedDuplicate}</td>
        <td>${video.rejectedLimit}</td>
        <td>${escapeHtml(video.warnings.join("; "))}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>RealityScan Frame Prep Report</title>
  <style>
    body { font-family: Segoe UI, Arial, sans-serif; margin: 32px; color: #20231f; background: #f8f7f1; }
    h1 { margin-bottom: 4px; }
    table { border-collapse: collapse; width: 100%; background: white; }
    th, td { border: 1px solid #d7d5ca; padding: 8px 10px; text-align: left; }
    th { background: #ece8d8; }
    .meta { color: #5f6258; }
    .warning { color: #8a4b00; }
  </style>
</head>
<body>
  <h1>RealityScan Frame Prep Report</h1>
  <p class="meta">Source: ${escapeHtml(summary.sourceFolder)}</p>
  <p class="meta">Output: ${escapeHtml(summary.outputFolder)}</p>
  <p class="meta">Settings: ${escapeHtml(renderSettings(summary.settings))}</p>
  <p>Copied still images: <strong>${summary.copiedImages}</strong></p>
  ${
    summary.warnings.length > 0
      ? `<p class="warning">${escapeHtml(summary.warnings.join(" "))}</p>`
      : ""
  }
  <table>
    <thead>
      <tr>
        <th>Video</th>
        <th>Candidates</th>
        <th>Kept</th>
        <th>Blur rejects</th>
        <th>Exposure rejects</th>
        <th>Duplicate rejects</th>
        <th>Limit rejects</th>
        <th>Warnings</th>
      </tr>
    </thead>
    <tbody>${videoRows}</tbody>
  </table>
</body>
</html>`;
}

function renderSettings(settings: import("../../shared/types").ProcessingSettings): string {
  return [
    `preset=${settings.qualityPreset}`,
    `fps=${settings.candidateFps}`,
    `copyStillImages=${settings.copyStillImages}`,
    `blur=${settings.filterBlur}`,
    `exposure=${settings.filterExposure}`,
    `duplicates=${settings.filterDuplicates}`,
    `maxFramesPerVideo=${settings.maxFramesPerVideo || "none"}`,
  ].join(", ");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
