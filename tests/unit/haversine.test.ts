import { describe, it, expect } from "vitest";
import { haversineDistance, bboxFromRadius } from "@/lib/geo/haversine";

describe("haversineDistance", () => {
  it("returns 0 for identical points", () => {
    const d = haversineDistance(55.7558, 37.6173, 55.7558, 37.6173);
    expect(d).toBeCloseTo(0, 3);
  });

  it("Moscow ↔ Saint Petersburg is approximately 633 km", () => {
    // Moscow (Kremlin-ish): 55.7558 N, 37.6173 E
    // Saint Petersburg (center):    59.9343 N, 30.3351 E
    const meters = haversineDistance(55.7558, 37.6173, 59.9343, 30.3351);
    const km = meters / 1000;
    // Great-circle расстояние ~ 633 км (±5 км tolerance на разные координаты центра).
    expect(km).toBeGreaterThan(625);
    expect(km).toBeLessThan(640);
  });

  it("is symmetric", () => {
    const ab = haversineDistance(55, 37, 60, 30);
    const ba = haversineDistance(60, 30, 55, 37);
    expect(ab).toBeCloseTo(ba, 6);
  });
});

describe("bboxFromRadius", () => {
  it("returns a box strictly containing the center point", () => {
    const bbox = bboxFromRadius(55.7558, 37.6173, 1000);
    expect(bbox.minLat).toBeLessThan(55.7558);
    expect(bbox.maxLat).toBeGreaterThan(55.7558);
    expect(bbox.minLng).toBeLessThan(37.6173);
    expect(bbox.maxLng).toBeGreaterThan(37.6173);
  });

  it("grows lat delta linearly with radius", () => {
    const b1 = bboxFromRadius(55.7558, 37.6173, 1000);
    const b2 = bboxFromRadius(55.7558, 37.6173, 2000);
    const latSpan1 = b1.maxLat - b1.minLat;
    const latSpan2 = b2.maxLat - b2.minLat;
    expect(latSpan2 / latSpan1).toBeCloseTo(2, 2);
  });

  it("uses cos(lat) correction for lng delta", () => {
    // На экваторе lng span ≈ lat span (cos(0) = 1).
    const eq = bboxFromRadius(0, 0, 10_000);
    const eqLat = eq.maxLat - eq.minLat;
    const eqLng = eq.maxLng - eq.minLng;
    expect(eqLng / eqLat).toBeCloseTo(1, 2);

    // На 60° широты lng span в 2 раза больше lat span (cos(60°) = 0.5).
    const high = bboxFromRadius(60, 0, 10_000);
    const highLat = high.maxLat - high.minLat;
    const highLng = high.maxLng - high.minLng;
    expect(highLng / highLat).toBeCloseTo(2, 1);
  });

  it("contains all points within the given radius (sanity)", () => {
    const bbox = bboxFromRadius(55.7558, 37.6173, 5000);
    // Точка в 3км на север от центра — должна быть внутри 5км-bbox.
    const northPoint = { lat: 55.7558 + 3000 / 111_000, lng: 37.6173 };
    expect(northPoint.lat).toBeGreaterThan(bbox.minLat);
    expect(northPoint.lat).toBeLessThan(bbox.maxLat);
    expect(haversineDistance(55.7558, 37.6173, northPoint.lat, northPoint.lng))
      .toBeLessThan(5000);
  });
});
