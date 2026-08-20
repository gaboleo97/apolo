import { requireModule } from "../access";
import ModulePlaceholder from "../_components/ModulePlaceholder";

export default async function AccountingPage() {
  await requireModule("accounting");
  return <ModulePlaceholder title="Contabilidad" description="Asientos, libros IVA y reportes financieros." />;
}
