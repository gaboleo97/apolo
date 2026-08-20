import { requireModule } from "../access";
import ModulePlaceholder from "../_components/ModulePlaceholder";

export default async function ClientsPage() {
  await requireModule("clients");
  return <ModulePlaceholder title="Clientes" description="Gestión de clientes y deudas." />;
}
