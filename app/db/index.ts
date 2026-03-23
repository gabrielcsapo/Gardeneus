import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { eq } from "drizzle-orm";
import * as schema from "./schema.ts";
import plantsJsonRaw from "./plants.ts";
import pestsJsonRaw from "./pests.ts";

const sqlite = new Database("./data/garden.db");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

// Run pending migrations automatically on startup
migrate(db, { migrationsFolder: "./drizzle" });

// Auto-seed plants from plants.json on startup — the JSON file is the source of truth.
// Upserts by name so user-added plants (not in JSON) are preserved.
type PlantJson = {
  name: string;
  variety: string | null;
  description: string | null;
  category: string | null;
  family: string | null;
  zoneMin: string | null;
  zoneMax: string | null;
  sunRequirement: string | null;
  daysToHarvest: number | null;
  spacingInches: number | null;
  indoorStartWeeksBeforeFrost: number | null;
  directSowWeeksBeforeFrost: number | null;
  transplantWeeksAfterFrost: number | null;
  companions: string[] | null;
  incompatible: string[] | null;
  successionIntervalWeeks: number | null;
  waterNeeds: string | null;
  frostTolerance: string | null;
  growthHabit: string | null;
  matureHeightInches: number | null;
  rootDepth: string | null;
  expectedYieldPerPlant: number | null;
  expectedYieldUnit: string | null;
  seedViabilityYears: number | null;
  minSoilTempF: number | null;
  gddBaseTemp: number | null;
  gddToHarvest: number | null;
  nitrogenFixing: number | null;
  commonPests: string[] | null;
  commonDiseases: string[] | null;
  harvestWindowDays: number | null;
  storageLifeDays: number | null;
};

const plantsJson: PlantJson[] = plantsJsonRaw as unknown as PlantJson[];

for (const p of plantsJson) {
  const existing = db
    .select({ id: schema.plants.id })
    .from(schema.plants)
    .where(eq(schema.plants.name, p.name))
    .get();

  const plantData = {
    variety: p.variety,
    description: p.description,
    category: p.category,
    family: p.family,
    zoneMin: p.zoneMin,
    zoneMax: p.zoneMax,
    sunRequirement: p.sunRequirement,
    daysToHarvest: p.daysToHarvest,
    spacingInches: p.spacingInches,
    indoorStartWeeksBeforeFrost: p.indoorStartWeeksBeforeFrost,
    directSowWeeksBeforeFrost: p.directSowWeeksBeforeFrost,
    transplantWeeksAfterFrost: p.transplantWeeksAfterFrost,
    companions: p.companions as any,
    incompatible: p.incompatible as any,
    successionIntervalWeeks: p.successionIntervalWeeks,
    waterNeeds: p.waterNeeds,
    frostTolerance: p.frostTolerance,
    growthHabit: p.growthHabit,
    matureHeightInches: p.matureHeightInches,
    rootDepth: p.rootDepth,
    expectedYieldPerPlant: p.expectedYieldPerPlant,
    expectedYieldUnit: p.expectedYieldUnit,
    seedViabilityYears: p.seedViabilityYears,
    minSoilTempF: p.minSoilTempF,
    gddBaseTemp: p.gddBaseTemp,
    gddToHarvest: p.gddToHarvest,
    nitrogenFixing: p.nitrogenFixing,
    commonPests: p.commonPests as any,
    commonDiseases: p.commonDiseases as any,
    harvestWindowDays: p.harvestWindowDays,
    storageLifeDays: p.storageLifeDays,
  };

  if (existing) {
    db.update(schema.plants)
      .set(plantData)
      .where(eq(schema.plants.id, existing.id))
      .run();
  } else {
    db.insert(schema.plants)
      .values({ name: p.name, ...plantData })
      .run();
  }
}

// Auto-seed pest/disease reference data from pests.json
type PestJson = {
  name: string;
  type: string;
  description: string | null;
  symptoms: string | null;
  organicTreatments: string[] | null;
  preventionTips: string[] | null;
  affectedPlants: string[] | null;
  beneficialPredators: string[] | null;
  activeMonths: number[] | null;
};

const pestsJson: PestJson[] = pestsJsonRaw as unknown as PestJson[];

for (const p of pestsJson) {
  const existing = db
    .select({ id: schema.pestDisease.id })
    .from(schema.pestDisease)
    .where(eq(schema.pestDisease.name, p.name))
    .get();

  const pestData = {
    type: p.type,
    description: p.description,
    symptoms: p.symptoms,
    organicTreatments: p.organicTreatments as any,
    preventionTips: p.preventionTips as any,
    affectedPlants: p.affectedPlants as any,
    beneficialPredators: p.beneficialPredators as any,
    activeMonths: p.activeMonths as any,
  };

  if (existing) {
    db.update(schema.pestDisease)
      .set(pestData)
      .where(eq(schema.pestDisease.id, existing.id))
      .run();
  } else {
    db.insert(schema.pestDisease)
      .values({ name: p.name, ...pestData })
      .run();
  }
}
