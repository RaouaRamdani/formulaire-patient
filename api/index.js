const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: 'API ready.'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Méthode non autorisée. Utilisez POST.'
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { patientName, email, pdfBase64 } = body;

    if (!patientName || !email || !pdfBase64) {
      return res.status(400).json({
        success: false,
        message: 'Données incomplètes. Veuillez remplir tous les champs.'
      });
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPassword) {
      return res.status(500).json({
        success: false,
        message: 'La configuration Gmail est incomplète sur Vercel.'
      });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPassword
      }
    });

    const base64Content = typeof pdfBase64 === 'string' && pdfBase64.includes(',')
      ? pdfBase64.split(',')[1]
      : pdfBase64;

    await transporter.sendMail({
      from: gmailUser,
      to: email,
      subject: 'Confirmation de réservation PDF',
      text: `Bonjour ${patientName},\n\nVeuillez trouver ci-joint le récapitulatif PDF de votre réservation.\n\nCordialement,`,
      attachments: [
        {
          filename: `Reservation_${String(patientName).replace(/\s+/g, '_')}.pdf`,
          content: Buffer.from(base64Content, 'base64')
        }
      ]
    });

    return res.status(200).json({
      success: true,
      message: 'Réservation enregistrée et e-mail envoyé avec succès !'
    });
  } catch (error) {
    console.error('Erreur envoi mail Vercel :', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de l\'e-mail.'
    });
  }
};
