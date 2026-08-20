import { requireModule } from "../access";
import ModulePlaceholder from "../_components/ModulePlaceholder";

export default async function SalesPage() {
  await requireModule("sales");
  return <ModulePlaceholder title="Ventas" description="Punto de venta y facturación." />;
}
