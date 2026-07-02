import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import DashboardNav from "./nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <DashboardNav name={session.name} role={session.role} />
      <main className="flex-1 bg-ink-50 p-6 lg:p-8">{children}</main>
    </div>
  );
}
