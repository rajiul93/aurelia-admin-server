import { describe, expect, it } from "vitest";

import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates whitespace", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips diacritics/accents", () => {
    expect(slugify("Café Málaga")).toBe("cafe-malaga");
    expect(slugify("Peñíscola")).toBe("peniscola");
  });

  it("removes non-alphanumeric symbols", () => {
    expect(slugify("Rome: The Eternal City!")).toBe("rome-the-eternal-city");
  });

  it("collapses runs of spaces, underscores, and dashes", () => {
    expect(slugify("a __  b -- c")).toBe("a-b-c");
  });

  it("trims leading and trailing dashes", () => {
    expect(slugify("  -- hello -- ")).toBe("hello");
  });

  it("returns an empty string for symbol-only input", () => {
    expect(slugify("!!!")).toBe("");
    expect(slugify("")).toBe("");
  });

  it("keeps existing digits", () => {
    expect(slugify("Tour 42 Guide")).toBe("tour-42-guide");
  });
});
