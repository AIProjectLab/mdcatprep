import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import PaymentPageClient from "./client";

export default async function PaymentPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";

  return <PaymentPageClient userId={userId} email={email} />;
}
