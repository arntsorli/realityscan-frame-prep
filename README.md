# RealityScan Frame Prep

Windows desktop app for preparing Samsung phone videos and still images for RealityScan.

The app creates a clean `realityscan_result` folder from a selected source folder. It copies existing still images, extracts frames from videos, filters weak frames, and writes a report so the folder can be imported into RealityScan as ordinary images.

## Why

RealityScan can import video, but Windows codec issues and low-quality frames can make alignment harder than it needs to be. This tool keeps the process local and prepares a smaller, cleaner image set for photogrammetry.

## Features

- Local-only processing.
- Folder picker UI.
- Fixed output folder: `realityscan_result`.
- Deletes and recreates only the generated output folder on each run.
- Copies still images: `.jpg`, `.jpeg`, `.png`, `.webp`, `.tif`, `.tiff`.
- Processes videos: `.mp4`, `.mov`, `.m4v`, `.avi`, `.mkv`.
- Extracts candidate frames with bundled ffmpeg.
- Filters frames for blur, exposure problems, and near-duplicates.
- Writes `report.html` and `report.json`.

## Capture Recommendations

For Samsung S26 Ultra photogrammetry footage:

- Use the 1x main camera.
- Use 4K 30 fps as the default.
- Use bright, even light.
- Turn off HDR video, Log video, APV, Auto FPS, and Super steady.
- Move physically around the object or area; do not just pan from one spot.
- Move slowly to reduce motion blur.
- Take extra still photos of critical surfaces that must fit a Fusion 360 part.

## Usage

1. Open the app.
2. Choose a source folder containing videos and/or still images.
3. Review the detected file counts.
4. Run the prep process.
5. Import the generated `realityscan_result` folder into RealityScan.

RealityScan does not require special filenames for alignment. This app names extracted frames like `videoName_f000123.jpg` so problem frames are easier to trace back.

## Development

Requirements:

- Windows
- Node.js 22+
- npm

Install dependencies:

```powershell
npm install
```

Run in development:

```powershell
npm run dev
```

Run checks:

```powershell
npm run ci
```

Build a Windows portable app:

```powershell
npm run build
```

Build output is written to `release/`.

## CI

The Windows GitHub Actions workflow template is tracked at `docs/github-actions-windows.yml`.

The intended live path is `.github/workflows/windows.yml`, but GitHub requires the authenticated token to have `workflow` scope before a workflow can be pushed. See `TODO.md` for the exact follow-up command sequence.

## Project Tasks

1. Repo setup under `C:\Repos\realityscan-frame-prep`.
2. Electron + Vite + React + TypeScript scaffold.
3. Secure Electron main/preload IPC.
4. Folder picker and processing UI.
5. File discovery and safe output folder handling.
6. Bundled ffmpeg frame extraction.
7. Image quality filtering.
8. Result folder and report generation.
9. Unit tests and build checks.
10. GitHub Actions Windows build artifact.
11. Public GitHub repo publish.

## Limitations

- Windows-only v1.
- Top-level files only; no recursive scanning.
- Does not automate RealityScan itself.
- Filtering is a practical heuristic, not a guarantee of perfect RealityScan alignment.

## Privacy

Processing happens locally on your machine. The app does not upload source videos, images, frames, reports, or file paths.
