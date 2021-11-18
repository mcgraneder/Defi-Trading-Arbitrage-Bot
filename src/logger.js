const { createLogger, format, transports } = require('winston');

const transactionLogger = createLogger({
transports: [
    new transports.File({
    filename: '../utils/logs/transactionData.log',
    format:format.combine(
        format.timestamp({format: 'MMM-DD-YYYY HH:mm:ss'}),
        format.align(),
        format.printf(info => `${info.level}: ${[info.timestamp]}: ${info.message}`),
    )}),

    // MongoDB transport
    // new transports.MongoDB({
    //     level: 'error',
    //     //mongo database connection link
    //     db : 'mongodb://localhost:27017/logs',
    //     options: {
    //         useUnifiedTopology: true
    //     },
    //     // A collection to save json formatted logs
    //     collection: 'server_logs',
    //     format: format.combine(
    //     format.timestamp(),
    //     // Convert logs to a json format
    //     format.json())
    // })
        ]
});

const priceDataLogger = createLogger({
transports: [
    new transports.File({
    filename: '../utils/logs/priceData.log',
    format:format.combine(
        format.timestamp({format: 'MMM-DD-YYYY HH:mm:ss'}),
        format.align(),
        format.printf(info => `${info.level}: ${[info.timestamp]}: ${info.message}`),
    )}),

    // MongoDB transport
    // new transports.MongoDB({
    //     level: 'error',
    //     //mongo database connection link
    //     db : 'mongodb://localhost:27017/logs',
    //     options: {
    //         useUnifiedTopology: true
    //     },
    //     // A collection to save json formatted logs
    //     collection: 'server_logs',
    //     format: format.combine(
    //     format.timestamp(),
    //     // Convert logs to a json format
    //     format.json())
    // })
        ]
});

const generalLogger = createLogger({
transports: [
    new transports.File({
    filename: '../utils/logs/errorData.log',
    format:format.combine(
        format.timestamp({format: 'MMM-DD-YYYY HH:mm:ss'}),
        format.align(),
        format.printf(info => `${info.level}: ${[info.timestamp]}: ${info.message}`),
    )}),

    // MongoDB transport
    // new transports.MongoDB({
    //     level: 'error',
    //     //mongo database connection link
    //     db : 'mongodb://localhost:27017/logs',
    //     options: {
    //         useUnifiedTopology: true
    //     },
    //     // A collection to save json formatted logs
    //     collection: 'server_logs',
    //     format: format.combine(
    //     format.timestamp(),
    //     // Convert logs to a json format
    //     format.json())
    // })
        ]
});

module.exports = {
    generalLogger: generalLogger,
    transactionLogger: transactionLogger,
    priceDataLogger:priceDataLogger

    
};