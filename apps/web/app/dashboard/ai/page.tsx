import { requireModule } from "../access";
import ModulePlaceholder from "../_components/ModulePlaceholder";

export default async function AiPage() {
  await requireModule("ai");
  return <ModulePlaceholder title="AI Analytics" description="Predicciones de demanda y detección de anomalías." />;
}
