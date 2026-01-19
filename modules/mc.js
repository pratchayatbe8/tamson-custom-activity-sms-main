const config = require('../config');
const ET_Client = require('sfmc-fuelsdk-node');
const { JSONPath } = require('jsonpath-plus');
const httpErrors = require("http-errors");

const clientId = config.sfmc.clientId;
const clientSecret = config.sfmc.clientSecret;
const stack = config.sfmc.stack;
const authVersion = config.sfmc.authVersion;
const MID = config.sfmc.accountId;
const authURL = config.sfmc.authOrigin;
const restURL = config.sfmc.origin;
const soapURL = config.sfmc.soapOrigin;


const IET_Client = new ET_Client(clientId, clientSecret, stack, {
    origin: restURL,
    soapOrigin: soapURL,
    authOrigin: authURL,
    authOptions: {
        authVersion: authVersion,
        accountId: MID,
        applicationType: 'server',
        scope: ''
    }
});

const mc = {};

mc.getDERows = async (dataExtensionName, fields, filter) => {
    const options = {
        Name: dataExtensionName,
        props: fields
    }

    if (filter)
        options.filter = filter;
    const deRow = IET_Client.dataExtensionRow(options);
    return new Promise((resolve, reject) => {
        let lData = [];

        deRow.get((err, response) => {
            if (err) {
                console.log('[mc.getDERows] ERROR: ' + JSON.stringify(err));
                reject(err);
            }
            else {
                try {
                    let hasRows = response.body.Results.length > 0 && 'Properties' in response.body.Results[0] && 'Property' in response.body.Results[0]['Properties'];
                    if (hasRows) {
                        let body = response.body.Results;

                        JSONPath('$..Property', body, (payload) => {
                            var data = new Object;

                            if (Array.isArray(payload)) {
                                payload.forEach(member => {
                                    if ('Name' in member && 'Value' in member) {
                                        data[member['Name']] = member['Value'];
                                    }
                                });
                            }
                            else {
                                let member = payload;
                                if ('Name' in member && 'Value' in member) {
                                    data[member['Name']] = member['Value'];
                                }
                            }

                            lData.push(data);

                        });

                        resolve(lData);
                    }
                    else {//No data
                        resolve(response.body.Results);
                    }
                }
                catch {
                }
            }
        });
    });
},

mc.createDERow = async (dataExtensionName, Record) => {

    let options = {
        Name: dataExtensionName,
        props: Record
    };
    var deRow = IET_Client.dataExtensionRow(options)

    return new Promise((resolve, reject) => {
        try {
            deRow.post((err, response) => {
                
                // var deRow = IET_Client.dataExtensionRow(options)
                if (err) {
                    reject(err);
                } else {
                    resolve(response.body.Results);
                }


            });
        } catch (error) {
            console.log('[mc.createDERow] FETAL ERROR: ', error);
        }
    });


},



mc.updateDERow = (dataExtensionName, Record) => {
    return new Promise((resolve, reject) => {
        let options = {
            Name: dataExtensionName,
            props: Record
        };
        let deRow = IET_Client.dataExtensionRow(options)
        deRow.patch((err, response) => {
            if (err) {
                if (!isConcurrencyViolation(err)) {
                    console.log('[mc.updateDERow] ERROR: ' + JSON.stringify(err));
                }
                reject(err);
            } else {
                resolve(response.body.Results);
            }
        });
    });
},

mc.deleteDERow = (dataExtensionName, Record) => {
    return new Promise((resolve, reject) => {
        let options = {
            Name: dataExtensionName,
            props: Record
        };
        let deRow = IET_Client.dataExtensionRow(options)
        deRow.delete((err, response) => {
            if (err) {
                console.log('[mc.deleteDERow] ERROR: ' + JSON.stringify(err));
                reject(err);
            } else {
                resolve(response.body.Results);
            }
        });
    });
},

