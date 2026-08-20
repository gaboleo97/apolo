import { requireModule } from "../access";
import ModulePlaceholder from "../_components/ModulePlaceholder";

export default async function SuppliersPage() {
  await requireModule("suppliers");
  return <ModulePlaceholder title="Proveedores" description="Gestión de proveedores y pagos." />;
}
