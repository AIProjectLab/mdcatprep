import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { userId, email, transactionId } = await req.json();
    const client = await clerkClient();

    await client.users.updateUser(userId, {
      publicMetadata: {
        paymentPending: true,
        transactionId,
        paymentEmail: email,
        paymentDate: new Date().toISOString(),
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
