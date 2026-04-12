import { NextResponse } from "next/server";
import { z } from "zod/v4";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email/send-verification";

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.email(),
  password: z.string().min(8).max(100),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const verifyToken = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db.user.create({
    data: { name, email, passwordHash },
  });

  await db.verificationToken.create({
    data: { identifier: email, token: verifyToken, expires },
  });

  try {
    await sendVerificationEmail(email, verifyToken);
  } catch (err) {
    console.error("Failed to send verification email:", err);
  }

  return NextResponse.json(
    { message: "Account created. Check your email to verify." },
    { status: 201 }
  );
}
