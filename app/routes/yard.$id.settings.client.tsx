"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "react-flight-router/client";
import { useToast } from "../components/toast.client";
import { useConfirm } from "../components/confirm-dialog.client";
import { saveSettings } from "./settings.actions";

type YardData = {
  id: number;
  name: string;
  widthFt: number;
  heightFt: number;
};

type CurrentSettings = {
  zipCode: string | null;
  zone: string | null;
  lastFrostDate: string | null;
  firstFrostDate: string | null;
  latitude: number | null;
  longitude: number | null;
} | null;

type ZipZoneEntry = { zone: string; lastFrost: string; firstFrost: string };

export function CombinedSettingsForm({
  yard,
  currentSettings,
  zipZoneData,
  zones,
  updateYardAction,
  deleteYardAction,
}: {
  yard: YardData;
  currentSettings: CurrentSettings;
  zipZoneData: Record<string, ZipZoneEntry>;
  zones: readonly string[];
  updateYardAction: (formData: FormData) => Promise<void>;
  deleteYardAction: (formData: FormData) => Promise<void>;
}) {
  // Yard state
  const [name, setName] = useState(yard.name);
  const [widthFt, setWidthFt] = useState(yard.widthFt);
  const [heightFt, setHeightFt] = useState(yard.heightFt);

  // Garden settings state
  const [zip, setZip] = useState(currentSettings?.zipCode ?? "");
  const [zone, setZone] = useState(currentSettings?.zone ?? "");
  const [lastFrost, setLastFrost] = useState(currentSettings?.lastFrostDate ?? "");
  const [firstFrost, setFirstFrost] = useState(currentSettings?.firstFrostDate ?? "");
  const [latitude, setLatitude] = useState(currentSettings?.latitude?.toString() ?? "");
  const [longitude, setLongitude] = useState(currentSettings?.longitude?.toString() ?? "");
  const [autoDetected, setAutoDetected] = useState(false);

  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();
  const confirm = useConfirm();
  const { navigate } = useRouter();
  const userChangedZip = useRef(false);

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
      }
    } else {
      setAutoDetected(false);
    }
  }, [zip]);

  async function handleSave() {
    setSaving(true);

    // Save yard
    const yardForm = new FormData();
    yardForm.set("id", String(yard.id));
    yardForm.set("name", name);
    yardForm.set("widthFt", String(widthFt));
    yardForm.set("heightFt", String(heightFt));
    await updateYardAction(yardForm);

    // Save garden settings
    const settingsForm = new FormData();
    settingsForm.set("zipCode", zip);
    settingsForm.set("zone", zone);
    settingsForm.set("lastFrostDate", lastFrost);
    settingsForm.set("firstFrostDate", firstFrost);
    settingsForm.set("latitude", latitude);
    settingsForm.set("longitude", longitude);
    await saveSettings(settingsForm);

    addToast("Settings saved", "success");
    setSaving(false);
  }

  async function handleDelete() {
    const ok = await confirm({
      title: "Delete yard?",
      message: `"${yard.name}" and all its beds and plantings will be permanently removed.`,
      destructive: true,
    });
    if (!ok) return;
    try {
      const formData = new FormData();
      formData.set("id", String(yard.id));
      await deleteYardAction(formData);
      addToast("Yard deleted", "info");
      navigate("/");
    } catch {
      addToast("Failed to delete yard", "error");
    }
  }

  const inputClass =
    "w-full rounded-lg border border-earth-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-garden-500 focus:ring-2 focus:ring-garden-500/20 focus:outline-none transition";
  const labelClass = "block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1";

  return (
    <div className="p-5 space-y-6">
      {/* Yard section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Yard</h3>
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Name</label>
            <input className={inputClass} type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Width (ft)</label>
              <input className={inputClass} type="number" min="10" max="1000" value={widthFt} onChange={(e) => setWidthFt(Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>Height (ft)</label>
              <input className={inputClass} type="number" min="10" max="1000" value={heightFt} onChange={(e) => setHeightFt(Number(e.target.value))} />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-earth-200 dark:border-gray-700" />

      {/* Garden settings section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Garden</h3>

        <div>
          <label className={labelClass}>Zip Code</label>
          <input
            className={inputClass}
            type="text"
            inputMode="numeric"
            maxLength={5}
            placeholder="Enter 5-digit zip code"
            value={zip}
            onChange={(e) => {
              userChangedZip.current = true;
              setZip(e.target.value.replace(/\D/g, "").slice(0, 5));
            }}
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Auto-detects zone and frost dates.</p>
        </div>

        <div>
          <label className={labelClass}>
            USDA Hardiness Zone
            {autoDetected && (
              <span className="ml-2 inline-flex items-center rounded-md bg-garden-50 dark:bg-garden-900/30 px-1.5 py-0.5 text-[10px] font-medium text-garden-700 dark:text-garden-400 ring-1 ring-inset ring-garden-600/20">
                Auto
              </span>
            )}
          </label>
          <select className={inputClass} value={zone} onChange={(e) => { setZone(e.target.value); setAutoDetected(false); }}>
            <option value="">Select a zone</option>
            {zones.map((z) => <option key={z} value={z}>Zone {z}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Last Frost (Spring)</label>
            <input className={inputClass} type="date" value={lastFrost} onChange={(e) => { setLastFrost(e.target.value); setAutoDetected(false); }} />
          </div>
          <div>
            <label className={labelClass}>First Frost (Fall)</label>
            <input className={inputClass} type="date" value={firstFrost} onChange={(e) => { setFirstFrost(e.target.value); setAutoDetected(false); }} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Location (for weather)</label>
          <div className="grid grid-cols-2 gap-3">
            <input className={inputClass} type="text" inputMode="decimal" placeholder="Latitude" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
            <input className={inputClass} type="text" inputMode="decimal" placeholder="Longitude" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-gray-400">For weather forecasts.</p>
            <button
              type="button"
              className="text-xs text-garden-600 dark:text-garden-400 hover:text-garden-700 cursor-pointer"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => { setLatitude(pos.coords.latitude.toFixed(4)); setLongitude(pos.coords.longitude.toFixed(4)); addToast("Location detected!", "success"); },
                    () => addToast("Could not detect location.", "error"),
                  );
                }
              }}
            >
              Detect location
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-earth-200 dark:border-gray-700" />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition cursor-pointer"
          onClick={handleDelete}
        >
          Delete Yard
        </button>
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium text-white bg-garden-600 hover:bg-garden-700 rounded-lg transition cursor-pointer disabled:opacity-50"
          onClick={handleSave}
          disabled={saving || !name.trim()}
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
