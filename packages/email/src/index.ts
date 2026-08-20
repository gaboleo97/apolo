import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "Apolo <noreply@apolo.app>";

let resend: Resend | null = null;
function getResend(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject,
    html,
  });
}

export async function sendWelcomeEmail(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: "Bienvenido a Apolo",
    html: `
      <h1>¡Bienvenido, ${name}!</h1>
      <p>Tu cuenta en Apolo ha sido creada exitosamente.</p>
      <p>Ya puedes acceder a todos los módulos disponibles en tu plan.</p>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  return sendEmail({
    to: email,
    subject: "Restablecer contraseña - Apolo",
    html: `
      <h1>Restablecer contraseña</h1>
      <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
      <a href="${resetUrl}">Restablecer contraseña</a>
    `,
  });
}
