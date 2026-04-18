import { Resend } from "resend";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

async function sendEmail({ to, subject, html }: EmailPayload) {
  if (!resend || !process.env.EMAIL_FROM) {
    return { skipped: true };
  }

  return resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
}

export async function sendMentorshipRequestEmail(input: {
  alumniEmail: string;
  alumniName: string;
  studentName: string;
  subject: string;
  goals: string;
  message: string;
}) {
  return sendEmail({
    to: input.alumniEmail,
    subject: `New mentorship request from ${input.studentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #1f2937;">
        <h2>New mentorship request</h2>
        <p>Hello ${input.alumniName},</p>
        <p>${input.studentName} has requested mentorship through the BVRITH Alumni Portal.</p>
        <p><strong>Topic:</strong> ${input.subject}</p>
        <p><strong>Goals:</strong> ${input.goals}</p>
        <p><strong>Message:</strong><br />${input.message}</p>
        <p>Please sign in to your dashboard to accept or reject the request.</p>
      </div>
    `,
  });
}

export async function sendMentorshipStatusEmail(input: {
  studentEmail: string;
  studentName: string;
  alumniName: string;
  subject: string;
  status: "ACCEPTED" | "REJECTED";
  responseMessage?: string | null;
}) {
  const statusText = input.status === "ACCEPTED" ? "accepted" : "updated";

  return sendEmail({
    to: input.studentEmail,
    subject: `Your mentorship request was ${statusText}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #1f2937;">
        <h2>Mentorship request ${input.status.toLowerCase()}</h2>
        <p>Hello ${input.studentName},</p>
        <p>${input.alumniName} has ${input.status.toLowerCase()} your request about <strong>${input.subject}</strong>.</p>
        ${
          input.responseMessage
            ? `<p><strong>Response from mentor:</strong><br />${input.responseMessage}</p>`
            : ""
        }
        <p>Please sign in to the portal to view the latest details.</p>
      </div>
    `,
  });
}
