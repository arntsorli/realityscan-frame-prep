# TODO / Resume Context

## Current State

- Local repo: `C:\Repos\realityscan-frame-prep`
- GitHub repo: `https://github.com/arntsorli/realityscan-frame-prep`
- App stack: Electron + React + TypeScript + Vite
- Processing stack: bundled `@ffmpeg-installer/ffmpeg` + `sharp`
- Output folder: `realityscan_result`
- Local checks passed:
  - `npm run ci`
  - `npm audit --audit-level=high`
  - `npm run build`
- Smoke test passed with a generated MP4 and still image.

## Completed

- [x] Create independent repo under `C:\Repos`.
- [x] Add Electron/Vite/React/TypeScript scaffold.
- [x] Add secure Electron preload IPC.
- [x] Add source folder picker and run UI.
- [x] Detect supported videos and still images.
- [x] Safely delete/recreate only `<source>\realityscan_result`.
- [x] Copy still images.
- [x] Extract candidate video frames.
- [x] Filter frames for blur, exposure, and near-duplicates.
- [x] Generate `report.html` and `report.json`.
- [x] Add README, MIT license, tests, lint, and build config.
- [x] Publish public GitHub repo.

## Remaining / Follow-Up

- [ ] Enable GitHub Actions CI remotely.
  - GitHub rejected pushing `.github/workflows/windows.yml` because the current auth token lacks `workflow` scope.
  - Template is tracked at `docs/github-actions-windows.yml`.
  - After refreshing GitHub auth with `workflow` scope, copy or move it to `.github/workflows/windows.yml`, commit, and push.
- [ ] Add a custom app icon.
- [ ] Add optional processing presets, such as conservative, balanced, and aggressive.
- [ ] Add cancellation support for long videos.
- [ ] Add recursive folder scanning as an opt-in.
- [ ] Add an in-app preview of selected/rejected frames.
- [ ] Test with real Samsung S26 Ultra footage and tune thresholds.

## Useful Commands

```powershell
cd C:\Repos\realityscan-frame-prep
npm install
npm run dev
npm run ci
npm run build
```

To enable remote CI after granting workflow scope:

```powershell
cd C:\Repos\realityscan-frame-prep
New-Item -ItemType Directory -Force .github\workflows
Copy-Item docs\github-actions-windows.yml .github\workflows\windows.yml
git add .github\workflows\windows.yml
git commit -m "Add Windows build workflow"
git push
```
