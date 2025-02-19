// security/patterns.js

// Função auxiliar para validar CPF
const validateCPF = (cpf) => {
  // Remove caracteres não numéricos
  cpf = cpf.replace(/[^\d]/g, '');

  // Verifica se tem 11 dígitos
  if (cpf.length !== 11) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let firstDigit = 11 - (sum % 11);
  if (firstDigit > 9) firstDigit = 0;
  if (firstDigit !== parseInt(cpf.charAt(9))) return false;

  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  let secondDigit = 11 - (sum % 11);
  if (secondDigit > 9) secondDigit = 0;
  if (secondDigit !== parseInt(cpf.charAt(10))) return false;

  return true;
};

const validatePatterns = (req, res, next) => {
  const { email, cpf, oab } = req.body;

  // Validar email
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Formato de email inválido'
    });
  }

  // Validar domínios suspeitos
  const suspiciousDomains = ['temp-mail', 'tempmail', 'disposable', 'mailinator'];
  if (suspiciousDomains.some(domain => email.includes(domain))) {
    const { addToBlacklist } = require('./blacklist');
    addToBlacklist(req.ip);
    return res.status(400).json({
      success: false,
      message: 'Email não permitido'
    });
  }

  // Validar CPF usando o algoritmo completo
  if (!validateCPF(cpf)) {
    return res.status(400).json({
      success: false,
      message: 'CPF inválido'
    });
  }

  // Validar OAB (formato básico)
  const oabPattern = /^\d{1,6}$/;
  if (!oabPattern.test(oab)) {
    return res.status(400).json({
      success: false,
      message: 'Formato de OAB inválido'
    });
  }

  next();
};

module.exports = validatePatterns;