// security/rateLimiter.js
const rateLimit = require('express-rate-limit');

const createRateLimiter = () => rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // limite de 5 requisições
  message: {
    success: false,
    message: 'Tente novamente mais tarde'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = createRateLimiter;

// security/blacklist.js
const blacklist = new Map();

const checkBlacklist = (req, res, next) => {
  const ip = req.ip;
  
  if (blacklist.has(ip)) {
    const banTime = blacklist.get(ip);
    const now = Date.now();
    
    // Ban por 24 horas
    if (now - banTime < 24 * 60 * 60 * 1000) {
      return res.status(403).json({
        success: false,
        message: 'Acesso temporariamente bloqueado'
      });
    } else {
      blacklist.delete(ip);
    }
  }
  
  next();
};

const addToBlacklist = (ip) => {
  blacklist.set(ip, Date.now());
};

module.exports = { checkBlacklist, addToBlacklist };