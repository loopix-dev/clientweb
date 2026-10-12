import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/server/auth";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/dashboard");
  return <div className="mx-auto max-w-6xl px-5 py-24 lg:py-28">{children}</div>;
}
