import { db } from "../db/index.ts";
import { seedInventory, plants } from "../db/schema.ts";
import { eq, sql } from "drizzle-orm";
import { addSeed, deleteSeed } from "./seeds.actions.ts";
import { exportSeeds } from "./export.actions.ts";
import { SeedInventoryList, ExportButton } from "./seeds.client.tsx";
import { RouteSlideOver } from "../components/route-slide-over.client.tsx";

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
    <RouteSlideOver title="Seed Inventory" width="w-[580px]">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track your seed packets, viability, and quantities.
          </p>
          <ExportButton exportAction={exportSeeds} label="Export CSV" />
        </div>
        <SeedInventoryList
          seeds={seedsWithStatus}
          plants={allPlants}
          addAction={addSeed}
          deleteAction={deleteSeed}
        />
      </div>
    </RouteSlideOver>
  );
};

export default Component;
