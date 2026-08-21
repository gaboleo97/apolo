import { requireModule } from "../access";
import ClientsModule from "./ClientsModule";

export default async function ClientsPage() {
  await requireModule("clients");
  return <ClientsModule />;
}
