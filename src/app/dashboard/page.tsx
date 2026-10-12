import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/server/auth";
import { publicUser } from "@/server/db";
import { DashboardApp } from "@/components/dashboard/DashboardApp";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your Loopix web account and launcher profiles.",
  robots: { index: false },
};

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/dashboard");

  return (
    <section className="mx-auto max-w-5xl px-5 py-24 lg:py-28">
      <DashboardApp initial={publicUser(user)} />
    </section>
  );
}
