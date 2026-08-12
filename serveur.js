const express = require('express');
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { jsPDF } = require('jspdf');



const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'reservation.html'));
});

app.listen(PORT, () => {
    console.log(`Serveur démarré localement sur : http://localhost:${PORT}`);
});

// 1. Configuration du service d'envoi d'e-mail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'raouaram@gmail.com',
    pass: 'oubw ruof wows psqt'
  }
});

// 2. Route de réception et de traitement
app.get('/', (req, res) => {
  res.send('Serveur actif et prêt à recevoir des réservations.');
});

app.post('/', async (req, res) => {
  try {
    const data = req.body;
    console.log("Traitement du patient :", data.patientName);

    // --- A. Génération du PDF ---
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(`Fiche de Réservation patient ${data.patientId}`, 20, 20);

    doc.setFontSize(12);
    doc.text(`Nom du Patient : ${data.patientName}`, 20, 40);
    doc.text(`ID Patient : ${data.patientId}`, 20, 50);
    doc.text(`Procédures : ${data.procedures.join(', ')}`, 20, 60);
    doc.text(`Date d'arrivée : ${data.arrivalDate}`, 20, 70);
    doc.text(`Date d'opération : ${data.operationDate}`, 20, 80);
    doc.text(`Date de départ : ${data.departureDate}`, 20, 90);
    doc.text(`Montant Total : ${data.totalAmount} ${data.currency}`, 20, 100);

    // Conversion du PDF en Buffer (format lisible par Nodemailer)
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // --- B. Options de l'e-mail ---
    const mailOptions = {
      from: 'ton.email@gmail.com',         // Ton adresse
      to: data.email,                    // L'adresse saisie dans le formulaire !
      subject: 'Confirmation de réservation PDF',
      text: `\n\nVeuillez trouver ci-joint le récapitulatif PDF de votre réservation.\n\nCordialement,`,
      attachments: [
        {
          filename: `Reservation_${data.patientName.replace(/\s+/g, '_')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    // --- C. Envoi de l'e-mail ---
    await transporter.sendMail(mailOptions);
    console.log("E-mail envoyé avec succès à :", data.email);

    res.json({ success: true, message: "Réservation enregistrée et e-mail envoyé avec succès !" });

  } catch (error) {
    console.error("Erreur lors du traitement :", error);
    res.status(500).json({ success: false, message: "Erreur lors de l'envoi de l'e-mail." });
  }
});
