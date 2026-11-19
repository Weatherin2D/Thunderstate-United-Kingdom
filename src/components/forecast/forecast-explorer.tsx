"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Droplets,
  Gauge,
  Sunrise,
  Sunset,
  Sun,
  Thermometer,
  Wind,
  Waves,
} from "lucide-react";
import { SiteShell } from "@/components/site/site-shell";
import { LocationSearch } from "@/components/forecast/location-search";
import { WeatherIcon } from "@/components/forecast/weather-icon";
import {
  STATE_CAPITALS,
  formatClock,
  formatForecastDay,
  formatForecastHour,
  rainLabel,
  type LocationForecastPayload,
} from "@/lib/weather/location-forecast";
import { cn } from "@/lib/utils";

type Props = {
  geohash?: string | null;
  region?: string | null;
};

export function ForecastExplorer({ geohash = null, region = null }: Props) {
  const regionKey = (region || "").toLowerCase();
  const seed =
    geohash ||
    STATE_CAPITALS[regionKey]?.geohash ||
    STATE_CAPITALS.nsw.geohash;

  const [activeHash, setActiveHash] = useState(seed);
  const [data, setData] = useState<LocationForecastPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeHash) return;
    const ac = new AbortController();

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/weather/forecast/${encodeURIComponent(activeHash)}`,
          { signal: ac.signal, cache: "no-store" },
        );
        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? "No Met Office forecast for this location."
              : `Forecast unavailable (${res.status})`,
          );
        }
        const json = (await res.json()) as LocationForecastPayload;
        if (ac.signal.aborted) return;
        setData(json);
        setLoading(false);
      } catch (err) {
        if (ac.signal.aborted) return;
        setData(null);
        setLoading(false);
        setError(err instanceof Error ? err.message : "Forecast unavailable");
      }
    }
    run();
    return () => ac.abort();
  }, [activeHash]);

  const tz = data?.location.timezone || "Europe/London";
  const today = data?.daily[0] ?? null;
  const hourly = useMemo(() => data?.hourly ?? [], [data]);
  const rainTimeline = useMemo(
    () => data?.hourly.slice(0, 48) ?? [],
    [data],
  );
  const maxRainMm = useMemo(() => {
    let max = 1;
    for (const h of rainTimeline) {
      const mm = h.rainMaxMm ?? h.rainMinMm ?? 0;
      if (mm > max) max = mm;
    }
    return max;
  }, [rainTimeline]);

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-[960px] px-3 py-5 sm:px-4 sm:py-6">
        <div className="mb-5 space-y-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--cyan)]">
              Met Office
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-extrabold text-white sm:text-3xl">
              Location forecast
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-white/70">
              Search any European suburb, town or postcode for the official
              Met Office outlook.
            </p>
          </div>
          <LocationSearch
            className="w-full"
            onSelect={(loc) => {
              setActiveHash(loc.geohash);
              window.history.replaceState(
                null,
                "",
                `/forecast/${encodeURIComponent(loc.geohash)}`,
              );
            }}
          />
        </div>

        <div className="mb-5">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/50">
            Capitals
          </p>
          <div className="sw-chip-row">
            {Object.entries(STATE_CAPITALS)
              .map(([key, cap]) => (
                <Link
                  key={key}
                  href={`/forecast/${cap.geohash}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveHash(cap.geohash);
                    window.history.replaceState(
                      null,
                      "",
                      `/forecast/${cap.geohash}`,
                    );
                  }}
                  className={cn(
                    "sw-chip",
                    activeHash === cap.geohash
                      ? "sw-chip-active"
                      : "sw-chip-idle",
                  )}
                >
                  {cap.name}
                </Link>
              ))}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-white/70">Loading Met Office forecast…</p>
        ) : null}
        {error ? (
          <div className="sw-panel p-4 text-sm text-white/85">{error}</div>
        ) : null}

        {data ? (
          <div className="space-y-4">
            <section className="sw-panel p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-white sm:text-2xl">
                    {data.location.name}
                    <span className="ml-2 text-sm font-semibold text-white/60 sm:text-base">
                      {data.location.state}
                      {data.location.postcode
                        ? ` ${data.location.postcode}`
                        : ""}
                    </span>
                  </h2>
                  {data.observation?.stationName ? (
                    <p className="mt-1 text-xs text-white/50">
                      Observations from {data.observation.stationName}
                      {data.observation.stationId
                        ? ` · Met Office ${data.observation.stationId}`
                        : ""}
                      {data.observation.stationDistanceKm != null
                        ? ` · ${formatDistance(data.observation.stationDistanceKm)} away`
                        : ""}
                      {data.observation.observationTime
                        ? ` · ${formatClock(data.observation.observationTime, tz)}`
                        : ""}
                    </p>
                  ) : null}
                </div>
                {today ? (
                  <div className="flex items-center gap-3">
                    <WeatherIcon
                      icon={today.icon}
                      night={today.isNight}
                      className="h-10 w-10"
                    />
                    <div className="text-right">
                      <p className="text-3xl font-bold leading-none text-white sm:text-4xl">
                        {data.observation?.temp != null
                          ? `${Math.round(data.observation.temp)}°`
                          : today.tempNow != null
                            ? `${Math.round(today.tempNow)}°`
                            : today.tempMax != null
                              ? `${Math.round(today.tempMax)}°`
                              : "—"}
                      </p>
                      <p className="mt-1 text-sm text-white/75">
                        {today.shortText}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 sm:gap-3">
                <Stat
                  icon={<Thermometer className="h-3.5 w-3.5" />}
                  label="Feels like"
                  value={
                    data.observation?.tempFeelsLike != null
                      ? `${Math.round(data.observation.tempFeelsLike)}°`
                      : "—"
                  }
                />
                <Stat
                  icon={<Wind className="h-3.5 w-3.5" />}
                  label="Wind"
                  value={
                    windLabel(
                      data.observation?.windDir ?? null,
                      data.observation?.windKmh ?? null,
                      data.observation?.windKnots ?? null,
                    ) ?? "—"
                  }
                />
                <Stat
                  icon={<Wind className="h-3.5 w-3.5" />}
                  label="Peak gust"
                  title={
                    data.observation?.maxGustTime
                      ? `Peak gust at ${formatClock(data.observation.maxGustTime, tz)}`
                      : data.observation?.gustTime
                        ? `Gust at ${formatClock(data.observation.gustTime, tz)}`
                        : undefined
                  }
                  value={
                    data.observation?.maxGustKmh != null
                      ? `${Math.round(data.observation.maxGustKmh)} km/h`
                      : data.observation?.gustKmh != null
                        ? `${Math.round(data.observation.gustKmh)} km/h`
                        : "—"
                  }
                />
                <Stat
                  icon={<Droplets className="h-3.5 w-3.5" />}
                  label="Rain since 9am"
                  value={
                    data.observation?.rainSince9am != null
                      ? `${data.observation.rainSince9am} mm`
                      : "—"
                  }
                />
                <Stat
                  icon={<Gauge className="h-3.5 w-3.5" />}
                  label="Humidity"
                  value={
                    data.observation?.humidity != null
                      ? `${Math.round(data.observation.humidity)}%`
                      : "—"
                  }
                />
                <Stat
                  icon={<Thermometer className="h-3.5 w-3.5" />}
                  label="Observed high / low"
                  value={
                    data.observation?.maxTemp != null ||
                    data.observation?.minTemp != null
                      ? `${data.observation.maxTemp != null ? `${Math.round(data.observation.maxTemp)}°` : "—"} / ${data.observation.minTemp != null ? `${Math.round(data.observation.minTemp)}°` : "—"}`
                      : "—"
                  }
                />
              </div>
              {data.observation?.maxTempTime ||
              data.observation?.minTempTime ? (
                <p className="mt-2 text-[10px] text-white/40">
                  {data.observation.maxTempTime ? (
                    <span>
                      Observed high at{" "}
                      {formatClock(data.observation.maxTempTime, tz)}
                    </span>
                  ) : null}
                  {data.observation.maxTempTime &&
                  data.observation.minTempTime
                    ? " · "
                    : ""}
                  {data.observation.minTempTime ? (
                    <span>
                      Observed low at{" "}
                      {formatClock(data.observation.minTempTime, tz)}
                    </span>
                  ) : null}
                </p>
              ) : null}

              {today?.nowLabel ||
              today?.laterLabel ||
              today?.tempNow != null ||
              today?.tempLater != null ? (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/60">
                  {today.nowLabel || today.tempNow != null ? (
                    <span>
                      {today.nowLabel || "Now"}{" "}
                      <strong className="text-white">
                        {today.tempNow != null ? `${today.tempNow}°` : "—"}
                      </strong>
                    </span>
                  ) : null}
                  {today.laterLabel || today.tempLater != null ? (
                    <span>
                      {today.laterLabel || "Later"}{" "}
                      <strong className="text-white">
                        {today.tempLater != null ? `${today.tempLater}°` : "—"}
                      </strong>
                    </span>
                  ) : null}
                </div>
              ) : null}

              {today ? (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/65">
                  <span>
                    Max{" "}
                    <strong className="text-[var(--cyan)]">
                      {today.tempMax != null ? `${today.tempMax}°` : "—"}
                    </strong>
                  </span>
                  <span>
                    Min{" "}
                    <strong className="text-white">
                      {today.tempMin != null ? `${today.tempMin}°` : "—"}
                    </strong>
                  </span>
                  <span>
                    Rain{" "}
                    <strong className="text-white">
                      {rainLabel(
                        today.rainChance,
                        today.rainMinMm,
                        today.rainMaxMm,
                        today.rainUnits,
                      )}
                    </strong>
                  </span>
                  {today.uvMaxIndex != null ? (
                    <span>
                      UV{" "}
                      <strong className="text-white">
                        {today.uvMaxIndex}
                        {today.uvCategory
                          ? ` ${formatCategory(today.uvCategory)}`
                          : ""}
                      </strong>
                    </span>
                  ) : null}
                  {today.fireDanger ? (
                    <span>
                      Fire{" "}
                      <strong
                        className="text-white"
                        style={
                          today.fireDangerDarkModeColour ||
                          today.fireDangerColour
                            ? {
                                color:
                                  today.fireDangerDarkModeColour ??
                                  today.fireDangerColour ??
                                  undefined,
                              }
                            : undefined
                        }
                      >
                        {today.fireDanger}
                      </strong>
                    </span>
                  ) : null}
                  {today.surfDanger ? (
                    <span>
                      Surf{" "}
                      <strong
                        style={{
                          color:
                            today.surfDangerDarkModeColour ??
                            today.surfDangerColour ??
                            undefined,
                        }}
                        className="text-white"
                      >
                        {today.surfDanger}
                      </strong>
                    </span>
                  ) : null}
                  {today.uvStartTime && today.uvEndTime ? (
                    <span>
                      UV period{" "}
                      <strong className="text-white">
                        {formatClock(today.uvStartTime, tz)}–
                        {formatClock(today.uvEndTime, tz)}
                      </strong>
                    </span>
                  ) : null}
                  {today.sunrise ? (
                    <span className="inline-flex items-center gap-1">
                      <Sunrise className="h-3 w-3" aria-hidden />
                      {formatClock(today.sunrise, tz)}
                    </span>
                  ) : null}
                  {today.sunset ? (
                    <span className="inline-flex items-center gap-1">
                      <Sunset className="h-3 w-3" aria-hidden />
                      {formatClock(today.sunset, tz)}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </section>

            {hourly.length > 0 ? (
              <section className="sw-panel p-4">
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--cyan)]">
                    Hourly forecast
                  </h3>
                  <p className="text-xs text-white/45">
                    Next {hourly.length} hours · local time
                  </p>
                </div>
                <div className="sw-chip-row sm:gap-2">
                  {hourly.map((h) => (
                    <div
                      key={h.time}
                      className="flex w-36 shrink-0 flex-col items-center gap-1.5 rounded-lg border border-white/10 bg-black/20 px-2.5 py-2.5 text-center"
                    >
                      <p className="text-[10px] font-semibold uppercase text-white/45">
                        {formatForecastDay(h.time, tz)}
                      </p>
                      <p className="text-xs font-semibold uppercase text-white/70">
                        {formatForecastHour(h.time, tz)}
                      </p>
                      <WeatherIcon
                        icon={h.icon}
                        night={h.isNight}
                        className="h-6 w-6"
                      />
                      <p className="text-lg font-bold leading-none text-white">
                        {h.temp != null ? `${Math.round(h.temp)}°` : "—"}
                      </p>
                      <dl className="grid w-full grid-cols-2 gap-x-2 gap-y-1 border-t border-white/10 pt-1.5 text-left">
                        <HourlyDetail
                          label="Feels"
                          value={
                            h.tempFeelsLike != null
                              ? `${Math.round(h.tempFeelsLike)}°`
                              : null
                          }
                        />
                        <HourlyDetail
                          label="Rain"
                          value={
                            h.rainChance != null ? `${h.rainChance}%` : null
                          }
                        />
                        <HourlyDetail
                          label="Amount"
                          value={rainAmountRange(
                            h.rainMinMm,
                            h.rainMaxMm,
                            h.rainUnits,
                          )}
                        />
                        <HourlyDetail
                          label="Amount odds"
                          value={
                            [
                              h.rainAmount10PercentChanceMm != null
                                ? `10% ${h.rainAmount10PercentChanceMm}${h.rainUnits}`
                                : null,
                              h.rainAmount25PercentChanceMm != null
                                ? `25% ${h.rainAmount25PercentChanceMm}${h.rainUnits}`
                                : null,
                              h.rainAmount50PercentChanceMm != null
                                ? `50% ${h.rainAmount50PercentChanceMm}${h.rainUnits}`
                                : null,
                            ]
                              .filter((amount): amount is string => amount != null)
                              .join(" · ") || null
                          }
                        />
                        <HourlyDetail
                          label="Wind"
                          value={windLabel(h.windDir, h.windKmh, h.windKnots)}
                        />
                        <HourlyDetail
                          label="Gust"
                          value={
                            h.gustKmh != null
                              ? `${Math.round(h.gustKmh)} km/h${h.gustKnots != null ? ` · ${Math.round(h.gustKnots)} kt` : ""}`
                              : null
                          }
                        />
                        <HourlyDetail
                          label="Humidity"
                          value={
                            h.humidity != null ? `${Math.round(h.humidity)}%` : null
                          }
                        />
                        <HourlyDetail
                          label="Dew point"
                          value={
                            h.dewPoint != null
                              ? `${Math.round(h.dewPoint)}°`
                              : null
                          }
                        />
                        <HourlyDetail
                          label="UV"
                          value={h.uv != null ? String(h.uv) : null}
                        />
                      </dl>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-white/40">
                  Wind and gust speeds include km/h and knots where supplied.
                  Scroll horizontally for later periods.
                </p>
              </section>
            ) : null}

            {loading && !data ? null : rainTimeline.length > 0 ? (
              <section className="sw-panel p-4">
                <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-[var(--cyan)]">
                  Rain timeline
                </h3>
                <p className="mb-3 text-xs text-white/55">
                  Next {rainTimeline.length} hours — chance bars with optional
                  mm range from Met Office hourly.
                </p>
                <div className="sw-chip-row items-end sm:gap-1">
                  {rainTimeline.map((h) => {
                    const chance = h.rainChance ?? 0;
                    const barH = 8 + (chance / 100) * 56;
                    const mmLabel =
                      h.rainMinMm != null || h.rainMaxMm != null
                        ? h.rainMinMm != null &&
                          h.rainMaxMm != null &&
                          h.rainMinMm !== h.rainMaxMm
                          ? `${h.rainMinMm}–${h.rainMaxMm}`
                          : `${h.rainMaxMm ?? h.rainMinMm}`
                        : null;
                    const mmFrac =
                      (h.rainMaxMm ?? h.rainMinMm ?? 0) / maxRainMm;
                    return (
                      <div
                        key={`rain-${h.time}`}
                        className="flex w-[2.35rem] shrink-0 flex-col items-center gap-1 sm:w-10"
                      >
                        <span className="text-[9px] font-semibold text-sky-200">
                          {h.rainChance != null ? `${h.rainChance}%` : "—"}
                        </span>
                        <div className="relative flex h-16 w-full items-end justify-center">
                          <div
                            className="w-[70%] rounded-t-sm bg-sky-400/35"
                            style={{ height: `${barH}px` }}
                          />
                          {mmFrac > 0 ? (
                            <div
                              className="absolute bottom-0 w-[40%] rounded-t-sm bg-sky-300/90"
                              style={{
                                height: `${Math.max(3, mmFrac * 40)}px`,
                              }}
                            />
                          ) : null}
                        </div>
                        <span className="text-[9px] text-white/45">
                          {formatForecastHour(h.time, tz)}
                        </span>
                        <span className="h-3 text-[8px] text-white/40">
                          {mmLabel ? `${mmLabel} ${h.rainUnits}` : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-[10px] text-white/40">
                  Tall bars = rain chance · thin core = relative mm range
                </p>
              </section>
            ) : !loading && data ? (
              <section className="sw-panel p-4">
                <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-[var(--cyan)]">
                  Rain timeline
                </h3>
                <p className="text-sm text-white/65">
                  No hourly rain guidance for this location right now.
                </p>
              </section>
            ) : null}

            {data.daily.length > 0 ? (
              <section className="sw-panel p-4">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--cyan)]">
                  Daily forecast · {data.daily.length} days
                </h3>
                <ul className="divide-y divide-white/10">
                  {data.daily.map((day, idx) => (
                    <li
                      key={day.date}
                      className="space-y-2.5 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <p className="w-20 shrink-0 text-sm font-semibold text-white sm:w-24">
                          {idx === 0 ? "Today" : formatForecastDay(day.date, tz)}
                        </p>
                        <WeatherIcon
                          icon={day.icon}
                          night={day.isNight}
                          className="h-7 w-7 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white/90">
                            {day.shortText || "Forecast"}
                          </p>
                          {day.extendedText ? (
                            <p className="mt-1 text-xs leading-relaxed text-white/65">
                              {day.extendedText}
                            </p>
                          ) : null}
                        </div>
                        <p className="w-[4.5rem] shrink-0 text-right text-sm font-bold text-white sm:w-20">
                          <span className="text-white/50">
                            {day.tempMin != null ? `${day.tempMin}°` : "—"}
                          </span>
                          {" / "}
                          <span className="text-[var(--cyan)]">
                            {day.tempMax != null ? `${day.tempMax}°` : "—"}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-x-3 gap-y-1 pl-0 text-[11px] text-white/60 sm:pl-[7.5rem]">
                        <span>
                          Rain{" "}
                          <strong className="text-sky-200">
                            {rainLabel(
                              day.rainChance,
                              day.rainMinMm,
                              day.rainMaxMm,
                              day.rainUnits,
                            )}
                          </strong>
                        </span>
                        {day.rainChanceOfNoRainCategory ? (
                          <span>
                            No-rain chance{" "}
                            <strong className="text-white/85">
                              {formatCategory(day.rainChanceOfNoRainCategory)}
                            </strong>
                          </span>
                        ) : null}
                        {day.uvMaxIndex != null ? (
                          <span className="inline-flex items-center gap-1">
                            <Sun className="h-3 w-3" aria-hidden />
                            UV{" "}
                            <strong className="text-white/85">
                              {day.uvMaxIndex}
                              {day.uvCategory
                                ? ` · ${formatCategory(day.uvCategory)}`
                                : ""}
                            </strong>
                            {day.uvStartTime && day.uvEndTime
                              ? ` · ${formatClock(day.uvStartTime, tz)}–${formatClock(day.uvEndTime, tz)}`
                              : ""}
                          </span>
                        ) : null}
                        {day.fireDanger ? (
                          <span>
                            Fire danger{" "}
                            <strong
                              style={{
                                color:
                                  day.fireDangerDarkModeColour ??
                                  day.fireDangerColour ??
                                  undefined,
                              }}
                            >
                              {day.fireDanger}
                            </strong>
                          </span>
                        ) : null}
                        {day.surfDanger ? (
                          <span className="inline-flex items-center gap-1">
                            <Waves className="h-3 w-3" aria-hidden />
                            Surf{" "}
                            <strong
                              style={{
                                color:
                                  day.surfDangerDarkModeColour ??
                                  day.surfDangerColour ??
                                  undefined,
                              }}
                            >
                              {day.surfDanger}
                            </strong>
                          </span>
                        ) : null}
                        {day.sunrise ? (
                          <span className="inline-flex items-center gap-1">
                            <Sunrise className="h-3 w-3" aria-hidden />
                            {formatClock(day.sunrise, tz)}
                          </span>
                        ) : null}
                        {day.sunset ? (
                          <span className="inline-flex items-center gap-1">
                            <Sunset className="h-3 w-3" aria-hidden />
                            {formatClock(day.sunset, tz)}
                          </span>
                        ) : null}
                      </div>

                      {day.rainAmount25PercentChanceMm != null ||
                      day.rainAmount50PercentChanceMm != null ||
                      day.rainAmount75PercentChanceMm != null ||
                      day.nowLabel ||
                      day.laterLabel ? (
                        <div className="pl-0 text-[10px] leading-relaxed text-white/45 sm:pl-[7.5rem]">
                          {day.rainAmount25PercentChanceMm != null ||
                          day.rainAmount50PercentChanceMm != null ||
                          day.rainAmount75PercentChanceMm != null ? (
                            <p>
                              Met Office rain amount guidance (25/50/75% chance):{" "}
                              {[
                                day.rainAmount25PercentChanceMm != null
                                  ? `25% ${day.rainAmount25PercentChanceMm} ${day.rainUnits}`
                                  : null,
                                day.rainAmount50PercentChanceMm != null
                                  ? `50% ${day.rainAmount50PercentChanceMm} ${day.rainUnits}`
                                  : null,
                                day.rainAmount75PercentChanceMm != null
                                  ? `75% ${day.rainAmount75PercentChanceMm} ${day.rainUnits}`
                                  : null,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          ) : null}
                          {day.nowLabel || day.laterLabel ? (
                            <p>
                              {day.nowLabel && day.tempNow != null
                                ? `${day.nowLabel}: ${day.tempNow}°`
                                : ""}
                              {day.nowLabel &&
                              day.laterLabel &&
                              day.tempNow != null &&
                              day.tempLater != null
                                ? " · "
                                : ""}
                              {day.laterLabel && day.tempLater != null
                                ? `${day.laterLabel}: ${day.tempLater}°`
                                : ""}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <p className="text-xs text-white/45">
              Source: {data.attribution}
              {data.issueTime
                ? ` · Issued ${formatClock(data.issueTime, tz)}`
                : ""}
              {data.nextIssueTime
                ? ` · Next update expected ${formatClock(data.nextIssueTime, tz)}`
                : ""}
              {data.hourlyIssueTime &&
              data.hourlyIssueTime !== data.issueTime
                ? ` · Hourly issued ${formatClock(data.hourlyIssueTime, tz)}`
                : ""}
              . Independent display, not operated or endorsed by Met Office. Official
              forecasts may change — check Met Office for warnings.
            </p>
          </div>
        ) : null}
      </div>
    </SiteShell>
  );
}

function formatCategory(value: string): string {
  return value
    .replace(/veryhigh/gi, "very high")
    .replace(/verylow/gi, "very low")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  return `${Math.round(distanceKm * 10) / 10} km`;
}

function rainAmountRange(
  min: number | null,
  max: number | null,
  units: string,
): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null && min !== max) {
    return `${min}–${max} ${units}`;
  }
  return `${max ?? min} ${units}`;
}

function windLabel(
  direction: string | null,
  kmh: number | null,
  knots: number | null,
): string | null {
  let speed: string;
  if (kmh != null) {
    speed = `${Math.round(kmh)} km/h${knots != null ? ` · ${Math.round(knots)} kt` : ""}`;
  } else if (knots != null) {
    speed = `${Math.round(knots)} kt`;
  } else {
    return null;
  }
  return [direction, speed].filter(Boolean).join(" ");
}

function HourlyDetail({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <dt className="text-[9px] uppercase tracking-wide text-white/35">
        {label}
      </dt>
      <dd className="truncate text-[10px] font-semibold text-white/75">
        {value}
      </dd>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  title,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  title?: string;
}) {
  return (
    <div
      className="rounded-md border border-white/10 bg-black/15 px-3 py-2.5"
      title={title}
    >
      <p className="mb-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-white/55">
        {icon}
        {label}
      </p>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  );
}
