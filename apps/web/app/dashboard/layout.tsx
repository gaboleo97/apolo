import { auth } from "@apolo/auth";
import DashboardShell from "./shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;

  return (
    <DashboardShell
      modules={user?.modules ?? []}
      role={user?.role ?? "viewer"}
      userName={user?.name ?? user?.email}
      userEmail={user?.email}
    >
      {children}
    </DashboardShell>
  );
}
