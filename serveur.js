const express = require('express');
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Augmentation de la limite JSON pour pouvoir recevoir le PDF en Base64
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// Route principale pour afficher la page de réservation
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'reservation.html'));
});

// Configuration du service Nodemailer avec tes identifiants Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'raouaram@gmail.com',
    pass: 'oubw ruof wows psqt' // Ton mot de passe d'application Gmail
  }
});

// Route POST pour recevoir le PDF et l'envoyer par e-mail
app.post('/', async (req, res) => {
  try {
    const { patientName, email, pdfBase64 } = req.body;
    console.log("Traitement du patient :", patientName);

    const mailOptions = {
      from: 'raouaram@gmail.com',
      to: email,
      subject: 'Confirmation de réservation PDF',
      text: `Bonjour ${patientName},\n\nVeuillez trouver ci-joint le récapitulatif PDF de votre réservation.\n\nCordialement,`,
      attachments: [
        {
          filename: `Reservation_${patientName.replace(/\s+/g, '_')}.pdf`,
          path: pdfBase64 // Nodemailer gère directement l'URL Base64 envoyée par le client
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    console.log("E-mail envoyé avec succès à :", email);

    res.json({ success: true, message: "Réservation enregistrée et e-mail envoyé avec succès !" });

  } catch (error) {
    console.error("Erreur lors du traitement :", error);
    res.status(500).json({ success: false, message: "Erreur lors de l'envoi de l'e-mail." });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur démarré localement sur : http://localhost:${PORT}`);
});