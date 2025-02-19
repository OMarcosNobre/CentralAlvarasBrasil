// security/index.js
const createRateLimiter = require('./rateLimiter');
const { checkBlacklist } = require('./blacklist');
const validatePatterns = require('./patterns');
const timeCheck = require('./timeCheck');
const validateHeaders = require('./headerValidation');

module.exports = {
  createRateLimiter,
  checkBlacklist,
  validatePatterns,
  timeCheck,
  validateHeaders
};