import { requireModule } from "../access";
import SalesModule from "./SalesModule";

export default async function SalesPage() {
  await requireModule("sales");
  return <SalesModule />;
}
