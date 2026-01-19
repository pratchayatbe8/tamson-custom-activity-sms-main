

/**
 * ============================================================================
 * Shared Variables
 * 
 * ============================================================================
 */
export let sharedObject = {
    targetFields: [],
    payload: {}
}

/**
 * ============================================================================
 * DROPDOWN list item element with a check icon and label.
 * @param {string} optionText - The text to display in the dropdown item.
 * @param {string} optionValue - The value associated with the dropdown item.
 * @param {string} dataId - A unique identifier for the item.
 * @param {string} selectedValue - The currently selected value.
 * @returns {HTMLLIElement} The constructed list item element.
 * ============================================================================
 */
export function createDropdownItem(optionText, optionValue, dataId, selectedValue) {
    const isSelected = selectedValue == optionValue;
    const checkedAttr = isSelected ? "true" : "false";
    const checkIconClass = isSelected ? "" : "slds-hide";

    // Create <li> wrapper
    const listItem = document.createElement('li');
    listItem.setAttribute('role', 'presentation');

    // Main container span
    const mainSpan = document.createElement('span');
    mainSpan.className = 'slds-media slds-listbox__option slds-listbox__option_plain slds-media_small';
    mainSpan.style.cssText = 'min-width: min-content; padding: 0.5rem;';

    // Grid wrapper
    const divWrapper = document.createElement('div');
    divWrapper.className = 'slds-grid slds-size--1-of-1';

    // Check icon container
    const divCheckIcon = document.createElement('div');
    divCheckIcon.style.cssText = 'padding-left: 0; padding-right: 0; width: 15px; max-width: 15px;';

    const subSpan = document.createElement('span');
    subSpan.className = 'slds-media__figure';

    // SVG checked icon
    const svgCheckIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgCheckIcon.setAttribute('class', 'slds-icon slds-icon_xx-small slds-icon-text-default');
    svgCheckIcon.setAttribute('viewBox', '0 0 52 52');
    svgCheckIcon.setAttribute('aria-hidden', 'true');
    svgCheckIcon.innerHTML = `
        <path data-id="checked-icon" class="${checkIconClass}" d="M19.1 42.5L2.6 25.9c-.6-.6-.6-1.6 0-2.2l2.2-2.2c.6-.6 1.6-.6 2.2 0L19.4 34c.4.4 1.1.4 1.5 0L45.2 9.5c.6-.6 1.6-.6 2.2 0l2.2 2.2c.6.6.6 1.6 0 2.2L21.3 42.5c-.6.7-1.6.7-2.2 0z"/>
    `;

    subSpan.appendChild(svgCheckIcon);
    divCheckIcon.appendChild(subSpan);

    // Content container
    const divContent = document.createElement('div');
    divContent.style.cssText = 'padding-left: 0.25rem;';

    const textSpan = document.createElement('span');
    textSpan.className = 'slds-media__body';
    textSpan.innerHTML = `
        <span class="slds-truncate" style="white-space: nowrap; padding: 0;" 
              data-checked="${checkedAttr}" data-id="${dataId}" data-value="${optionValue}" data-name="${optionText}">
            ${optionText}
        </span>
    `;

    divContent.appendChild(textSpan);

    // Assemble DOM structure
    divWrapper.appendChild(divCheckIcon);
    divWrapper.appendChild(divContent);
    mainSpan.appendChild(divWrapper);
    listItem.appendChild(mainSpan);

    return listItem;
}



/**
 * ============================================================================
 * Initializes dropdown listener.
 * ============================================================================
 * 
 */
export function loadActionFields(buttonSettings, connection) {

    const inputDropdowns = document.querySelectorAll('.slds-dropdown-trigger_click');

    inputDropdowns.forEach((inputDropdown) => {
        const input = inputDropdown.querySelector('.slds-combobox__input');
        const dropdown = inputDropdown.querySelector('.slds-dropdown');
        // const options = dropdown.querySelectorAll('.slds-listbox__option');
        /**
         * Handles input click - shows the dropdown.
         */
        const handleInputClick = () => {
            showDropdown(input, dropdown);
        };

        /**
         * Handles user typing in input - filters dropdown options.
         */
        const handleInputChange = () => {
            const searchValue = input.value.trim().toLowerCase();
            inputSearchAction(searchValue, inputDropdown);
            validateAllFields(buttonSettings, connection);

        };

        /**
         * Handles option click inside dropdown.
         */
        const handleDropdownClick = (event) => {
            const option = event.target.closest('.slds-listbox__option');
            if (option) {
                dropdownClickAction(option, inputDropdown, connection, buttonSettings);
                validateAllFields(buttonSettings, connection);
            }
        };

        /**
         * Handles document click - hides dropdown if clicked outside.
         */
        const handleDocumentClick = (event) => {
            if (!dropdown.contains(event.target) && !input.contains(event.target)) {
                hideDropdown(dropdown);
            }
        };

        // Attach event listeners
        input.addEventListener('click', handleInputClick);
        input.addEventListener('input', handleInputChange);
        dropdown.addEventListener('click', handleDropdownClick);
        document.addEventListener('click', handleDocumentClick);


    });

}



