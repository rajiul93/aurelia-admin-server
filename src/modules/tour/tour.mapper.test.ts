import { describe, it, expect } from "vitest";
import { toTourListItemDto, toTourListItemDtoList } from "./tour.mapper";
import type { TourListRecord } from "./tour.repository";

function tourRecord(overrides: Partial<TourListRecord> = {}): TourListRecord {
  return {
    id: "t1",
    slug: "colosseum",
    placeId: null,
    coverMediaId: null,
    coverMedia: null,
    publishStatus: "PUBLISHED",
    tourBundleVersion: 1,
    mediaVersion: 1,
    aiKnowledgeVersion: 1,
    routeVersion: 1,
    publishedAt: null,
    archivedAt: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-02T00:00:00Z"),
    translations: [],
    floors: [],
    ...overrides,
  } as TourListRecord;
}

function floor(spots: number) {
  return { _count: { spots } };
}

describe("toTourListItemDto", () => {
  it("sums the spot count across every floor", () => {
    // Spots hang off Floor, not Tour, so the count is a per-floor aggregate.
    // A multi-floor tour (the Colosseum case) must report the total.
    const dto = toTourListItemDto(
      tourRecord({ floors: [floor(3), floor(5), floor(2)] } as Partial<TourListRecord>),
    );

    expect(dto.spotCount).toBe(10);
  });

  it("reports zero for a tour with no floors", () => {
    expect(toTourListItemDto(tourRecord()).spotCount).toBe(0);
  });

  it("reports zero for floors that have no spots", () => {
    expect(
      toTourListItemDto(
        tourRecord({ floors: [floor(0), floor(0)] } as Partial<TourListRecord>),
      ).spotCount,
    ).toBe(0);
  });

  it("does not carry spot bodies on a list row", () => {
    // The whole point of the list include: a count, never the content graph.
    const dto = toTourListItemDto(
      tourRecord({ floors: [floor(4)] } as Partial<TourListRecord>),
    );

    expect(dto).not.toHaveProperty("spots");
    expect(dto.spotCount).toBe(4);
  });

  it("localizes the title when a language is requested", () => {
    const dto = toTourListItemDto(
      tourRecord({
        translations: [
          {
            id: "tr1",
            tourId: "t1",
            language: "en",
            audience: "ADULTS",
            title: "Colosseum",
            description: "d",
            slug: "colosseum",
          },
          {
            id: "tr2",
            tourId: "t1",
            language: "es",
            audience: "ADULTS",
            title: "Coliseo",
            description: "d",
            slug: "coliseo",
          },
        ],
      } as unknown as Partial<TourListRecord>),
      "es",
    );

    expect(dto.title).toBe("Coliseo");
    expect(dto.language).toBe("es");
  });

  it("omits the localized fields when no language is requested", () => {
    const dto = toTourListItemDto(tourRecord());

    expect(dto.title).toBeUndefined();
    expect(dto.language).toBeUndefined();
  });
});

describe("toTourListItemDtoList", () => {
  it("maps every row", () => {
    const list = toTourListItemDtoList([
      tourRecord({ id: "a", floors: [floor(2)] } as Partial<TourListRecord>),
      tourRecord({ id: "b", floors: [floor(3), floor(1)] } as Partial<TourListRecord>),
    ]);

    expect(list.map((tour) => [tour.id, tour.spotCount])).toEqual([
      ["a", 2],
      ["b", 4],
    ]);
  });
});
