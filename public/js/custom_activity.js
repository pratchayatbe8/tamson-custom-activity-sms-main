'use strict';
const connection = new Postmonger.Session();
let journeySchema = [];
let journeyDefinition = {};
let journeyConfigured = {};
var eventDefinitionKey;
var interactionSettings = {};
var schemaSettings = {};
import { sharedObject } from './custom_activity_helper.js';
import { swithToFramePreview, showSpinner, loadContent, loadPreviewContent, loadActionFields, setCheckIcon, createDropdownItem, extractPersonalizeFields, validateAllFields } from './custom_activity_helper.js';

/**
 * ============================================================================
 * Connection and events.
 * ============================================================================
 * 
 */

document.addEventListener('DOMContentLoaded', onRender);

connection.on('initActivity', initialize);
connection.on('clickedNext', save);

connection.trigger('requestSchema');
connection.trigger('requestInteraction');
connection.trigger('requestTriggerEventDefinition');
connection.trigger('requestInteractionDefaults');

connection.on('requestedTriggerEventDefinition', function (settings) {
    // console.log('requestedTriggerEventDefinition settings: ', settings);
});
connection.on('requestedInteractionDefaults', function (settings) {
    // console.log('requestedInteractionDefaults settings: ', settings);
});

connection.on('requestedInteraction', function (settings) {
    interactionSettings = settings;
    eventDefinitionKey = settings.triggers[0].metaData.eventDefinitionKey;
});
connection.on('requestedSchema', function (data) {
    schemaSettings = data;
    journeySchema = data['schema'];
    loadDEFieldsV2(journeyConfigured.currentSubscriberKey, journeyConfigured.currentUidField, true);
});

const buttonSettings = {
    button: 'next',
    text: 'done',
    visible: true,
    enabled: false,
};
setTimeout(() => {
    if (!eventDefinitionKey) {
        document.querySelector('#sms-oa-field ul').innerHTML = "";
    }
}, 500);

function onRender() {
    connection.trigger('ready');
    connection.trigger('requestTokens');
    connection.trigger('requestEndpoints');
    document.querySelector('#workspace').addEventListener('input', () => { });
    swithToFramePreview(false);
    loadActionFields(buttonSettings, connection);
}

/**
 * ============================================================================
 * Initializes and updates UI.
 *
 * @param {Object} data - The payload data to initialize.
 * ============================================================================
 */
function initialize(data) {

    showSpinner(true);

    if (data) {
        sharedObject.payload = data;
    }

    const hasInArguments = Boolean(
        sharedObject.payload['arguments'] &&
        sharedObject.payload['arguments'].execute &&
        sharedObject.payload['arguments'].execute.inArguments &&
        sharedObject.payload['arguments'].execute.inArguments.length > 0
    );

    const args = sharedObject.payload?.arguments?.execute;

    const inArguments = Array.isArray(args?.inArguments) && args.inArguments.length > 0
        ? args.inArguments
        : [{}];

    if (!sharedObject.payload.name) {
        sharedObject.payload.name = 'SMS SENDING';
    }

    const {
        messageType: currentMessageType = '',
        messageTypeName: currentMessageTypeName = '',
        unicodeName: currentUnicodeName = '',
        unicodeValue: currentUnicodeValue = '',
        dataExtensionKey: currentDataExtension = '',
        subscriberKeyField: currentSubscriberKey = '',
        uidField: currentUidField = '',
        // contentId : currentContent = '',
        smsContentId: currentSMSContent = '',
        smsContentName: currentSMSContentName = '',
        smsAccount: currentSMSAccount = '',
        smsAccountName: currentSMSAccountName = '',
        messageName: currentMessageName = '',
    } = inArguments[0];


    const typeOption = document.querySelector(
        `.slds-listbox__item[data-value="SMS"][data-id="option-type"]`
    );
    setCheckIcon(typeOption);
    typeOption.querySelector('.slds-truncate').dataset.checked = 'true';
    document.querySelector('#sms-type').value = "SMS Message";

    if (!hasInArguments) {
        loadContent("SMS", null, null, null, connection, buttonSettings, true);
        showSpinner(false);
        return;
    }

    document.querySelector('#messageName').value = currentMessageName;
    loadContent(currentMessageType, currentSMSContent, currentSMSContentName, currentSMSAccount, connection, buttonSettings, true);

    var maxRetry = 5;
    var attempt = 0;

    var waitLoop = setInterval(function () {

        var contentLoaded = document.querySelector('#content-loaded').value;
        attempt++;

        if (attempt >= maxRetry) {
            clearInterval(waitLoop);
            return;
        }

        if (contentLoaded == true || contentLoaded == 'true') {

            clearInterval(waitLoop);

            // --- Update UI: Account Option ---
            const accountOption = document.querySelector(
                `.slds-listbox__item[data-value="${currentSMSAccount}"][data-id="option-account"]`
            );
            if (accountOption) {
                setCheckIcon(accountOption);
                accountOption.querySelector('.slds-truncate').dataset.checked = 'true';
                document.querySelector('#sms-account').value = currentSMSAccountName;
            }

            // --- Update UI: Type Option ---
            const typeOption = document.querySelector(
                `.slds-listbox__item[data-value="${currentMessageType}"][data-id="option-type"]`
            );
            if (typeOption) {
                setCheckIcon(typeOption);
                typeOption.querySelector('.slds-truncate').dataset.checked = 'true';
                document.querySelector('#sms-type').value = currentMessageTypeName;
            }

            // --- Update UI: Unicode Option ---
            const unicodeOption = document.querySelector(
                `.slds-listbox__item[data-value="${currentUnicodeValue}"][data-id="option-unicode"]`
            );
            if (unicodeOption) {
                setCheckIcon(unicodeOption);
                unicodeOption.querySelector('.slds-truncate').dataset.checked = 'true';
                document.querySelector('#sms-unicode').value = currentUnicodeName;
            }

            // Configure journey fields
            journeyConfigured.currentUidField = currentUidField;
            loadDEFieldsV2(journeyConfigured.currentSubscriberKey, currentUidField, true);
            if (currentSMSContent) {
                loadPreviewContent(currentSMSContent, currentSMSAccount, false);
            }
        }
        else {
            if (contentLoaded == false || contentLoaded == '') {
                return;
            }
        }
    }, 1000);

}