/**
 * ============================================================================
 * dropdown listener Utilities.
 * ============================================================================
 * 
 */
function showDropdown(input, dropdown) {
    dropdown.classList.remove('slds-hide');
    const selectedOption = dropdown.querySelector('.slds-listbox__option .slds-truncate[data-checked="true"]');
    const inputValue = input.value;

}

function inputSearchAction(searchValue, inputDropdown) {
    const dropdown = inputDropdown.querySelector('.slds-dropdown');
    const options = dropdown.querySelectorAll('.slds-listbox__option');
    options.forEach(option => {
        const text = option.textContent.toLowerCase();
        if (text.includes(searchValue)) {
            option.style.display = 'block';
        } else {
            option.style.display = 'none';
        }
    });
}


function dropdownClickAction(option, inputDropdown, connection, buttonSettings) {
    const input = inputDropdown.querySelector('.slds-combobox__input');
    const dropdown = inputDropdown.querySelector('.slds-dropdown');
    const options = dropdown.querySelectorAll('.slds-listbox__option');
    const value = option.querySelector('.slds-truncate').dataset.value;

    removeCheckIcon(options);
    setCheckIcon(option);
    input.value = option.querySelector('.slds-truncate').textContent.trim();

    option.querySelector('.slds-truncate').dataset.checked = 'true';
    const selectedValue = value;
    hideDropdown(dropdown);

    const dataId = option.querySelector('.slds-truncate').dataset.id;
    if (dataId == 'select-de') {
    }
    else if (dataId == 'select-content') {
        loadPreviewContent(selectedValue, null, false);
    }
    else if (dataId == 'select-type') {
        loadContent(selectedValue, null, null, null, connection, buttonSettings, false)
    }


}
function hideDropdown(dropdown) {
    dropdown.classList.add('slds-hide');
}

function removeCheckIcon(options) {
    options.forEach(option => {
        const checkIcon = option.querySelector('[data-id="checked-icon"]');
        if (checkIcon) {
            checkIcon.classList.add('slds-hide');
            option.querySelector('.slds-truncate').dataset.checked = 'false';

        }
    });
}

export function setCheckIcon(option) {
    const checkIcon = option.querySelector('[data-id="checked-icon"]');
    if (checkIcon) {
        checkIcon.classList.remove('slds-hide');
    }
}


/**
 * ============================================================================
 * Validate Inputs.
 * ============================================================================
 * 
 */

export function validateAllFields(buttonSettings, connection) {

    var allInputValid = true;
    const inputDropdowns = document.querySelectorAll('.slds-dropdown-trigger_click');

    inputDropdowns.forEach(function (inputDropdown) {
        const input = inputDropdown.querySelector('.slds-combobox__input');
        const dropdown = inputDropdown.querySelector('.slds-dropdown');
        const options = dropdown.querySelectorAll('.slds-listbox__option');
        const selectedOption = dropdown.querySelector('.slds-listbox__option .slds-truncate[data-checked="true"]');
        const inputValue = input.value;
        // var selectedText = selectedOption ?  selectedOption.textContent : '';
        var selectedText = selectedOption ? selectedOption.textContent.trim() : '';
        if (!selectedOption || (selectedOption && inputValue.trim() !== selectedText)) {
            allInputValid = false;
            input.classList.add("slds-has-error");
        }
        else {
            input.classList.remove("slds-has-error");
        }

    });

    // Common validate
    let elements = document.querySelectorAll('[class~=commonValidate]');
    for (let i = 0; i < elements.length; i++) {
        if (elements[i].value == null || elements[i].value == '') {
            allInputValid = false;
            elements[i].classList.add("slds-has-error");
        }
        else {
            elements[i].classList.remove("slds-has-error");
        }
    }

    buttonSettings.enabled = allInputValid;
    connection.trigger('updateButton', buttonSettings);
    return allInputValid;

}




