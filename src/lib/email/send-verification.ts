import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendVerificationEmail(
  email: string,
  token: string
) {
  const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify?token=${token}`;

  await getResend().emails.send({
    from: "AdForge <noreply@ads.slederer.com>",
    to: email,
    subject: "Verify your AdForge account",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #4f46e5); width: 48px; height: 48px; border-radius: 12px; line-height: 48px; color: white; font-size: 24px; font-weight: bold;">A</div>
        </div>
        <h1 style="font-size: 24px; font-weight: 600; text-align: center; color: #18181b; margin-bottom: 8px;">Verify your email</h1>
        <p style="font-size: 15px; color: #71717a; text-align: center; line-height: 1.6; margin-bottom: 32px;">
          Click the button below to verify your email address and activate your AdForge account.
        </p>
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 600;">
            Verify Email Address
          </a>
        </div>
        <p style="font-size: 13px; color: #a1a1aa; text-align: center; line-height: 1.5;">
          This link expires in 24 hours. If you didn't create an account, you can ignore this email.
        </p>
      </div>
    `,
  });
}
