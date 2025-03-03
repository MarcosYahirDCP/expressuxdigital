import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import nodemailer from "nodemailer";
import cors from "cors";
import cron from "node-cron";
import fetch from "node-fetch"; // Usar import en lugar de require

dotenv.config();
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const transporter = nodemailer.createTransport({
  service: "gmail",
  pool: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

app.post("/send-email", upload.single("pdf"), async (req, res) => {
  const { nombre, email, telefono, destinatario } = req.body;
  const pdfBuffer = req.file ? req.file.buffer : null;
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: destinatario,
      subject: "Documento PDF Adjunto",
      text: `Hola ${nombre},\n\nHas recibido un archivo adjunto.\nTeléfono: ${telefono}\nCorreo remitente: ${email}`,
      attachments: pdfBuffer ? [{ filename: "documento.pdf", content: pdfBuffer }] : [],
    };

    let info = await transporter.sendMail(mailOptions);
    console.log("✅ Correo enviado correctamente:", info.response);
    res.status(200).json({ message: "Correo enviado con éxito" });
  } catch (error) {
    console.error("❌ Error al enviar el correo:", error);
    res.status(500).json({ error: "Error al enviar el correo" });
  }
});

app.get("/ping", (req, res) => {
  res.status(200).send("¡Estoy activo!");
});

cron.schedule("*/40 * * * * *", async () => {
  try {
    const response = await fetch("http://localhost:3000/ping");
    const data = await response.text();
    console.log("Ping realizado:", data);
  } catch (error) {
    console.error("Error al hacer el ping:", error);
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});
