import express from "express";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

// Load environment variables from .env
dotenv.config();

import admin from "firebase-admin";

// Initialize firebase-admin gracefully
let adminAuth: admin.auth.Auth | null = null;
try {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: "gen-lang-client-0740939914"
    });
  }
  adminAuth = admin.auth();
  console.log("✅ [Server] Firebase Admin initialized correctly for managing authentication.");
} catch (error) {
  console.warn("⚠️ [Server] Firebase Admin failed to initialize automatically with Application Default Credentials. Trying metadata fallback...");
  try {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        projectId: "gen-lang-client-0740939914"
      });
    }
    adminAuth = admin.auth();
    console.log("✅ [Server] Firebase Admin initialized with fallback parameters successfully.");
  } catch (fallbackErr) {
    console.error("❌ [Server] Firebase Admin failed to initialize in fallback mode as well:", fallbackErr);
  }
}

const app = express();
const PORT = 3000;

app.use(express.json());

// API route to delete a user from Firebase Authentication
app.post("/api/admin/delete-auth-user", async (req, res) => {
  const { uid } = req.body;
  const authHeader = req.headers.authorization;

  if (!uid) {
    res.status(400).json({ error: "Falta el ID de usuario (uid)." });
    return;
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "No autorizado. Token de autenticación ausente." });
    return;
  }

  const idToken = authHeader.split("Bearer ")[1];

  if (!adminAuth) {
    res.status(500).json({ error: "El servicio Firebase Admin no está configurado en el servidor." });
    return;
  }

  try {
    // Decode and verify the ID token passed from client
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const email = decodedToken.email;

    // Direct check of privileged admin email domains/addresses
    const isAdmin = email === "rodrigo.s@lynchnet.com.ar" || email === "prodeonline.rs@gmail.com";
    if (!isAdmin) {
      res.status(403).json({ error: "Permisos insuficientes. Se requiere cuenta de administrador." });
      return;
    }

    // Delete user from Firebase Auth with graceful fallback for sandbox environment constraints
    try {
      await adminAuth.deleteUser(uid);
      console.log(`[Admin Server] Usuario Auth con UID ${uid} fue eliminado de Firebase.`);
      res.json({ success: true, message: "Usuario eliminado de Firebase Auth con éxito.", simulated: false });
    } catch (authErr: any) {
      const errMsg = (authErr.message || "").toLowerCase();
      if (errMsg.includes("identitytoolkit.googleapis.com") || errMsg.includes("identity toolkit api") || errMsg.includes("accessnotconfigured") || errMsg.includes("permission_denied")) {
        console.warn(`⚠️ [Admin Server] Firebase Authentication API (Identity Toolkit) is disabled on hosting project 310092683192. Proceeding with database purge helper.`);
        res.json({
          success: true,
          simulated: true,
          message: "API de autenticación deshabilitada en el sandbox. Procediendo con el purgado de perfil en base de datos Firestore.",
          warning: "La API de autenticación no está habilitada en el hosting global. Se eliminará el perfil y predicciones, pero el registro de mail en Firebase Auth requiere removal manual."
        });
      } else {
        throw authErr;
      }
    }
  } catch (error: any) {
    console.error(`❌ [Admin Server] Error al eliminar usuario Auth con UID ${uid}:`, error);
    res.status(500).json({ 
      error: "Error al eliminar usuario de Firebase Authentication.", 
      details: error.message || error 
    });
  }
});

// API route to check if real SMTP credentials are set
app.get("/api/smtp-status", (req, res) => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const isConfigured = !!(host && user && pass);
  res.json({ configured: isConfigured });
});

