import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { userId, email, transactionId, payerName } = await req.json();
    if (!payerName?.trim() || !transactionId?.trim()) {
      return NextResponse.json({ error: "Name and transaction ID are required" }, { status: 400 });
    }
    const client = await clerkClient();

    await client.users.updateUser(userId, {
      publicMetadata: {
        paymentPending: true,
        transactionId,
        payerName: payerName.trim(),
        paymentEmail: email,
        paymentDate: new Date().toISOString(),
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
