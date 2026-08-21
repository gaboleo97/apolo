import { requireSession } from "../access";
import AccountForm from "./AccountForm";

export default async function AccountPage() {
  await requireSession();
  return <AccountForm />;
}
