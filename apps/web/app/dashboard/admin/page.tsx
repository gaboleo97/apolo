import { requireSuperAdmin } from "../access";
import AdminPanel from "./AdminPanel";

export default async function AdminPage() {
  await requireSuperAdmin();
  return <AdminPanel />;
}
