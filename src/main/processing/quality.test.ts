import { describe, expect, it } from "vitest";
import { DEFAULT_PROCESSING_SETTINGS } from "../../shared/types";
import { buildAdaptiveThresholds, decideFrame } from "./quality";

describe("quality presets", () => {
  const metrics = [
    {
      sharpness: 20,
      brightness: 120,
      darkRatio: 0.05,
      brightRatio: 0.02,
      hash: "00000000",
    },
    {
      sharpness: 80,
      brightness: 122,
      darkRatio: 0.04,
      brightRatio: 0.02,
      hash: "11111111",
    },
  ];

  it("makes aggressive duplicate filtering stricter than conservative filtering", () => {
    const conservative = buildAdaptiveThresholds(metrics, "conservative");
    const aggressive = buildAdaptiveThresholds(metrics, "aggressive");

    expect(aggressive.minHashDistance).toBeGreaterThan(conservative.minHashDistance);
    expect(aggressive.minSharpness).toBeGreaterThan(conservative.minSharpness);
  });

  it("honors disabled filters", () => {
    const thresholds = buildAdaptiveThresholds(metrics, "balanced");
    const blurryFrame = {
      sharpness: 0,
      brightness: 120,
      darkRatio: 0,
      brightRatio: 0,
      hash: "00000000",
    };

    expect(
      decideFrame(blurryFrame, thresholds, [], {
        ...DEFAULT_PROCESSING_SETTINGS,
        filterBlur: false,
      }),
    ).toEqual({ keep: true });
  });
});
