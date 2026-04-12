import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const verificationToken = await db.verificationToken.findFirst({
    where: { token },
  });

  if (!verificationToken) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  if (verificationToken.expires < new Date()) {
    await db.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: verificationToken.token,
        },
      },
    });
    return NextResponse.json({ error: "Token expired" }, { status: 400 });
  }

  await db.user.update({
    where: { email: verificationToken.identifier },
    data: { emailVerified: new Date() },
  });

  await db.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: verificationToken.identifier,
        token: verificationToken.token,
      },
    },
  });

  return NextResponse.json({ message: "Email verified" });
}
