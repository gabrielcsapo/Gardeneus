import { db } from "../db/index.ts";
import { yards } from "../db/schema.ts";
import { HomeRedirect } from "./home.client.tsx";

const Component = async () => {
  const firstYard = await db.select({ id: yards.id }).from(yards).limit(1).then((r) => r[0]);
  return <HomeRedirect to={firstYard ? `/yard/${firstYard.id}` : "/yard"} />;
};

export default Component;
