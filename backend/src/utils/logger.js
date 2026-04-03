const winston = require('winston');

const { combine, timestamp, printf, colorize, errors } = winston.format;

function redactForLog(obj) {
  try {
    const s = JSON.stringify(obj);
    if (/private[_-]?key|0x[a-fA-F0-9]{64}/i.test(s)) {
      return JSON.stringify({ redacted: true });
    }
    return s;
  } catch {
    return '{}';
  }
}

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${redactForLog(meta)}` : '';
  return `${timestamp} [${level}] ${stack || message}${metaStr}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),
  ],
});

if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
  );
  logger.add(new winston.transports.File({ filename: 'logs/combined.log' }));
}

module.exports = logger;
