import { Link } from "react-flight-router/client";
import { db } from "../db/index.ts";
import { seedInventory, plants } from "../db/schema.ts";
import { eq, sql } from "drizzle-orm";
import { addSeed, deleteSeed } from "./seeds.actions.ts";
import { exportSeeds } from "./export.actions.ts";
import { SeedInventoryList, ExportButton } from "./seeds.client.tsx";

const Component = async () => {
  const allSeeds = await db
    .select({
      id: seedInventory.id,
      plantId: seedInventory.plantId,
      plantName: plants.name,
      variety: seedInventory.variety,
      brand: seedInventory.brand,
      purchaseDate: seedInventory.purchaseDate,
      expirationDate: seedInventory.expirationDate,
      quantityRemaining: seedInventory.quantityRemaining,
      quantityUnit: seedInventory.quantityUnit,
      lotNumber: seedInventory.lotNumber,
      notes: seedInventory.notes,
      seedViabilityYears: plants.seedViabilityYears,
    })
    .from(seedInventory)
    .leftJoin(plants, eq(seedInventory.plantId, plants.id))
    .orderBy(sql`${seedInventory.expirationDate} ASC`);

  const today = new Date();
  const threeMonthsOut = new Date();
  threeMonthsOut.setMonth(threeMonthsOut.getMonth() + 3);

  const seedsWithStatus = allSeeds.map((s) => {
    const isExpiring =
      s.expirationDate != null && new Date(s.expirationDate) <= threeMonthsOut;
    // Calculate viability percentage based on purchase date + viability years
    let viabilityPct: number | null = null;
    if (s.purchaseDate && s.seedViabilityYears) {
      const purchased = new Date(s.purchaseDate);
      const totalMs = s.seedViabilityYears * 365.25 * 24 * 60 * 60 * 1000;
      const elapsed = today.getTime() - purchased.getTime();
      viabilityPct = Math.max(0, Math.min(100, Math.round(((totalMs - elapsed) / totalMs) * 100)));
    }
    return { ...s, isExpiring, viabilityPct };
  });

  const allPlants = await db
    .select({ id: plants.id, name: plants.name })
    .from(plants)
    .orderBy(sql`${plants.name} ASC`);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link to="/" className="hover:text-garden-700 dark:hover:text-garden-400 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100">Seed Inventory</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100" style={{ viewTransitionName: "page-title" }}>Seed Inventory</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track your seed packets, viability, and quantities.
          </p>
        </div>
        <ExportButton exportAction={exportSeeds} label="Export CSV" />
      </div>

      <SeedInventoryList
        seeds={seedsWithStatus}
        plants={allPlants}
        addAction={addSeed}
        deleteAction={deleteSeed}
      />
    </main>
  );
};

export default Component;
