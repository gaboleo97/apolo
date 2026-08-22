import { requireModule } from "../../access";
import DesignerClient from "./DesignerClient";

export default async function PrintDesignerPage() {
  await requireModule("sales");
  return <DesignerClient />;
}
