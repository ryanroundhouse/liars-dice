import winston from "winston";

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
    format: winston.format.simple()
    }));
}

// just add the below to write into a file
winston.add(logger);

export default logger;