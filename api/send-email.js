import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Método no permitido",
    });
  }

  try {
    const {
      to,
      subject,
      text,
      html,
      template,
      name,
      code
    } = req.body;

    let compiledHtml = html || "";

    // TEMPLATE VERIFICACIÓN
    if (template === "verification") {
      compiledHtml = `
      <div style="background:#0b1329;padding:40px;font-family:Arial,sans-serif;color:white;text-align:center;">
        
        <div style="max-width:550px;margin:auto;background:#0f172a;padding:40px;border-radius:18px;">
          
          <div style="font-size:52px;">🏆</div>

          <h1 style="
            font-size:32px;
            margin:10px 0;
            color:white;
            letter-spacing:2px;
          ">
            PRODE ONLINE
          </h1>

          <p style="
            color:#94a3b8;
            margin-bottom:35px;
          ">
            Confirmación de Cuenta
          </p>

          <div style="
            background:#070d19;
            border:1px solid #1e293b;
            border-radius:14px;
            padding:30px;
          ">

            <p style="
              font-size:18px;
              font-weight:bold;
              margin-bottom:14px;
            ">
              ¡Hola ${name || "Competidor"}!
            </p>

            <p style="
              color:#cbd5e1;
              line-height:1.6;
              margin-bottom:30px;
            ">
              Para finalizar tu registro y empezar a ingresar tus predicciones utilizá el siguiente código:
            </p>

            <div style="
              background:#020617;
              border:2px solid #00e5ff;
              border-radius:14px;
              padding:22px;
              display:inline-block;
            ">
              <div style="
                font-size:42px;
                font-weight:900;
                color:#00e5ff;
                letter-spacing:10px;
                font-family:monospace;
              ">
                ${code}
              </div>
            </div>

          </div>

          <p style="
            margin-top:30px;
            color:#64748b;
            font-size:12px;
          ">
            © 2026 Prode Online
          </p>

        </div>
      </div>
      `;
    }

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
      html: compiledHtml,
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
