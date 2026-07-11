import { describe, expect, it } from "vitest";

import { toCanonicalJson } from "./canonical-json";

describe("toCanonicalJson", () => {
  it("sorts object keys alphabetically", () => {
    expect(toCanonicalJson({ b: 1, a: 2, c: 3 })).toBe('{"a":2,"b":1,"c":3}');
  });

  it("produces identical output regardless of insertion order", () => {
    const a = toCanonicalJson({ name: "x", id: 1, nested: { z: 1, a: 2 } });
    const b = toCanonicalJson({ nested: { a: 2, z: 1 }, id: 1, name: "x" });
    expect(a).toBe(b);
  });

  it("sorts keys of objects nested inside arrays but preserves array order", () => {
    expect(toCanonicalJson([{ b: 1, a: 2 }, { d: 4, c: 3 }])).toBe(
      '[{"a":2,"b":1},{"c":3,"d":4}]',
    );
  });

  it("passes through primitives and null", () => {
    expect(toCanonicalJson(42)).toBe("42");
    expect(toCanonicalJson("hello")).toBe('"hello"');
    expect(toCanonicalJson(true)).toBe("true");
    expect(toCanonicalJson(null)).toBe("null");
  });

  it("treats null distinctly from a plain object", () => {
    expect(toCanonicalJson({ a: null, b: {} })).toBe('{"a":null,"b":{}}');
  });
});
