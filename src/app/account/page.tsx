import { redirect } from "next/navigation";

/** The account page moved to the new dashboard. */
export default function AccountPage() {
  redirect("/dashboard");
}
