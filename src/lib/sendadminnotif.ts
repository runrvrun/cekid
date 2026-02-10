import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAdminNotification({
  subject,
  message,
}: {
  subject: string;
  message: string;
}) {
  await resend.emails.send({
    from: "enakga <noreply@notif.enakga.com>",
    to: ["runrvrun@gmail.com"],
    subject,
    html: `<p>${message}</p>`,
  });
}