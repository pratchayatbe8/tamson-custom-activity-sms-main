/**
 * ============================================================================
 * Configuration & ENV Variables
 * ============================================================================
 */

require('dotenv').config();

/**
 * Validate that required environment variables exist.
 */


const config = {
    sfmc: {
        clientId: process.env.CLIENT_ID || '',
        clientSecret: process.env.CLIENT_SECRET || '',
        stack: process.env.STACK || '',
        origin: process.env.ORIGIN || '',
        authOrigin: process.env.AUTH_ORIGIN || '',
        soapOrigin: process.env.SOAP_ORIGIN || '',
        authVersion: parseInt(process.env.AUTH_VERSION || '2', 10),
        accountId: process.env.ACCOUNT_ID || '',
        logDeName: process.env.LOG_DE_NAME || '',
        subDeName: process.env.SUB_DE_NAME || '',
        jwt: process.env.JWT || '',
        senderDe: process.env.SENDER_DE || '',
        timeOffset: process.env.TIME_OFFSET || 0,
        executeTimeOut: process.env.EXECUTE_TIMEOUT || 10000,
        retries: process.env.RETRIES || 5,
        retriesDelay: process.env.RETRIES_DELAY || 1000,
        appIcon: process.env.APP_ICON,
        appName: process.env.APP_NAME
    },

    sfmcContentCategories : {
        bannerImages : process.env.MC_BANNER_IMAGE_FOLDER || "344045", //id of folder inspect to see via dev console
        files : process.env.MC_FILE_FOLDER || "28402",
        linkImages : process.env.MC_LINK_IMAGE_FOLDER || "28403",
        customBlockPrefix : process.env.MC_SMS_CUSTOM_BLOCK_PREFIX || "SMS"
    },
    sfmcAssetTypes :{
        customBlock : 230,
        images : [20,22,23,28],
        files :  [127,105,106,20]
    },
    sms : {
        oaEndpoint : process.env.OA_ENDPOINT || "https://uat-api.linkvn.org/sms/v1/send",
        uploadFileEndpoint : "https://openapi.sms.me/v2.0/oa/upload/file"
    },
    
};

module.exports = config;
