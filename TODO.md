# TODO

## Project State

- Local repo: `C:\Repos\realityscan-frame-prep`
- GitHub repo: `https://github.com/arntsorli/realityscan-frame-prep`
- Current app: Electron + React + TypeScript + bundled ffmpeg + sharp
- CI: GitHub Actions Windows build is active and passing
- Output folder: `<source>\realityscan_result`

## Next Priorities

- [ ] Test with real Samsung S26 Ultra footage from:
  - a 360 object scan
  - a 180 area scan
  - at least one poor-light or fast-movement clip
- [ ] Tune the frame filtering thresholds from real scan results, especially blur and near-duplicate rejection.
- [ ] Add processing presets:
  - `Conservative`: keeps more frames for difficult alignment
  - `Balanced`: current default
  - `Aggressive`: fewer frames for faster RealityScan imports
- [ ] Add cancellation support while processing long videos.
- [ ] Add an `Open result folder` button after a successful run.
- [ ] Add a lightweight review screen for kept/rejected frame samples.
- [ ] Add a custom app icon before sharing builds more broadly.

## Later Ideas

- [ ] Optional recursive folder scanning.
- [ ] Per-video settings such as extraction FPS and max kept frames.
- [ ] A small sample dataset or demo video for regression testing.
- [ ] A tagged release workflow once the app has been tested on real footage.

## Useful Commands

```powershell
cd C:\Repos\realityscan-frame-prep
npm install
npm run dev
npm run ci
npm run build
```
