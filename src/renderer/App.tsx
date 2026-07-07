import { useEffect, useMemo, useState } from "react";
import type {
  FolderScan,
  ProcessingProgress,
  ProcessingSummary,
} from "../shared/types";

const initialProgress: ProcessingProgress = {
  stage: "idle",
  message: "Choose a source folder to begin.",
};

export function App() {
  const [scan, setScan] = useState<FolderScan | null>(null);
  const [progress, setProgress] = useState<ProcessingProgress>(initialProgress);
  const [summary, setSummary] = useState<ProcessingSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    return window.realityScanFramePrep.onProgress(setProgress);
  }, []);

  const totalInputs = useMemo(() => {
    if (!scan) {
      return 0;
    }
    return scan.images.length + scan.videos.length;
  }, [scan]);

  const unsupportedTooltip = useMemo(() => {
    if (!scan || scan.unsupportedFiles.length === 0) {
      return "No unsupported files found.";
    }

    return `Unsupported files:\n${scan.unsupportedFiles.map((file) => file.name).join("\n")}`;
  }, [scan]);

  async function chooseFolder() {
    setError(null);
    setSummary(null);
    const selected = await window.realityScanFramePrep.selectSourceFolder();
    if (selected) {
      setScan(selected);
      setProgress({
        stage: "idle",
        message: "Ready to prepare RealityScan images.",
      });
    }
  }

  async function runProcessing() {
    if (!scan) {
      return;
    }

    setError(null);
    setSummary(null);
    setIsRunning(true);
    try {
      const result = await window.realityScanFramePrep.runProcessing(scan.sourceFolder);
      setSummary(result);
      const refreshed = await window.realityScanFramePrep.scanFolder(scan.sourceFolder);
      setScan(refreshed);
    } catch (caught) {
      setProgress({ stage: "error", message: "Processing failed" });
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsRunning(false);
    }
  }

  const progressPercent =
    progress.current !== undefined && progress.total
      ? Math.round((progress.current / progress.total) * 100)
      : undefined;

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Local photogrammetry prep</p>
            <h1>RealityScan Frame Prep</h1>
          </div>
          <button className="primary-button" onClick={chooseFolder} disabled={isRunning}>
            Choose folder
          </button>
        </header>

        <section className="panel">
          <div className="folder-grid">
            <InfoBlock label="Source" value={scan?.sourceFolder ?? "No folder selected"} />
            <InfoBlock label="Output" value={scan?.outputFolder ?? "realityscan_result"} />
          </div>

          <div className="stats-row">
            <Stat label="Still images" value={scan?.images.length ?? 0} />
            <Stat label="Videos" value={scan?.videos.length ?? 0} />
            <Stat label="Unsupported" value={scan?.unsupportedCount ?? 0} title={unsupportedTooltip} />
            <Stat label="Total inputs" value={totalInputs} />
          </div>

          <div className="run-row">
            <button
              className="run-button"
              onClick={runProcessing}
              disabled={!scan || totalInputs === 0 || isRunning}
            >
              {isRunning ? "Processing..." : "Prepare RealityScan folder"}
            </button>
            {scan?.hasExistingOutput ? <OverwriteWarningIcon /> : null}
          </div>
        </section>

        <section className="panel progress-panel">
          <div className="progress-heading">
            <div>
              <p className="eyebrow">Status</p>
              <h2>{progress.message}</h2>
            </div>
            {progressPercent !== undefined ? <span>{progressPercent}%</span> : null}
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progressPercent ?? (isRunning ? 12 : 0)}%` }}
            />
          </div>
          {error ? <p className="error-text">{error}</p> : null}
        </section>

        {summary ? <SummaryPanel summary={summary} /> : null}
      </section>
    </main>
  );
}

function OverwriteWarningIcon() {
  const warningText =
    "Existing realityscan_result inside the selected folder will be deleted before processing.";

  return (
    <span className="overwrite-warning-icon" title={warningText} aria-label={warningText}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 3.2 22 20H2L12 3.2Z" />
        <path d="M12 8.4v5.2" />
        <path d="M12 17.2h.01" />
      </svg>
    </span>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-block">
      <span>{label}</span>
      <p title={value}>{value}</p>
    </div>
  );
}

function Stat({ label, value, title }: { label: string; value: number; title?: string }) {
  return (
    <div className="stat" title={title}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function SummaryPanel({ summary }: { summary: ProcessingSummary }) {
  const kept = summary.videos.reduce((total, video) => total + video.keptFrames, 0);
  const candidates = summary.videos.reduce(
    (total, video) => total + video.extractedCandidates,
    0,
  );

  return (
    <section className="panel">
      <div className="progress-heading">
        <div>
          <p className="eyebrow">Result</p>
          <h2>Ready for RealityScan import</h2>
        </div>
      </div>
      <div className="stats-row">
        <Stat label="Copied stills" value={summary.copiedImages} />
        <Stat label="Candidate frames" value={candidates} />
        <Stat label="Kept frames" value={kept} />
        <Stat label="Warnings" value={summary.warnings.length} />
      </div>
      <div className="video-list">
        {summary.videos.map((video) => (
          <div className="video-row" key={video.source}>
            <div>
              <strong>{video.source}</strong>
              <span>
                Kept {video.keptFrames} of {video.extractedCandidates} frames
              </span>
            </div>
            <span>
              Blur {video.rejectedBlur} · Exposure {video.rejectedExposure} · Duplicate{" "}
              {video.rejectedDuplicate}
            </span>
          </div>
        ))}
      </div>
      {summary.warnings.length > 0 ? (
        <div className="warning">{summary.warnings.join(" ")}</div>
      ) : null}
    </section>
  );
}
