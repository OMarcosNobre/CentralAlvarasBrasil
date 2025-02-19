// security/timeCheck.js
const timeCheck = (req, res, next) => {
    const { timestamp } = req.body;
    
    if (!timestamp) {
      return res.status(400).json({
        success: false,
        message: 'Requisição inválida'
      });
    }
  
    const submissionTime = Date.now() - parseInt(timestamp);
    const minimumTime = 3000; // 3 segundos
  
    if (submissionTime < minimumTime) {
      const { addToBlacklist } = require('./blacklist');
      addToBlacklist(req.ip);
      return res.status(400).json({
        success: false,
        message: 'Requisição muito rápida'
      });
    }
  
    next();
  };
  
  module.exports = timeCheck;