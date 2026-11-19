"use client";

import { useEffect, useState } from "react";
import {
  readSavedPlace,
  subscribeSavedPlace,
  writeSavedPlace,
  regionIdForState,
  type SavedPlace,
} from "@/lib/prefs/location";
import type { BomLocation } from "@/lib/weather/location-forecast";

export function useSavedPlace() {
  const [place, setPlace] = useState<SavedPlace | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPlace(readSavedPlace());
    setReady(true);
    return subscribeSavedPlace(setPlace);
  }, []);

  async function saveFromBomLocation(loc: BomLocation) {
    const res = await fetch(
      `/api/weather/forecast/${encodeURIComponent(loc.geohash)}`,
      { cache: "no-store" },
    );
    if (!res.ok) throw new Error("Could not resolve location");
    const json = (await res.json()) as {
      location: {
        latitude: number | null;
        longitude: number | null;
        name: string;
        state: string;
        geohash: string;
      };
    };
    const lat = json.location.latitude;
    const lon = json.location.longitude;
    if (lat == null || lon == null) throw new Error("No coordinates");
    const next: SavedPlace = {
      geohash: json.location.geohash || loc.geohash,
      name: json.location.name,
      state: json.location.state,
      lat,
      lon,
      regionId: regionIdForState(json.location.state),
    };
    writeSavedPlace(next);
    setPlace(next);
    return next;
  }

  async function saveFromGeolocation() {
    if (!navigator.geolocation) {
      throw new Error("Geolocation is not available in this browser.");
    }
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 12_000,
        maximumAge: 60_000,
      });
    });
    const { latitude, longitude } = pos.coords;
    // Met Office search doesn't take lat/lon — use OpenStreetMap reverse then Met Office search.
    const rev = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
      {
        headers: { Accept: "application/json" },
      },
    );
    let query = "";
    if (rev.ok) {
      const j = (await rev.json()) as {
        address?: { suburb?: string; town?: string; city?: string; state?: string };
      };
      query =
        j.address?.suburb ||
        j.address?.town ||
        j.address?.city ||
        "";
    }
    if (!query) {
      // Fall back: pick nearest capital by haversine from known list.
      const capitals = [
        { name: "London", state: "England", geohash: "uk-london", lat: 51.5074, lon: -0.1278 },
        { name: "Edinburgh", state: "Scotland", geohash: "uk-edinburgh", lat: 55.9533, lon: -3.1883 },
        { name: "Cardiff", state: "Wales", geohash: "uk-cardiff", lat: 51.4816, lon: -3.1791 },
        { name: "Belfast", state: "Northern Ireland", geohash: "uk-belfast", lat: 54.5973, lon: -5.9301 },
        { name: "Dublin", state: "Ireland", geohash: "ie-dublin", lat: 53.3498, lon: -6.2603 },
        { name: "Paris", state: "France", geohash: "fr-paris", lat: 48.8566, lon: 2.3522 },
        { name: "Amsterdam", state: "Netherlands", geohash: "nl-amsterdam", lat: 52.3676, lon: 4.9041 },
        { name: "Berlin", state: "Germany", geohash: "de-berlin", lat: 52.52, lon: 13.405 },
      ];
      let best = capitals[0]!;
      let bestD = Infinity;
      for (const c of capitals) {
        const d =
          (c.lat - latitude) ** 2 + (c.lon - longitude) ** 2;
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      const next: SavedPlace = {
        geohash: best.geohash,
        name: best.name,
        state: best.state,
        lat: latitude,
        lon: longitude,
        regionId: regionIdForState(best.state),
      };
      writeSavedPlace(next);
      setPlace(next);
      return next;
    }

    const search = await fetch(
      `/api/weather/locations?q=${encodeURIComponent(query)}`,
      { cache: "no-store" },
    );
    if (!search.ok) throw new Error("Location search failed");
    const data = (await search.json()) as {
      locations: BomLocation[];
    };
    const hit = data.locations?.[0];
    if (!hit) throw new Error("No nearby Met Office location found.");
    return saveFromBomLocation(hit);
  }

  return {
    place,
    ready,
    saveFromBomLocation,
    saveFromGeolocation,
    setPlace: (p: SavedPlace) => {
      writeSavedPlace(p);
      setPlace(p);
    },
  };
}
