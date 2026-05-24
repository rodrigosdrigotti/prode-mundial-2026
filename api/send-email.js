import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Método no permitido",
    });
  }

  try {
    const { to, subject, text, html } = req.body;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"Prode Online" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      text,
      html,
    });

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
    });

  } catch (error) {
    console.error("SMTP ERROR:", error);

    return res.status(500).json({
      success: false,
      error: String(error),
    });
  }
}
