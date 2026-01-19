/**
 * ============================================================================
 * Routing/Index/path/endpoint/config.json
 * ============================================================================
 */
const mc = require('../modules/mc.js');


const express = require('express');
const router = express.Router();
const controller = require('./custom_activity_controller');
const config = require("../config");


/**
 * ============================================================================
 * Index.html
 * ============================================================================
 */

router.get('/index.html', async (req, res) => {
    try {

        var smsAccount = await controller.getDERows(
            config.sfmc.senderDe,
            ["OA_ID", "OA_Name"],
            null
        );

        var smsType = [
            {
                "name": "SMS Message",
                "id": "SMS"
            }
        ];

        var smsUnicode = [
            {
                "name": "UNICODE",
                "id": "8"
            },
            {
                "name": "NOT UNICODE",
                "id": "0"
            }
        ];

        res.render('custom-activity', {
            isLoading: true,
            smsAccount: smsAccount,
            smsType: smsType,
            smsUnicode: smsUnicode
        });
    } catch (error) {
        console.log('[router.get] /index.html ERROR:', error.message);
    }

});

/**
 * ============================================================================
 * utilities path
 * ============================================================================
 */

router.get('/getSMSMessages', async (req, res) => {
    const contents = await controller.getSMSMessages();
    res.send(contents);
});



router.get('/getDataExtensionFields/:dataExtensionKey', async (req, res) => {
    const dataExtensionKey = req.params['dataExtensionKey'];
    const fields = await controller.getDataExtensionFields(dataExtensionKey);
    res.send(fields);
});


router.get('/getContent/:contentId', async (req, res) => {
    const contentId = req.params.contentId;
    const content = await controller.getContentById(contentId, ['Views']);
    res.send(content);
});


/**
 * ============================================================================
 * other path
 * ============================================================================
 */

router.post('/save', (req, res) => {
    res.status(200).json({});
});

router.post('/validate', (req, res) => {
    res.status(200).json({});
});

router.post('/publish', (req, res) => {
    res.status(200).json({});
});

router.use('/execute', controller.execute);
// router.use('/save', controller.save);
// router.use('/validate', controller.validate);


/**
 * ============================================================================
 * /config.json
 * ============================================================================
 */

router.get('/config.json', (req, res) => {
    res.send({
        "workflowApiVersion": "1.1",
        "metaData": {
            "icon": config.sfmc.appIcon,
            "category": "message",
            "isCustomSendActivity": true,
            "isCustomSendType": ""

        },
        "type": "Rest",
        "lang": {
            "en-US": {
                "name": config.sfmc.appName,
                "description": "Tamson's SMS"
            }
        },
        "arguments": {
            "execute": {
                "inArguments": [

                ],
                "outArguments": [
                ],
                "timeout": 100000,
                "retryDelay": 10000,
                "concurrentRequests": 1,
                "url": `https://${req.headers.host}/custom-activity/execute`,
                "verb": "POST",
                "useJwt": true
            }
        },
        "configurationArguments": {
            "save": {
                "url": `https://${req.headers.host}/custom-activity/save`,
                "verb": "POST",
                "useJwt": true
            },
            "publish": {
                "url": `https://${req.headers.host}/custom-activity/publish`,
                "verb": "POST",
                "useJwt": true
            },
            "validate": {
                "url": `https://${req.headers.host}/custom-activity/validate`,
                "verb": "POST",
                "useJwt": true
            }
        },
        "userInterfaces": {
            "configModal": {
                "fullscreen": true
            }
        },
        "schema": {
            "arguments": {
                "execute": {
                    "inArguments": [
                    ],
                    "outArguments": [
                    ]
                }
            }
        }

    });
});


module.exports = router;