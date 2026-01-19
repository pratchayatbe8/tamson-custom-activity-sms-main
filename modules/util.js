const mc = require('./mc');
const NodeCache = require('node-cache');
const myCache = new NodeCache( { stdTTL: 3600 });
const config = require('../config');

const util = {};

util.addToCache = (key, value) => {
    myCache.set(key, value);
}

util.getFromCache = (key) => {
    return myCache.get(key);
}

util.getSMSAccessToken = async (oaIdOrAppId) => {
    let accessToken = myCache.get(oaIdOrAppId);
    
    if(accessToken){
        return accessToken; 
    }

    let oaRecords = await mc.getDERows(config.sfmc.senderDe, ['Access_Token'], {
        'leftOperand' : {
            'leftOperand': 'OA_ID',
            'operator': 'equals',
            'rightOperand': oaIdOrAppId
        },
        'operator' : 'OR',
        'rightOperand' : {
            'leftOperand': 'App_ID',
            'operator': 'equals',
            'rightOperand': oaIdOrAppId
        }
    });
   
    accessToken = oaRecords[0].Access_Token;
    myCache.set(oaIdOrAppId, accessToken);

    return accessToken;
};

util.getContent = async (contentId) => {
    let content = myCache.get(`content_${contentId}`); 

    if(content){
        return content;
    }

    content = await mc.getContentById(contentId, 'meta'); 
    myCache.set(`content_${contentId}`, content);

    return content;
}


util.sleep = (miliSeconds) => {
    return new Promise( resolve => {
        setTimeout(resolve, miliSeconds);
    });
};


module.exports = util;