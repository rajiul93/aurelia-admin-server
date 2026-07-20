import { beforeEach, describe, expect, it, vi } from "vitest";

const buildTourBundleArtifacts = vi.fn();
const findTourForBundle = vi.fn();
const findByTourAndVersion = vi.fn();
const updateArtifacts = vi.fn();
const create = vi.fn();
const log = vi.fn();

vi.mock("./tour-bundle.builder", () => ({
  buildTourBundleArtifacts: (...args: unknown[]) =>
    buildTourBundleArtifacts(...args),
}));

vi.mock("./tour-bundle.repository", () => ({
  tourBundleRepository: {
    findTourForBundle: (...args: unknown[]) => findTourForBundle(...args),
    findByTourAndVersion: (...args: unknown[]) => findByTourAndVersion(...args),
    updateArtifacts: (...args: unknown[]) => updateArtifacts(...args),
    create: (...args: unknown[]) => create(...args),
  },
}));

vi.mock("@/lib/audit", () => ({
  auditService: { log: (...args: unknown[]) => log(...args) },
}));

const { tourBundleService } = await import("./tour-bundle.service");

const PUBLISHED_TOUR = {
  id: "tour-1",
  publishStatus: "PUBLISHED",
  tourBundleVersion: 3,
  mediaVersion: 5,
  aiKnowledgeVersion: 2,
  routeVersion: 7,
};

/** A stored bundle whose three counters match PUBLISHED_TOUR. */
const CURRENT_BUNDLE = {
  id: "bundle-1",
  bundleId: "uuid-1",
  checksum: "abc",
  mediaVersion: 5,
  aiKnowledgeVersion: 2,
  routeVersion: 7,
  tourBundleVersion: 3,
  languages: ["en"],
  signatureAlgorithm: "RSA-SHA256",
  fileCount: 4,
  createdAt: new Date("2026-01-01T00:00:00Z"),
};

const ARTIFACTS = {
  bundleId: "uuid-2",
  languages: ["en"],
  manifest: {},
  content: {},
  searchDocuments: [],
  checksum: "def",
  signature: "sig",
  signatureAlgorithm: "RSA-SHA256",
  fileCount: 4,
};

beforeEach(() => {
  vi.clearAllMocks();
  findTourForBundle.mockResolvedValue(PUBLISHED_TOUR);
  buildTourBundleArtifacts.mockReturnValue(ARTIFACTS);
  updateArtifacts.mockResolvedValue(CURRENT_BUNDLE);
  create.mockResolvedValue(CURRENT_BUNDLE);
});

describe("buildForTour — cached path", () => {
  beforeEach(() => {
    findByTourAndVersion.mockResolvedValue(CURRENT_BUNDLE);
  });

  it("does not rebuild the artifacts when every version counter matches", async () => {
    // The assertion that matters. buildTourBundleArtifacts does the RSA-SHA256
    // signature and three SHA-256 digests, and it used to run *above* the cache
    // check — so asserting only that the DB was not written would have passed
    // against the broken ordering too.
    await tourBundleService.buildForTour("tour-1");

    expect(buildTourBundleArtifacts).not.toHaveBeenCalled();
  });

  it("writes nothing at all on a cache hit", async () => {
    await tourBundleService.buildForTour("tour-1");

    expect(updateArtifacts).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });

  it("still rebuilds when force is set, so a key rotation can re-sign", async () => {
    await tourBundleService.buildForTour("tour-1", undefined, { force: true });

    expect(buildTourBundleArtifacts).toHaveBeenCalledOnce();
    expect(updateArtifacts).toHaveBeenCalledOnce();
  });

  it("rebuilds when a content version has moved on", async () => {
    findByTourAndVersion.mockResolvedValue({
      ...CURRENT_BUNDLE,
      mediaVersion: 4,
    });

    await tourBundleService.buildForTour("tour-1");

    expect(buildTourBundleArtifacts).toHaveBeenCalledOnce();
    expect(updateArtifacts).toHaveBeenCalledOnce();
  });
});

describe("buildForTour — first build", () => {
  it("builds and creates when no bundle exists for this version", async () => {
    findByTourAndVersion.mockResolvedValue(null);

    await tourBundleService.buildForTour("tour-1");

    expect(buildTourBundleArtifacts).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledOnce();
    expect(log).toHaveBeenCalledOnce();
  });
});

describe("buildForTour — guards", () => {
  it("rejects an unknown tour", async () => {
    findTourForBundle.mockResolvedValue(null);

    await expect(tourBundleService.buildForTour("nope")).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(buildTourBundleArtifacts).not.toHaveBeenCalled();
  });

  it("rejects a tour that is not published", async () => {
    findTourForBundle.mockResolvedValue({
      ...PUBLISHED_TOUR,
      publishStatus: "DRAFT",
    });

    await expect(
      tourBundleService.buildForTour("tour-1"),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(buildTourBundleArtifacts).not.toHaveBeenCalled();
  });
});
