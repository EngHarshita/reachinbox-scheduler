import nodemailer, { Transporter } from 'nodemailer';
import { env } from './env';

let transporterPromise: Promise<Transporter> | null = null;

export const getTransporter = async (): Promise<Transporter> => {
  if (transporterPromise) {
    return transporterPromise;
  }

  transporterPromise = (async () => {
    const smtpUser = env.SMTP_USER || process.env.SMTP_USER;
    const smtpPass = env.SMTP_PASS || process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      console.error('[SMTP CRITICAL ERROR]: Missing required environment variables SMTP_USER and/or SMTP_PASS in .env file.');
      throw new Error('SMTP_CONFIG_ERROR: SMTP_USER and SMTP_PASS environment variables must be provided in .env');
    }

    const host = env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(env.SMTP_PORT) || 587;

    // Direct SSL ONLY for port 465. Port 587 MUST use STARTTLS (secure: false, requireTLS: true)
    const isSecure = port === 465 ? true : Boolean(env.SMTP_SECURE) && port !== 587;

    console.log(`[SMTP] Initializing Production Transport...`);
    console.log(`[SMTP] Host: ${host}`);
    console.log(`[SMTP] Port: ${port}`);
    console.log(`[SMTP] Secure (Direct SSL): ${isSecure}`);
    console.log(`[SMTP] Require TLS (STARTTLS): ${!isSecure}`);
    console.log(`[SMTP] User: ${smtpUser.replace(/(?<=^.{2}).*(?=@)/, '****')}`);

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: isSecure,
      requireTLS: !isSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    try {
      await transporter.verify();
      console.log(`[SMTP] Authenticated: SUCCESS`);
      console.log(`[SMTP] Transporter Status: VERIFIED & READY`);
    } catch (err: any) {
      console.error(`[SMTP FATAL ERROR]: Connection verification failed for host '${host}:${port}':`, err.message);
      transporterPromise = null;
      throw new Error(`SMTP_VERIFICATION_FAILURE: ${err.message}`);
    }

    return transporter;
  })();

  return transporterPromise;
};