export function loadPreviewContent(content, selectedOA, isLoad) {

    isLoad = isLoad == null ? false : isLoad;

    document.querySelector('#previewFrame').srcdoc = '';
    showSpinner(true);

    if (content) {
        let endpoint = '';
        let messageType = getCheckedAttr('select-type', 'data-value');

        if (messageType === 'SMS')
            endpoint = `/sms/custom-activity-main/getContent/${content}`;

        fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        }).then(response => {
            return response.json();

        })
            .then(data => {

                if (messageType === 'SMS') {
                    var content = "";

                    if (data.views.sms) {
                        document.querySelector('#previewFrame').srcdoc = data.views.sms.content;
                        content = data.views.sms.meta.options.customBlockData['display:message'];
                    }
                    else if (data.views.sMS) {
                        document.querySelector('#previewFrame').srcdoc = data.views.sMS.content;
                        content = data.views.sMS.meta.options.customBlockData['display:message'];
                    }

                    sharedObject.payload.smsContentObject = content;
                    sharedObject.targetFields = new Set(extractPersonalizeFields(content, false));
                }

                swithToFramePreview(true);

                if (!isLoad) showSpinner(false);

            })
            .catch((err) => console.log('Error occurred in loadPreviewContent: ', err));
    }
    else {
        if (!isLoad) showSpinner(false);
        swithToFramePreview(false);
    }
}


export function swithToFramePreview(isShowFrame) {
    var previewIllustration = document.getElementById("previewIllustration");
    var previewFrame = document.getElementById("previewFrame");
    if (isShowFrame) {
        previewFrame.classList.remove("slds-hide");
        previewFrame.classList.add("slds-show");
        previewIllustration.classList.remove("slds-show");
        previewIllustration.classList.add("slds-hide");
    }
    else if (!isShowFrame) {
        previewFrame.classList.remove("slds-show");
        previewFrame.classList.add("slds-hide");
        previewIllustration.classList.remove("slds-hide");
        previewIllustration.classList.add("slds-show");
    }
}

export function showSpinner(isShow) {
    var spinnerElement = document.getElementById("spinner-loading");
    if (spinnerElement && !isShow) {
        spinnerElement.classList.remove("slds-show");
        spinnerElement.classList.add("slds-hide");
    }
    else if (spinnerElement && isShow) {
        spinnerElement.classList.remove("slds-hide");
        spinnerElement.classList.add("slds-show");
    }
}

/**
 * ============================================================================
 * Extract Personalize
 * 
 * ============================================================================
 */

export function extractPersonalizeFields(content, isZNS) {

    if (!content) return [];
    if (!isZNS) {
        return extractPersonalizationFields(content);
    }
}

function extractPersonalizationFields(template) {
    if (!template) return [];

    const matches = template.match(/%%(.*?)%%/g);
    if (!matches) return [];

    return matches.map(m => m.replace(/%%/g, ""));
}


//Load the content base on which SMS
export function loadContent(messageType, selectedValue, selectedName, oa, connection, buttonSettings, isLoad) {

    isLoad = isLoad == null ? false : isLoad;
    showSpinner(true);

    //Load the Content Blocks
    if (messageType === 'SMS') {
        fetch('/sms/custom-activity-main/getSMSMessages', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        }).then(response => response.json())
            .then(data => {
                console.log('data::: ', data);
                document.querySelector('#content-select ul').innerHTML = "";
                data.items.forEach((item) => {
                    let optionText = item['name'];
                    let optionValue = item['id'];

                    var listItemUid = createDropdownItem(optionText, optionValue, 'select-content', selectedValue)
                    document.querySelector('#content-select ul').appendChild(listItemUid);

                });

                if (selectedValue) {

                    // assignInput('#subscriber-key-select', selectedSubscriberKey);
                    assignInput('#sms-content', selectedName);
                }
                else {
                    clearInput("#sms-content");
                }

                if (!isLoad) showSpinner(false);
                validateAllFields(buttonSettings, connection);

                assignInput('#content-loaded', true);


            })
            .catch((err) => console.log('Error occurred in /getSMSMessages: ', err));
    }

    return false;
}

function assignInput(selector, value) {
    document.querySelector(selector).value = value;
}

function clearInput(key) {
    var input = document.querySelector(key);
    input.value = '';
    input.disabled = false;
}

/**
 * Get attribute from checked element by data-id.
 */
function getCheckedAttr(dataId, attr) {
    return document.querySelector(`.slds-truncate[data-checked="true"][data-id="${dataId}"]`)?.getAttribute(attr) || '';
}