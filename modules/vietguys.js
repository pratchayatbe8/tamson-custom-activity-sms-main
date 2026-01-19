const axios = require('axios');
const config = require('../config.js');
const logger = require('./logger');
const FormData = require('form-data');

const sms = {};

sms.sendMessage = async (payload) => {
    const options = {
        method : 'post',
        url : config.sms.oaEndpoint,
        responseType : 'json',
        data : payload,
        headers : {
            'Content-Type': 'application/json',
        }
    }

    try {
        const response = await axios(options);
        return response.data;
      } catch (error) {
        if (error.response) {
          return error.response.data;
        }
        return {
          error: 9999,
          message: error.message
        };
      }
}

module.exports = sms;