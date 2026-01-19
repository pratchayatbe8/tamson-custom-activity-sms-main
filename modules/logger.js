const { createLogger, format, transports } = require('winston');
const path = require('path');

module.exports = createLogger({
    transports: [
        new transports.File({
            maxsize: 20971520,
            maxFiles: 10,
            filename: path.join(__dirname,'../logs','server.log'),
            format:format.combine( 
                format.timestamp({format: 'MMM-DD-YYYY HH:mm:ss'}),
                format.align(),
                format.printf(info => `${info.timestamp},${info.level},${info.message}`),
        )}),
        new transports.Console()
    ]
});