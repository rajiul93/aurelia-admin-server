import { describe, expect, it } from "vitest";

import { generateObjectKey } from "./r2.upload";

describe("generateObjectKey", () => {
  it("derives the extension from the validated MIME type", () => {
    expect(generateObjectKey("poster.png", "image/png")).toMatch(/\.png$/);
    expect(generateObjectKey("clip.mov", "video/quicktime")).toMatch(/\.mov$/);
  });

  it("ignores the extension in the uploaded filename", () => {
    // The filename is attacker-controlled. Trusting it let a caller land an
    // .html object in a public bucket while declaring an image MIME type.
    const key = generateObjectKey("payload.html", "image/png");

    expect(key).toMatch(/\.png$/);
    expect(key).not.toMatch(/\.html$/);
  });

  it("falls back to .bin for an unmapped MIME type", () => {
    expect(generateObjectKey("thing.exe", "application/x-msdownload")).toMatch(
      /\.bin$/,
    );
  });

  it("strips characters that are unsafe in an object key", () => {
    const key = generateObjectKey("../../etc/passwd.png", "image/png");

    expect(key).not.toContain("../");
    expect(key).toMatch(/^media\/\d{4}-\d{2}-\d{2}\//);
  });

  it("keeps keys unique for identical filenames", () => {
    expect(generateObjectKey("a.png", "image/png")).not.toBe(
      generateObjectKey("a.png", "image/png"),
    );
  });
});
