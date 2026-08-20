import { requireTenantAdmin } from "../access";
import TeamManager from "./TeamManager";

export default async function TeamPage() {
  await requireTenantAdmin();
  return <TeamManager />;
}
