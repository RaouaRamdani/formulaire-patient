const express = require('express');
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const GMAIL_USER = process.env.GMAIL_USER || 'raouaram@gmail.com';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

if (!GMAIL_APP_PASSWORD) {
  console.warn('ATTENTION : GMAIL_APP_PASSWORD n\'est pas défini. L\'envoi d\'e-mail ne fonctionnera pas tant que la variable d\'environnement n\'est pas ajoutée.');
}

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'reservation.html'));
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD
  }
});

app.post('/', async (req, res) => {
  try {
    const { patientName, email, pdfBase64 } = req.body;

    if (!patientName || !email || !pdfBase64) {
      return res.status(400).json({
        success: false,
        message: 'Données incomplètes. Veuillez remplir tous les champs.'
      });
    }

    console.log('Traitement du patient :', patientName);

    const mailOptions = {
      from: GMAIL_USER,
      to: email,
      subject: 'Confirmation de réservation PDF',
      text: `Bonjour ${patientName},\n\nVeuillez trouver ci-joint le récapitulatif PDF de votre réservation.\n\nCordialement,`,
      attachments: [
        {
          filename: `Reservation_${String(patientName).replace(/\s+/g, '_')}.pdf`,
          content: Buffer.from(pdfBase64.split(',')[1] || pdfBase64, 'base64')
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    console.log('E-mail envoyé avec succès à :', email);

    res.json({ success: true, message: 'Réservation enregistrée et e-mail envoyé avec succès !' });
  } catch (error) {
    console.error('Erreur lors du traitement :', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi de l\'e-mail.' });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur : http://localhost:${PORT}`);
});