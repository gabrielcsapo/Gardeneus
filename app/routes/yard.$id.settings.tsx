import { db } from "../db/index.ts";
import { settings, yards } from "../db/schema.ts";
import { eq } from "drizzle-orm";
import { USDA_ZONES } from "../lib/zones.ts";
import { updateYard, deleteYard } from "./yard.actions.ts";
import zipZoneData from "../db/zip-zones.json";
import { RouteSlideOver } from "../components/route-slide-over.client.tsx";
import { CombinedSettingsForm } from "./yard.$id.settings.client.tsx";

const Component = async ({ params }: { params?: Record<string, string> }) => {
  const yardId = Number(params?.id);

  const [currentSettings, yard] = await Promise.all([
    db.select().from(settings).limit(1).then((r) => r[0] ?? null),
    db.select().from(yards).where(eq(yards.id, yardId)).then((r) => r[0] ?? null),
  ]);

  if (!yard) {
    return (
      <RouteSlideOver title="Settings" width="w-[480px]">
        <div className="p-5 text-sm text-gray-500">Yard not found.</div>
      </RouteSlideOver>
    );
  }

  return (
    <RouteSlideOver title="Settings" width="w-[480px]">
      <CombinedSettingsForm
        yard={{ id: yard.id, name: yard.name, widthFt: yard.widthFt, heightFt: yard.heightFt }}
        currentSettings={currentSettings}
        zipZoneData={zipZoneData as Record<string, { zone: string; lastFrost: string; firstFrost: string }>}
        zones={USDA_ZONES}
        updateYardAction={updateYard}
        deleteYardAction={deleteYard}
      />
    </RouteSlideOver>
  );
};

export default Component;
