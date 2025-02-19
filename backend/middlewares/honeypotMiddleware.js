const checkHoneypot = (req, res, next) => {
    // Verifica se existe algum dos campos honeypot comuns
    const honeypotFields = ['username', 'name', 'email', 'website'];
    
    const hasHoneypot = honeypotFields.some(field => {
      return req.body[field] !== undefined && req.body[field] !== '';
    });
  
    if (hasHoneypot) {
      // Se o honeypot foi preenchido, retorna erro 400 sem revelar o motivo
      return res.status(400).json({ 
        success: false, 
        message: 'Requisição inválida' 
      });
    }
  
    next();
  };
  
  module.exports = checkHoneypot;