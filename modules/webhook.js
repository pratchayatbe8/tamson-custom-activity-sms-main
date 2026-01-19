const mc = require('./mc'); 
const config = require('../config');
const logger = require('./logger');

const webhook = {}; 

webhook.processRequest = async (req, res) => {
  // Webhook IS NOT Implemented for SMS
}

module.exports = webhook; 