/**
 * ============================================================================
 * Saves configuration and updates the custom activity payload.
 * 
 * ============================================================================
 */
function save() {
    const uidField = getCheckedAttr('select-uid', 'data-value');

    const metaData = sharedObject.payload.metaData;
    metaData.isConfigured = true;
    metaData.isCustomSendActivity = true;
    metaData.isCustomSendType = 'SMS';

    const inArgument = {
        contactKey: '{{Contact.Key}}',
        uid: `{{Event.${eventDefinitionKey}."${uidField}"}}`
    };

    // Add target values for personalization
    inArgument.targetValues = {};

    sharedObject.targetFields.forEach(field => {
        inArgument.targetValues[field] = `{{Event.${eventDefinitionKey}."${field}"}}`;
    });

    Object.assign(inArgument, {
        dataExtensionKey: journeyDefinition.dataExtensionId,
        dataExtensionName: journeyDefinition.dataExtensionName,
        uidField: uidField,
        targetFields: sharedObject.targetFields,
        smsContentId: getCheckedAttr('select-content', 'data-value'),
        smsContentName: getCheckedAttr('select-content', 'data-name'),
        smsAccount: getCheckedAttr('select-account', 'data-value'),
        smsAccountName: getCheckedAttr('select-account', 'data-name'),
        smsContentObject: sharedObject.payload.smsContentObject,
        activityId: sharedObject.payload.id,
        activityName: sharedObject.payload.name,
        activityKey: sharedObject.payload.key,
        messageType: getCheckedAttr('select-type', 'data-value'),
        messageTypeName: getCheckedAttr('select-type', 'data-name'),
        messageName: document.querySelector('#messageName').value,
        unicodeName: getCheckedAttr('select-unicode', 'data-name'),
        unicodeValue: getCheckedAttr('select-unicode', 'data-value'),

    });

    // Add journey settings
    inArgument.settings = {
        journeyName: interactionSettings.name,
        journeyVersion: interactionSettings.version,
        journeyVersionId: interactionSettings.id
    };

    // Finalize payload and trigger update
    sharedObject.payload.arguments.execute.inArguments = [inArgument];
    connection.trigger('updateActivity', sharedObject.payload);
}


/**
 * Get attribute from checked element by data-id.
 */
function getCheckedAttr(dataId, attr) {
    return document.querySelector(`.slds-truncate[data-checked="true"][data-id="${dataId}"]`)?.getAttribute(attr) || '';
}


function clearInput(key) {
    var input = document.querySelector(key);
    input.value = '';
    input.disabled = false;
}

function assignInput(selector, value) {
    document.querySelector(selector).value = value;
}

function loadDEFieldsV2(selectedSubscriberKey, selectedUid, isLoad) {

    isLoad = isLoad == null ? false : isLoad;
    if (journeySchema.length > 0) {
        document.querySelector('#uid-select ul').innerHTML = "";

        journeySchema.forEach(field => {

            let optionText = field['name'];
            let optionValue = field['name'];
            if (optionText && field['type'].toLowerCase() == 'text') {
                var listItemUid = createDropdownItem(optionText, optionValue, 'select-uid', selectedUid)
                document.querySelector('#uid-select ul').appendChild(listItemUid);
            }

        });

        if (selectedUid) {
            // assignInput('#subscriber-key-select', selectedSubscriberKey);
            assignInput('#uid-input', selectedUid);
        }
        else {
            // clearInput("#subscriber-key-select");
            clearInput("#uid-input");
        }

        if (!isLoad) showSpinner(false);

        validateAllFields(buttonSettings, connection);

    }
    else {
        // showSpinner(false);
    }
}


window.validateInputs = function (dat) {
    validateAllFields(buttonSettings, connection);
}




