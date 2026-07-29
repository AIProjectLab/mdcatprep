import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  if (user.publicMetadata?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const usersList = await client.users.getUserList({ limit: 100 });

  const requests = usersList.data
    .filter((u: { publicMetadata?: Record<string, unknown> }) => u.publicMetadata?.paymentPending === true)
    .map((u: { id: string; emailAddresses?: Array<{ emailAddress: string }>; publicMetadata?: Record<string, unknown> }) => ({
      id: u.id,
      email: u.emailAddresses?.[0]?.emailAddress ?? "",
      transactionId: (u.publicMetadata?.transactionId as string) || "",
      date: (u.publicMetadata?.paymentDate as string) || "",
    }));

  return NextResponse.json({ requests });
}
