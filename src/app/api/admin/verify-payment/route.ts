import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const { userId: adminId } = await auth();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await clerkClient();
  const adminUser = await client.users.getUser(adminId);

  if (adminUser.publicMetadata?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await req.json();

  await client.users.updateUser(userId, {
    publicMetadata: {
      hasAccess: true,
      paymentPending: false,
      verifiedBy: adminId,
      verifiedAt: new Date().toISOString(),
    },
  });

  return NextResponse.json({ success: true });
}
