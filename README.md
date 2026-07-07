# RealityScan Frame Prep

Windows desktop app for preparing Samsung phone videos and still images for RealityScan.

The app creates a clean `realityscan_result` folder from a selected source folder. It copies existing still images, extracts frames from videos, filters weak frames, and writes a report so the folder can be imported into RealityScan as ordinary images.

## Download

Download the latest portable Windows `.exe` from the GitHub releases page:

https://github.com/arntsorli/realityscan-frame-prep/releases/latest

Each successful code build on `main` creates a versioned release like `v0.1.23` with generated notes from the commit diff since the previous release. The app shows its version in the main window so users can compare it with the release page.

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
- Advanced processing controls for extraction FPS, quality preset, filter toggles, and max frames per video.
- Writes `report.html` and `report.json`.

## Capture Recommendations

Good capture matters more than the frame extraction tool. RealityScan needs overlap, texture, sharp images, and real camera movement to calculate camera positions and depth.

For Samsung S26 Ultra footage:

- Use the 1x main camera.
- Use 4K 30 fps as the default.
- Use bright, even light.
- Turn off HDR video, Log video, APV, Auto FPS, and Super steady.
- Move physically around the object or area; do not just pan from one spot.
- Move slowly to reduce motion blur.
- Take extra still photos of critical surfaces that must fit a Fusion 360 part.

### 360 object scan

Use this when scanning a loose object, fixture, cover, bracket, handle, tool, or other part where you need shape from most sides.

1. Put the object on a stable matte surface.
2. Add temporary texture if needed. Glossy, transparent, black, white, or featureless surfaces are difficult for photogrammetry.
3. Add a known scale reference near the object, such as a ruler, caliper, printed scale marker, or two marked points with a measured distance.
4. Record three slow passes around the object:
   - low angle
   - middle angle
   - high angle looking slightly down
5. Keep the object roughly the same size in the frame and avoid sudden changes in distance.
6. Take extra still photos of holes, edges, mating faces, and surfaces that must fit a designed part.
7. If using a turntable, use a plain background and RealityScan masking. Photogrammetry often works better when the camera moves around a static object.

For engineering use, prioritize the surfaces that matter for fit. A perfect-looking full model is less important than clean geometry around the contact areas.

### 180 area scan

Use this when scanning an installed area: a wall section, machine corner, vehicle panel, pipe route, cabinet interior, mounting zone, or other environment where a new part must fit.

1. Do not stand in one place and pan. Move your body sideways to create parallax.
2. Film or photograph in a slow arc across the area.
3. Capture at least three rows:
   - lower row
   - middle row
   - upper row
4. Add angled shots from the left and right so RealityScan can estimate depth.
5. Add wider context shots, then close detail shots of mounting points and collision areas.
6. Use temporary markers around low-texture areas if alignment struggles.
7. Include a known scale reference in the scene, ideally close to the surfaces that matter.

The goal is not a panorama. The goal is enough overlap from different physical camera positions for RealityScan to solve depth.

## Usage

1. Open the app.
2. Choose a source folder containing videos and/or still images.
3. Review the detected file counts.
4. Expand **Advanced processing** only if you need to adjust the defaults.
5. Run the prep process.
6. Import the generated `realityscan_result` folder into RealityScan.

RealityScan does not require special filenames for alignment. This app names extracted frames like `videoName_f000123.jpg` so problem frames are easier to trace back.

Advanced processing options:

- `Conservative` keeps more frames for difficult alignment.
- `Balanced` is the default.
- `Aggressive` keeps fewer frames when alignment is stable and imports are too large.
- `Extract FPS` controls how many candidate frames are pulled from each second of video.
- `Max frames per video` caps output size; use `0` for no cap.
- Filter toggles can be disabled when you want to inspect almost everything manually.

## RealityScan Workflow

1. Import the app-generated `realityscan_result` folder.
2. Run alignment first and inspect camera positions before generating a mesh.
3. If cameras split into multiple components or float in wrong positions, fix alignment before continuing:
   - remove blurry frames
   - add missing transition images
   - use masking for turntable/object scans
   - add control points on clear shared features
