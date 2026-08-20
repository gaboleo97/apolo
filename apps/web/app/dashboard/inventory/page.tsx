import { requireModule } from "../access";
import ModulePlaceholder from "../_components/ModulePlaceholder";

export default async function InventoryPage() {
  await requireModule("inventory");
  return <ModulePlaceholder title="Inventario" description="Control de stock, productos y categorías." />;
}