mc.getAllDataExtensions = () => {
    return new Promise((resolve, reject) => {
        const options = {
            props: ['Name', 'CustomerKey', 'IsSendable']
        };

        const dataExtension = IET_Client.dataExtension(options);

        dataExtension.get((err, response) => {
            if (err) {
                console.log('[mc.getAllDataExtension] ERROR: ' + JSON.stringify(err));
                reject(err);
            } else {
                let sendableDE = [];
                let unsendableDE = [];
                let allDE = response.body.Results;
                allDE.sort((a, b) => {
                    const nameA = a.Name.toUpperCase();
                    const nameB = b.Name.toUpperCase();
                    if (nameA < nameB) {
                        return -1;
                    }
                    if (nameA > nameB) {
                        return 1;
                    }

                    return 0;
                });

                allDE.forEach(de => {
                    if (de.IsSendable === 'true')
                        sendableDE.push(de);
                    else
                        unsendableDE.push(de);
                });

                resolve({
                    sendableDEs: sendableDE,
                    unsendableDEs: unsendableDE
                });
            }
        });
    });
},


mc.getDataExtensionFields = (dataExtensionKey) => {
    return new Promise((resolve, reject) => {
        let options = {
            props: ['Name', 'CustomerKey', 'FieldType'],
            // props: ['Name', 'CustomerKey'],
            filter: {
                leftOperand: 'DataExtension.CustomerKey',
                operator: 'equals',
                rightOperand: dataExtensionKey
            }
        };
        let deColumn = IET_Client.dataExtensionColumn(options);
        deColumn.get(function (err, response) {
            if (err) {
                console.log('[mc.getAllDataExtensionFields] ERROR: ' + JSON.stringify(err));
                reject(err);
            } else {
                let result = response && response.body ? response.body : response;
                resolve(result);
            }
        });
    });
}


//Content Builder
mc.getContent = (fields, query) => {
    return new Promise((resolve, reject) => {
        let payload = {
            "fields": fields,
            "sort": [
                {
                    "property": "Name",
                    "direction": "ASC"
                }
            ],
            "query": query,
            "page":
            {
                "page": 1,
                "pageSize": 10000
            }
        };
        IET_Client.RestClient
            .post({ uri: '/asset/v1/content/assets/query', body: JSON.stringify(payload) })
            .then(function (response) {
                resolve(response.body);
            }.bind(this))
            .catch(function (err) {
                console.log('[mc.getContent] FETAL ERROR: ' + JSON.stringify(err));
                reject(err);
            }.bind(this));
    });
},

mc.getContentById = (contentId, fields, retries = config.sfmc.retries, delay = config.sfmc.retriesDelay) => {
    
    return new Promise((resolve, reject) => {
        let endpoint = fields
            ? `${config.sfmc.origin}/asset/v1/content/assets/${contentId}?$fields=${fields}`
            : `${config.sfmc.origin}/asset/v1/content/assets/${contentId}`;

        const requestContent = (retryCount) => {
            IET_Client.RestClient
                .get(endpoint)
                .then(function (response) {
                    let result = response.body;

                    resolve(result);
                }.bind(this))
                .catch(function (err) {
                    console.log('[mc.getContentById] ERROR WITH RETRY: ' + err);

                    if (err.code === 'ECONNRESET' || err.code === 'ECONNABORTED' || err.message.includes('socket')) {
                        if (retryCount > 0) {
                            setTimeout(() => {
                                requestContent(retryCount - 1);
                            }, delay);
                        } else {
                            reject(new Error(`Failed after ${retries} retries: ` + err.message));
                        }
                    } else {
                        reject(err);
                    }
                }.bind(this));
        };

        requestContent(retries); // Initial attempt with the defined retries
    });
};


mc.upsertDERow = async (dataExtensionName, record) => {
    return retry(async () => {
        try {
            return await mc.updateDERow(dataExtensionName, record);
        } catch (err) {
            if (isConcurrencyViolation(err)) {
                return await mc.createDERow(dataExtensionName, record);
            }
            throw err;
        }
    }, config.sfmc.retries);
};

async function retry(fn, retries = config.sfmc.retries) {
    let lastError;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;

            if (attempt === retries) {
                console.log('[mc.retry] ERROR MAX RETRY: ' + lastError);

                throw lastError;
            }

            await wait();
        }
    }
}



const wait = () => new Promise(resolve => setTimeout(resolve, config.sfmc.retriesDelay));



function isConcurrencyViolation(err) {
    try {
        return (
            err?.results?.[0]?.ErrorCode === '2' ||
            err?.results?.[0]?.ErrorMessage?.includes('Concurrency violation')
        );
    } catch {
        return false;
    }
}



module.exports = mc;