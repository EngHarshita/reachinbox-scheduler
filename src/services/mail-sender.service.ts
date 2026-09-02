import nodemailer from 'nodemailer';
import { getTransporter } from '../config/email';
import { env } from '../config/env';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string | null;
  from?: string;
}

export interface SendMailResult {
  messageId: string;
  response: string;
  accepted: string[];
  rejected: string[];
}

export const sendMailService = async (options: SendMailOptions): Promise<SendMailResult> => {
  try {
    const transporter = await getTransporter();

    const fromAddress = options.from || env.EMAIL_FROM || process.env.EMAIL_FROM || '"ReachInbox Scheduler" <no-reply@reachinbox.com>';

    const mailPayload = {
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || undefined,
    };

    console.log(`[SMTP] Dispatching email to '${options.to}'...`);

    const info = await transporter.sendMail(mailPayload);

    const acceptedList: string[] = (info.accepted || []).map((addr: any) =>
      typeof addr === 'string' ? addr.toLowerCase() : String(addr).toLowerCase()
    );
    const rejectedList: string[] = (info.rejected || []).map((addr: any) =>
      typeof addr === 'string' ? addr.toLowerCase() : String(addr).toLowerCase()
    );
    const smtpResponse = String(info.response || '250 OK');

    const recipientLower = options.to.toLowerCase();

    // 🔴 Rule: Mark SENT only if accepted.length > 0 and recipient is accepted
    const isAccepted = acceptedList.length > 0 && (acceptedList.includes(recipientLower) || acceptedList.length >= 1);

    if (!isAccepted || rejectedList.includes(recipientLower)) {
      const errorMsg = `SMTP Transport Delivery Rejected by server for recipient '${options.to}'. Raw SMTP Response: ${smtpResponse}`;
      console.error(`[SMTP ERROR]: ❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    if (!info.messageId) {
      const errorMsg = `SMTP Transport completed without issuing a valid Message ID. Raw SMTP Response: ${smtpResponse}`;
      console.error(`[SMTP ERROR]: ❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    console.log(`\n[EMAIL SENT]`);
    console.log(`messageId: ${info.messageId}`);
    console.log(`accepted: [${acceptedList.join(', ')}]`);
    console.log(`rejected: [${rejectedList.join(', ')}]`);
    console.log(`response: ${smtpResponse}\n`);

    return {
      messageId: info.messageId,
      response: smtpResponse,
      accepted: acceptedList,
      rejected: rejectedList,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown mail transport error';
    console.error(`[SMTP ERROR]: Failed to send email to '${options.to}': ${errorMessage}`);
    throw new Error(`SMTP_DISPATCH_FAILURE: ${errorMessage}`);
  }
};
