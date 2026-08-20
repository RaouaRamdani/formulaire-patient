const nodemailer = require('nodemailer');
const { google } = require('googleapis');

async function appendToSheet(rowData) {
  const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );

  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Feuille 1!A:S', // le nom exact de l'onglet sheet 
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [rowData]
    }
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ success: true, message: 'API ready.' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Méthode non autorisée. Utilisez POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const {
      patientName, email, pdfBase64,
      passportNo, patientAge, patientHeight, patientWeight, patientCountry,
      flightArrivalCode, flightDepartureCode, procedure, diagnosticNumber,
      arrivalDate, operationDate, departureDate,
      currency, totalAmount, paidAmount, remainingAmount
    } = body;

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

    // 1. Écriture dans le Google Sheet
    try {
      await appendToSheet([
        new Date().toLocaleString('fr-FR'),
        patientName,
        email,
        passportNo || '',
        patientAge || '',
        patientHeight || '',
        patientWeight || '',
        patientCountry || '',
        flightArrivalCode || '',
        flightDepartureCode || '',
        Array.isArray(procedure) ? procedure.join(', ') : (procedure || ''),
        diagnosticNumber || '',
        arrivalDate || '',
        operationDate || '',
        departureDate || '',
        currency || '',
        totalAmount || '',
        paidAmount || '',
        remainingAmount || ''
      ]);
    } catch (sheetError) {
      console.error('Erreur écriture Google Sheet :', sheetError);
      // On continue quand même l'envoi de l'email même si le Sheet échoue
    }

    // 2. Envoi de l'email avec le PDF en pièce jointe
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