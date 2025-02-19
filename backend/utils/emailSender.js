const nodemailer = require('nodemailer');

// Criar transportador com configurações específicas do Zoho
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com', // Alterado para smtp.zoho.com
  port: 465,
  secure: true, // true para porta 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  debug: true // Ativar logs para debug
});

const sendEmail = async (to, subject, text, attachments) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado:', info.messageId);
    return info;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw error;
  }
};

const testConnection = async () => {
  try {
    console.log('Testando conexão com Zoho Mail...');
    console.log('Usando email:', process.env.EMAIL_USER);
    const result = await transporter.verify();
    console.log('Conexão com Zoho estabelecida:', result);
    return true;
  } catch (error) {
    console.error('Erro na conexão com Zoho:', {
      message: error.message,
      code: error.code,
      command: error.command
    });
    return false;
  }
};

module.exports = { sendEmail, testConnection };