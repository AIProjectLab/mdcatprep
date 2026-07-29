import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardClient from "./client";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const user = await currentUser();
  const hasAccess = user?.publicMetadata?.hasAccess === true;
  const paymentPending = user?.publicMetadata?.paymentPending === true;

  return <DashboardClient hasAccess={!!hasAccess} paymentPending={!!paymentPending} />;
}
