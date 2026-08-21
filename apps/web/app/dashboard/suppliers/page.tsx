import { requireModule } from "../access";
import SuppliersModule from "./SuppliersModule";

export default async function SuppliersPage() {
  await requireModule("suppliers");
  return <SuppliersModule />;
}
