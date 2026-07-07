import { describe, expect, it } from "vitest";
import { frameOutputName, sanitizeFilenameBase } from "./naming";

describe("sanitizeFilenameBase", () => {
  it("keeps generated frame names readable and filesystem-safe", () => {
    expect(sanitizeFilenameBase("Min test-video åpen.mov")).toBe("Min_test-video_apen");
    expect(frameOutputName("Min test-video åpen.mov", 12)).toBe("Min_test-video_apen_f000012.jpg");
  });
});
