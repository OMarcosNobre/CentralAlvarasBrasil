const Request = require('../models/Request');

const generateRandomProtocol = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let protocol = '';
  let hasNumber = false;

  // Garante pelo menos 1 número
  while (protocol.length < 6) {
    const char = chars[Math.floor(Math.random() * chars.length)];
    if (/[0-9]/.test(char)) hasNumber = true;
    protocol += char;
  }

  // Se não tiver número, substitui último caractere por um número
  if (!hasNumber) {
    const numbers = '0123456789';
    const randomNumber = numbers[Math.floor(Math.random() * numbers.length)];
    protocol = protocol.slice(0, -1) + randomNumber;
  }

  return protocol;
};

const generateProtocol = async () => {
  let protocol;
  let existingRequest;
  
  // Tenta até encontrar um protocolo único
  do {
    protocol = generateRandomProtocol();
    existingRequest = await Request.findOne({ protocolo: protocol });
  } while (existingRequest);

  return protocol;
};

module.exports = { generateProtocol };