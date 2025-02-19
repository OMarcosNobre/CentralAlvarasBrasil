// security/headerValidation.js
const validateHeaders = (req, res, next) => {
    const userAgent = req.headers['user-agent'];
    const acceptLanguage = req.headers['accept-language'];
    const contentType = req.headers['content-type'];
  
    if (!userAgent || !acceptLanguage || !contentType) {
      const { addToBlacklist } = require('./blacklist');
      addToBlacklist(req.ip);
      return res.status(400).json({
        success: false,
        message: 'Cabeçalhos inválidos'
      });
    }
  
    // Verificar User-Agent suspeito
    const suspiciousUserAgents = ['curl', 'python', 'bot', 'script'];
    if (suspiciousUserAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
      const { addToBlacklist } = require('./blacklist');
      addToBlacklist(req.ip);
      return res.status(400).json({
        success: false,
        message: 'Acesso não permitido'
      });
    }
  
    next();
  };
  
  module.exports = validateHeaders;