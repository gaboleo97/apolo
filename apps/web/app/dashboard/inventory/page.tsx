import { requireModule } from "../access";
import InventoryModule from "./InventoryModule";

export default async function InventoryPage() {
  await requireModule("inventory");
  return <InventoryModule />;
}
