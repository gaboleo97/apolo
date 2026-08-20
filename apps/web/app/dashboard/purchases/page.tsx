import { requireModule } from "../access";
import ModulePlaceholder from "../_components/ModulePlaceholder";

export default async function PurchasesPage() {
  await requireModule("purchases");
  return <ModulePlaceholder title="Compras" description="Órdenes de compra y proveedores." />;
}
