require("dotenv").config();
const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const cors = require("cors");
const cron = require("node-cron"); // Importa node-cron para la tarea periódica
const fetch = require('node-fetch'); // Importa fetch para hacer una solicitud HTTP

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

// Configurar multer para almacenar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const transporter = nodemailer.createTransport({
    service: "gmail",
    pool: true, // Habilita conexión persistente para acelerar envíos
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Evita problemas con certificados SSL
    },
});

// Endpoint para enviar un correo con archivo adjunto
app.post("/send-email", upload.single("pdf"), async (req, res) => {
  const { nombre, email, telefono, destinatario } = req.body;
  const pdfBuffer = req.file ? req.file.buffer : null;
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: destinatario, // Ahora el destinatario viene del campo 'destinatario'
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

// Endpoint 'ping' para mantener el servicio activo
app.get("/ping", (req, res) => {
  res.status(200).send("¡Estoy activo!");
});

// Tarea periódica para hacer una solicitud cada 50 segundos
cron.schedule('*/50 * * * * *', () => {
  fetch('http://localhost:3000/ping')
    .then(response => response.text())
    .then(data => console.log('Ping realizado:', data))
    .catch(error => console.error('Error al hacer el ping:', error));
});

app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});