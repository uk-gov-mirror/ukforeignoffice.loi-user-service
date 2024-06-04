const { createLogger, transports, format } = require('winston');

const logger = createLogger({
    transports: [
        // Log info to console
        new transports.Console({
            format: format.combine(
                format.timestamp(),
                format.printf(info => {
                    return `${info.level.toUpperCase()}: ${info.message}`;
                }),
            ),
            level: 'info',
            handleExceptions: true,
            humanReadableUnhandledException: true
        }),
        // Log errors to console
        new transports.Console({
            format: format.combine(
                format.timestamp(),
                format.printf(info => {
                    return `${info.level.toUpperCase()}: ${info.message}`;
                }),
            ),
            level: 'error',
            handleExceptions: true,
            humanReadableUnhandledException: true
        })
    ]
});

// Overwrite some of the build-in console functions
console.error = logger.error.bind();
console.log = logger.info.bind();
console.info = logger.info.bind();
console.debug = logger.debug.bind();
console.warn = logger.warn.bind();
