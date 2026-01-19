/**
 * ============================================================================
 * Server Side Controller
 * ============================================================================
 */
const mc = require('../modules/mc');
const controller = {};
const config = require("../config");
const { v4: uuidv4 } = require('uuid');

const sms = require('../modules/vietguys');
const logger = require('../modules/logger');
const jwt = require('jsonwebtoken');
const util = require('../modules/util');

/**
 * ============================================================================
 * Execute
 * ============================================================================
 */

controller.execute = async (req, res) => {
    try {
        const data = require('jsonwebtoken').verify(req.body.toString('utf8'), config.sfmc.jwt, { algorithm: 'HS256' });
        if (data) {
            await process(data);
            res.sendStatus(200);

        }
        else {
            console.log('[controller.execute] ERROR: Execute Data not available');
            res.sendStatus(200);
        }
    }
    catch (err) {
        console.log('[controller.execute] FETAL ERROR: ', err.message);
        res.sendStatus(200);
    }

}

/**
 * ============================================================================
 * Process Function after execute
 * ============================================================================
 */

async function process(body) {

    const obj = body.inArguments[0];
    const activityRequestId = uuidv4();
    const record = obj.targetValues;

    const mcRecord = {
        'Request_ID': activityRequestId,
        'Phone_Number': obj.uid,
        'Message_Name': obj.messageName,
        // 'Journey_Name' : obj.settings.journeyName, //fetch from query due to non-update activation
        // 'Journey_ID' : obj.settings.journeyVersionId,
        // 'Journey_Version': obj.settings.journeyVersion,
        'Message_Type': obj.messageType,
        'OA_ID': obj.smsAccount,
        'OA_Name': obj.smsAccountName,
        'Activity_ID': body.activityId,
    };

    try {

        const token = await util.getSMSAccessToken(obj.smsAccount);
        let smsPayload = {};

        if (obj.messageType === 'SMS') {
            let smsMessage = obj.smsContentObject;

            const expr = /%%[\w-]+%%/g;
            const matches = smsMessage.match(expr);
            if (matches) {
                matches.forEach(matchedItem => {
                    const fieldName = matchedItem.substring(2, matchedItem.length - 2);
                    if (record[fieldName])
                        smsMessage = smsMessage.replace(matchedItem, record[fieldName]);
                });
            }

            smsPayload = {
                "from": obj.smsAccountName,
                "u": obj.smsAccount,
                "pwd": token,
                "phone": obj.uid,
                "sms": smsMessage,
                "bid": activityRequestId,
                "pid": "",
                "type": obj.unicodeValue,
                "json": "1"
            }

        }
        else {
        }

        const sentDate = new Date();
        mcRecord['Sent_Date'] = sentDate.toISOString();
        mcRecord['Template_ID'] = obj.smsContentId;
        mcRecord['Unicode_Type'] = obj.unicodeValue;

        const smsResponse = await sms.sendMessage(smsPayload);

        let smsMessageId = '';
        if (smsResponse.error === 0) {
            smsMessageId = smsResponse.msgid;
            mcRecord['API_Response_Carrier'] = smsResponse.carrier;
            mcRecord['API_Response_Code'] = smsResponse.error;
            mcRecord['API_Response_Log'] = smsResponse.log;

        }
        else { //SMS return error
            logger.error(`[SMS Response Error] - ${obj.contactKey}-${obj.uid} - ${JSON.stringify(smsResponse)}`);
            mcRecord['API_Response_Error'] = smsResponse.log;
            mcRecord['API_Response_Code'] = smsResponse.error;

            smsMessageId = `${activityRequestId}`;
        }

        mcRecord['Message_ID'] = smsMessageId;
        //Tracking sent message
        mc.createDERow(config.sfmc.logDeName, mcRecord).catch(mcError => {
            logger.error(`[MC Error during creating tracking record] - ${obj.contactKey}-${obj.uid} -  ${mcError}`);
        })

    }
    catch (err) {
        // Activity Level Error
        mcRecord['Message_ID'] = `${activityRequestId}`;
        mcRecord['Activity_Error'] = err.message;

        logger.error(`[Exception in processRequest] ${obj.contactKey}-${obj.uid} - ${err} -${err.stack}`);
        //Tracking sent message
        mc.createDERow(config.sfmc.logDeName, mcRecord).catch(mcError => {
            logger.error(`[MC Error during creating tracking record] - ${obj.contactKey}-${obj.uid} -  ${mcError}`);
        })
    }
}

/**
 * ============================================================================
 * Utilities of Controller
 * ============================================================================
 */
controller.getDataExtensions = () => {
    return mc.getAllDataExtensions();
};
controller.getDERows = (dataExtensionName, fields, filter) => {
    return mc.getDERows(dataExtensionName, fields, filter);
};
controller.getDataExtensionFields = (dataExtensionKey) => {
    return mc.getDataExtensionFields(dataExtensionKey);
};
controller.getContentById = (contentId) => {
    return mc.getContentById(contentId, ['Views']);
}

controller.getSMSMessages = () => {
    let fields = ['Id', 'Name'],
        smsFolderName = config.sfmcContentCategories.customBlockPrefix,
        assetTypeId = config.sfmcAssetTypes.customBlock;

    let query = {
        "leftOperand":
        {
            "property": "name",
            "simpleOperator": "startsWith",
            "value": smsFolderName
        },
        "logicalOperator": "AND",
        "rightOperand":
        {
            "property": "assetType.id",
            "simpleOperator": "equals",
            "value": assetTypeId
        }
    }


    return mc.getContent(fields, query);
}

controller.getCustomContentBlocks = async () => {
    let fields = ['Id', 'Name'],
        smsFolderName = config.sfmcContentCategories.customBlockPrefix,
        assetTypeId = config.sfmcAssetTypes.customBlock;

    let query = {
        "leftOperand":
        {
            "property": "name",
            "simpleOperator": "startsWith",
            "value": smsFolderName
        },
        "logicalOperator": "AND",
        "rightOperand":
        {
            "property": "assetType.id",
            "simpleOperator": "equals",
            "value": assetTypeId
        }
    }


    return mc.getContent(fields, query);
}

// controller.getContentById = (contentId) => {
//     let fields = ['content','meta'];
//     let result = mc.getContentById(contentId, fields);
//     return result;
// };


module.exports = controller; 