4. Set a reconstruction region tightly around the object or area.
5. Build the model.
6. Simplify/decimate before Fusion if the mesh is heavy.
7. Export a mesh format that matches the Fusion workflow below.

RealityScan/RealityCapture supports many export formats, including OBJ, PLY, STL, 3MF, FBX, DXF, GLB, USD/USDZ, LAS, and point-cloud formats. For Fusion, the practical mesh choices are usually OBJ, STL, or 3MF.

## Scale For Engineering Fit

Photogrammetry can produce a visually good model at the wrong scale. For fitted parts, always capture and verify scale.

Recommended scale workflow:

1. Place a physical reference in the scan area before capture:
   - ruler or caliper
   - printed scale bar
   - two tape marks with a measured distance
   - a known object such as a gauge block or measured plate
2. Keep the scale reference in the same depth plane as the important surfaces when possible.
3. In RealityScan, set scale using control points or a distance constraint between two known points.
4. After export, verify scale in Fusion by measuring the same known distance.
5. If the scan is only a design reference, keep it as a mesh body and model clean parametric geometry around it.
6. If the scan must drive a manufactured fit, confirm with at least one real-world measurement after import, not only the photogrammetry scale.

For custom production or engineering, avoid designing directly from noisy mesh triangles unless the scan is only a visual reference. Use the scan to locate surfaces, clearances, holes, and boundaries, then build the actual part as normal Fusion geometry.

## Fusion Export And Import

Use `Insert > Insert Mesh` in Fusion for mesh files. Autodesk documents STL, OBJ, and 3MF as common mesh import formats for Fusion.

Recommended options:

| Format | Use when | Pros | Cons |
| --- | --- | --- | --- |
| `OBJ` | You want the best general reference mesh from RealityScan, optionally with texture. | Widely supported, can include texture/material sidecar files, good for visual reference. | Multiple files may be created; texture is usually not needed for engineering fit. |
| `STL` | You only need shape and plan to use the scan as a simple reference or for 3D printing. | Simple, common, easy to import. | No color/texture; triangle-only mesh; can become very heavy. |
| `3MF` | You want a modern compact mesh container and Fusion accepts the export cleanly. | Can preserve more metadata than STL and is convenient as one file. | Less universal than STL/OBJ in older tools. |
| `FBX` | You are also sending the scan through Blender, Unreal, or visualization tools. | Good for textured/visual workflows. | Not the best first choice for Fusion engineering reference. |
| `PLY` | You need vertex colors or point/mesh exchange for cleanup tools. | Useful in mesh-processing tools. | Less direct for Fusion than OBJ/STL/3MF. |

Suggested Fusion workflow:

1. Export from RealityScan as `OBJ` for textured visual reference, or `STL`/`3MF` for geometry-only reference.
2. In Fusion, use `Insert > Insert Mesh`.
3. Confirm units and scale immediately after import.
4. Reduce mesh density before import if Fusion becomes slow.
5. Keep the scan on a separate component or layer-like organization.
6. Use Fusion sketches, planes, and parametric features to design the actual manufactured part around the scan.
7. Convert mesh to solid only when truly needed. Large photogrammetry meshes can be painful to convert and edit.

For most fitted-part design, the best path is: RealityScan mesh as reference, measured scale check, then clean Fusion geometry for the actual part.

## References

- RealityScan model export formats: https://rshelp.capturingreality.com/en-US/tools/export.htm
- Autodesk Fusion imported mesh workflow: https://www.autodesk.com/products/fusion-360/blog/working-with-imported-mesh-files-autodesk-fusion/
- Autodesk Fusion supported file formats: https://www.autodesk.com/support/technical/article/caas/sfdcarticles/sfdcarticles/File-formats-supported-by-Fusion-360.html
- Autodesk Fusion mesh conversion: https://www.autodesk.com/support/technical/article/caas/sfdcarticles/sfdcarticles/How-to-Convert-a-Mesh-to-a-BRep-in-Fusion-360.html

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

GitHub Actions runs on code-related pushes and pull requests to `main`. The Windows workflow installs dependencies, runs typecheck, lint, tests, builds the portable app, uploads the build artifact, and creates a versioned GitHub Release with generated notes on successful pushes to `main`.

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
