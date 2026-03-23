"use client";

import React, { useState, useRef, useEffect } from "react";
import { useToast } from "../components/toast.client";
import { saveSettings } from "./settings.actions";

type ZipZoneEntry = { zone: string; lastFrost: string; firstFrost: string };
type ZipZoneData = Record<string, ZipZoneEntry>;

type CurrentSettings = {
  zipCode: string | null;
  zone: string | null;
  lastFrostDate: string | null;
  firstFrostDate: string | null;
  latitude: number | null;
  longitude: number | null;
} | null;

export function SettingsForm({
  currentSettings,
  zipZoneData,
  zones,
}: {
  currentSettings: CurrentSettings;
  zipZoneData: ZipZoneData;
  zones: readonly string[];
}) {
  const [zip, setZip] = useState(currentSettings?.zipCode ?? "");
  const [zone, setZone] = useState(currentSettings?.zone ?? "");
  const [lastFrost, setLastFrost] = useState(
    currentSettings?.lastFrostDate ?? "",
  );
  const [firstFrost, setFirstFrost] = useState(
    currentSettings?.firstFrostDate ?? "",
  );
  const [latitude, setLatitude] = useState(
    currentSettings?.latitude?.toString() ?? "",
  );
  const [longitude, setLongitude] = useState(
    currentSettings?.longitude?.toString() ?? "",
  );
  const [autoDetected, setAutoDetected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();
  const userChangedZip = useRef(false);
  const justSaved = useRef(false);

  useEffect(() => {
    if (!currentSettings) return;
    if (justSaved.current) {
      justSaved.current = false;
      return;
    }
    userChangedZip.current = false;
    setZip(currentSettings.zipCode ?? "");
    setZone(currentSettings.zone ?? "");
    setLastFrost(currentSettings.lastFrostDate ?? "");
    setFirstFrost(currentSettings.firstFrostDate ?? "");
    setLatitude(currentSettings.latitude?.toString() ?? "");
    setLongitude(currentSettings.longitude?.toString() ?? "");
    setAutoDetected(false);
  }, [currentSettings]);

  useEffect(() => {
    if (!userChangedZip.current) return;
    if (zip.length === 5) {
      const prefix = zip.slice(0, 3);
      const lookup = zipZoneData[prefix];
      if (lookup) {
        setZone(lookup.zone);
        const year = new Date().getFullYear();
        setLastFrost(`${year}-${lookup.lastFrost}`);
        setFirstFrost(`${year}-${lookup.firstFrost}`);
        setAutoDetected(true);
        setError(null);
      }
    } else {
      setAutoDetected(false);
    }
  }, [zip]);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSaving(true);
    justSaved.current = true;
    const result = await saveSettings(formData);
    setSaving(false);
    if (result.success) {
      addToast("Settings saved successfully!", "success");
    } else {
      justSaved.current = false;
      setError(result.error ?? "Failed to save settings.");
      addToast(result.error ?? "Failed to save settings.", "error");
    }
  }

  return (
    <form className="px-6 py-6 space-y-5" action={handleSubmit}>
      <input type="hidden" name="zipCode" value={zip} />
      <input type="hidden" name="zone" value={zone} />
      <input type="hidden" name="lastFrostDate" value={lastFrost} />
      <input type="hidden" name="firstFrostDate" value={firstFrost} />
      <input type="hidden" name="latitude" value={latitude} />
      <input type="hidden" name="longitude" value={longitude} />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <label
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          htmlFor="zipInput"
        >
          Zip Code
        </label>
        <input
          className="w-full rounded-lg border border-earth-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition placeholder:text-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-400"
          id="zipInput"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{5}"
          maxLength={5}
          placeholder="Enter 5-digit zip code"
          value={zip}
          onChange={(e) => {
            userChangedZip.current = true;
            setZip(e.target.value.replace(/\D/g, "").slice(0, 5));
          }}
        />
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Enter your zip code to auto-detect zone and frost dates.
        </p>
      </div>

      <div>
        <label
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          htmlFor="zoneSelect"
        >
          USDA Hardiness Zone
          {autoDetected && (
            <span className="ml-2 inline-flex items-center rounded-md bg-garden-50 dark:bg-garden-900/30 px-1.5 py-0.5 text-[10px] font-medium text-garden-700 dark:text-garden-400 ring-1 ring-inset ring-garden-600/20">
              Auto-detected
            </span>
          )}
        </label>
        <select
          className="w-full rounded-lg border border-earth-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          id="zoneSelect"
          value={zone}
          onChange={(e) => {
            setZone(e.target.value);
            setAutoDetected(false);
          }}
        >
          <option value="">Select a zone</option>
          {zones.map((z) => (
            <option key={z} value={z}>
              Zone {z}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            htmlFor="lastFrostInput"
          >
            Last Frost Date (Spring)
            {autoDetected && (
              <span className="ml-2 inline-flex items-center rounded-md bg-garden-50 dark:bg-garden-900/30 px-1.5 py-0.5 text-[10px] font-medium text-garden-700 dark:text-garden-400 ring-1 ring-inset ring-garden-600/20">
                Auto-detected
              </span>
            )}
          </label>
          <input
            className="w-full rounded-lg border border-earth-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            id="lastFrostInput"
            type="date"
            value={lastFrost}
            onChange={(e) => {
              setLastFrost(e.target.value);
              setAutoDetected(false);
            }}
          />
        </div>
        <div>
          <label
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            htmlFor="firstFrostInput"
          >
            First Frost Date (Fall)
            {autoDetected && (
              <span className="ml-2 inline-flex items-center rounded-md bg-garden-50 dark:bg-garden-900/30 px-1.5 py-0.5 text-[10px] font-medium text-garden-700 dark:text-garden-400 ring-1 ring-inset ring-garden-600/20">
                Auto-detected
              </span>
            )}
          </label>
          <input
            className="w-full rounded-lg border border-earth-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            id="firstFrostInput"
            type="date"
            value={firstFrost}
            onChange={(e) => {
              setFirstFrost(e.target.value);
              setAutoDetected(false);
            }}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Location (for weather)
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <input
              className="w-full rounded-lg border border-earth-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition placeholder:text-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-400"
              type="text"
              inputMode="decimal"
              placeholder="Latitude"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
            />
          </div>
          <div>
            <input
              className="w-full rounded-lg border border-earth-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition placeholder:text-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-400"
              type="text"
              inputMode="decimal"
              placeholder="Longitude"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Required for weather forecasts and frost alerts.
          </p>
          <button
            type="button"
            className="text-xs text-garden-600 dark:text-garden-400 hover:text-garden-700 dark:hover:text-garden-300 cursor-pointer"
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setLatitude(pos.coords.latitude.toFixed(4));
                    setLongitude(pos.coords.longitude.toFixed(4));
                    addToast("Location detected!", "success");
                  },
                  () => addToast("Could not detect location.", "error"),
                );
              }
            }}
          >
            Detect location
          </button>
        </div>
      </div>

      <div className="pt-2">
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-garden-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-garden-700 focus:outline-none focus:ring-2 focus:ring-garden-500/20 disabled:opacity-50 transition-colors cursor-pointer"
          type="submit"
          disabled={saving}
        >
          {saving ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </button>
      </div>
    </form>
  );
}