// API route to send high-fidelity responsive emails (SMTP with fallback)
app.post("/api/send-email", async (req, res) => {
  const { to, subject, text, html: clientHtml, template, name, code } = req.body;

  if (!to || !subject) {
    res.status(400).json({ error: "Faltan datos requeridos (destinatario o asunto)." });
    return;
  }

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM || "no-reply@prodeonline.com";
  // Determine if secure based on environment or port
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  // Compile HTML dynamically if a specific template is requested
  let compiledHtml = clientHtml || "";
  if (template === "verification") {
    compiledHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PRODE ONLINE</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b1329;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #0b1329;
      padding: 40px 0;
    }
    .main-card {
      width: 100%;
      max-width: 550px;
      margin: 0 auto;
      background-color: #0f172a;
      border-radius: 16px;
      padding: 40px 32px;
      box-sizing: border-box;
      text-align: center;
    }
    .trophy {
      font-size: 52px;
      margin-bottom: 12px;
      line-height: 1;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 900;
      color: #ffffff;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin: 0 0 4px 0;
    }
    .brand-subtitle {
      font-size: 14px;
      color: #94a3b8;
      margin: 0 0 32px 0;
      font-weight: 500;
    }
    .inner-box {
      background-color: #070d19;
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 32px 24px;
      text-align: center;
      box-sizing: border-box;
    }
    .greeting {
      font-size: 16px;
      font-weight: bold;
      color: #ffffff;
      margin: 0 0 12px 0;
    }
    .instruction {
      font-size: 13px;
      color: #cbd5e1;
      line-height: 1.6;
      margin: 0 0 24px 0;
    }
    .code-container {
      background-color: #040810;
      border: 1.5px solid #00bcff;
      border-radius: 12px;
      padding: 18px 20px;
      margin: 20px auto;
      display: inline-block;
      min-width: 220px;
      box-sizing: border-box;
    }
    .code-text {
      font-family: 'Courier New', Courier, monospace;
      font-size: 38px;
      font-weight: 950;
      color: #00e5ff;
      letter-spacing: 8px;
      margin: 0;
      line-height: 1;
      text-shadow: 0 0 10px rgba(0, 229, 255, 0.2);
    }
    .footer-decorator {
      text-align: left;
      margin-top: 24px;
      opacity: 0.6;
    }
    .dot-bubble {
      display: inline-block;
      background-color: #1e293b;
      border-radius: 12px;
      padding: 4px 10px;
      font-size: 10px;
      color: #ffffff;
      font-weight: bold;
    }
    .footer-note {
      font-size: 11px;
      color: #64748b;
      margin-top: 24px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main-card">
      <div class="trophy">🏆</div>
      <h1 class="brand-title">PRODE ONLINE</h1>
      <p class="brand-subtitle">Confirmación de Cuenta de Usuario</p>
      
      <div class="inner-box">
        <p class="greeting">¡Hola ${name || "Competidor"}!</p>
        <p class="instruction">
          Para finalizar tu registro y empezar a ingresar tus predicciones de partidos en tus grupos competitivos, utilizá el siguiente código de confirmación:
        </p>
        <div class="code-container">
          <p class="code-text">${code || "123456"}</p>
        </div>
        <div class="footer-decorator">
          <span class="dot-bubble">•••</span>
        </div>
      </div>
      
      <p class="footer-note">
        Este es un correo automático, por favor no lo respondas.<br>
        &copy; 2026 Prode Online. Todos los derechos reservados.
      </p>
    </div>
  </div>
</body>
</html>`;
  }

  console.log(`[Email Server] Solicitud de envío recibida para ${to}. Asunto: "${subject}"`);

  // Check if credentials exist; if not, fallback gracefully
  if (!host || !user || !pass) {
    console.warn("⚠️ [Email Server] SMTP_HOST, SMTP_USER o SMTP_PASS no configurados en .env.");
    console.log("------------------ CORREO SIMULADO ------------------");
    console.log(`De: "Prode Online" <${fromEmail}>`);
    console.log(`Para: ${to}`);
    console.log(`Asunto: ${subject}`);
    console.log(`Texto: ${text}`);
    console.log(`Html (Líneas): ${compiledHtml ? compiledHtml.split("\n").length : 0}`);
    console.log("-----------------------------------------------------");
    
    res.json({
      success: true,
      simulated: true,
      message: "Correo simulado con éxito. Para enviar correos reales, configure los secretos SMTP en los Ajustes.",
      code // Return the code back to the client for debugging/simulation if needed
    });
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    const info = await transporter.sendMail({
      from: `"Prode Online" <${fromEmail}>`,
      to,
      subject,
      text,
      html: compiledHtml,
    });

    console.log(`✅ [Email Server] Correo enviado exitosamente! Message ID: ${info.messageId}`);
    res.json({
      success: true,
      simulated: false,
      messageId: info.messageId,
      message: "Correo electrónico real enviado de manera exitosa."
    });
  } catch (error: any) {
    console.error("❌ [Email Server] Falló el envío de correo real:", error);
    res.status(500).json({
      error: "Error interno al enviar correo SMTP real.",
      details: error.message || error
    });
  }
});

// Serve Frontend Assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development server with HMR setup through Express
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving static files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 [Server] Prode Online corriendo en http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
