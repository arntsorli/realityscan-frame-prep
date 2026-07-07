import { useEffect, useMemo, useState } from "react";
import type {
  AppInfo,
  FolderScan,
  ProcessingProgress,
  ProcessingSettings,
  ProcessingSummary,
} from "../shared/types";
import { DEFAULT_PROCESSING_SETTINGS } from "../shared/types";
import appIcon from "./assets/app-icon.png";

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
  const [settings, setSettings] = useState<ProcessingSettings>(DEFAULT_PROCESSING_SETTINGS);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    return window.realityScanFramePrep.onProgress(setProgress);
  }, []);

  useEffect(() => {
    void window.realityScanFramePrep.getAppInfo().then(setAppInfo);
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
      const result = await window.realityScanFramePrep.runProcessing(scan.sourceFolder, settings);
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
          <div className="brand-row">
            <img className="app-icon" src={appIcon} alt="" aria-hidden="true" />
            <div>
              <p className="eyebrow">Local photogrammetry prep</p>
              <h1>RealityScan Frame Prep</h1>
              {appInfo ? <p className="version-label">Version {appInfo.version}</p> : null}
            </div>
          </div>
          <button
            className="primary-button"
            type="button"
            onClick={chooseFolder}
            disabled={isRunning}
          >
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
            <Stat
              label="Unsupported"
              value={scan?.unsupportedCount ?? 0}
              title={unsupportedTooltip}
            />
            <Stat label="Total inputs" value={totalInputs} />
          </div>

          <AdvancedSettings settings={settings} onChange={setSettings} disabled={isRunning} />

          <div className="run-row">
            <button
              className="run-button"
              type="button"
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
    <span
      className="overwrite-warning-icon"
      role="img"
      title={warningText}
      aria-label={warningText}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 3.2 22 20H2L12 3.2Z" />
        <path d="M12 8.4v5.2" />
        <path d="M12 17.2h.01" />
      </svg>
    </span>
  );
}

function AdvancedSettings({
  settings,
  onChange,
  disabled,
}: {
  settings: ProcessingSettings;
  onChange: (settings: ProcessingSettings) => void;
  disabled: boolean;
}) {
  function update<K extends keyof ProcessingSettings>(key: K, value: ProcessingSettings[K]) {
    onChange({ ...settings, [key]: value });
  }

  return (
    <details className="advanced-settings">
      <summary>
        <span>Advanced processing</span>
        <small>{settingsLabel(settings)}</small>
      </summary>

      <div className="advanced-grid">
        <label className="field">
          <span>Preset</span>
          <select
            value={settings.qualityPreset}
            onChange={(event) =>
              update("qualityPreset", event.target.value as ProcessingSettings["qualityPreset"])
            }
            disabled={disabled}
          >
            <option value="conservative">Conservative - keep more frames</option>
            <option value="balanced">Balanced - default</option>
            <option value="aggressive">Aggressive - fewer frames</option>
          </select>
        </label>

        <label className="field">
          <span>Extract FPS</span>
          <input
            type="number"
            min={1}
            max={10}
            value={settings.candidateFps}
            onChange={(event) => update("candidateFps", Number(event.target.value))}
            disabled={disabled}
          />
        </label>

        <label className="field">
          <span>Max frames per video</span>
          <input
            type="number"
            min={0}
            max={5000}
            value={settings.maxFramesPerVideo}
            onChange={(event) => update("maxFramesPerVideo", Number(event.target.value))}
            disabled={disabled}
          />
        </label>

        <div className="toggle-list">
          <Toggle
            label="Copy still images"
            checked={settings.copyStillImages}
            disabled={disabled}
            onChange={(checked) => update("copyStillImages", checked)}
          />
          <Toggle
            label="Reject blurry frames"
            checked={settings.filterBlur}
            disabled={disabled}
            onChange={(checked) => update("filterBlur", checked)}
          />
          <Toggle
            label="Reject bad exposure"
            checked={settings.filterExposure}
            disabled={disabled}
            onChange={(checked) => update("filterExposure", checked)}
          />
          <Toggle
            label="Reject near duplicates"
            checked={settings.filterDuplicates}
            disabled={disabled}
            onChange={(checked) => update("filterDuplicates", checked)}
          />
        </div>
      </div>
    </details>
  );
}

function Toggle({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function settingsLabel(settings: ProcessingSettings): string {
  const maxFrames = settings.maxFramesPerVideo > 0 ? `, max ${settings.maxFramesPerVideo}` : "";
  return `${settings.qualityPreset}, ${settings.candidateFps} fps${maxFrames}`;
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
  const candidates = summary.videos.reduce((total, video) => total + video.extractedCandidates, 0);

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
              Blur {video.rejectedBlur} - Exposure {video.rejectedExposure} - Duplicate{" "}
              {video.rejectedDuplicate} - Limit {video.rejectedLimit}
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
