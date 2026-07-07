# TODO

## Project State

- Local repo: `C:\Repos\realityscan-frame-prep`
- GitHub repo: `https://github.com/arntsorli/realityscan-frame-prep`
- Current app: Electron + React + TypeScript + bundled ffmpeg + sharp
- CI: GitHub Actions Windows build and versioned release publishing are active
- Output folder: `<source>\realityscan_result`

## Next Priorities

- [ ] Test with real Samsung S26 Ultra footage from:
  - a 360 object scan
  - a 180 area scan
  - at least one poor-light or fast-movement clip
- [ ] Tune the advanced processing defaults from real scan results, especially preset thresholds and duplicate rejection.
- [ ] Persist the last used advanced processing settings between app launches.
- [ ] Add cancellation support while processing long videos.
- [ ] Add an `Open result folder` button after a successful run.
- [ ] Add a link from the app version label to the GitHub releases page.
- [ ] Add a lightweight review screen for kept/rejected frame samples.
- [ ] Add a custom app icon before sharing builds more broadly.

## Later Ideas

- [ ] Optional recursive folder scanning.
- [ ] Per-video setting overrides for mixed-quality capture sessions.
- [ ] A small sample dataset or demo video for regression testing.

## Useful Commands

```powershell
cd C:\Repos\realityscan-frame-prep
npm install
npm run dev
npm run ci
npm run build
```
