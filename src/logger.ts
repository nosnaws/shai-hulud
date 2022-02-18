import winston from "winston";
// @ts-ignore
import NewrelicWinston from "winston-to-newrelic-logs";

const createLogger = () => {
  const wLogger = winston.createLogger({
    level: "info",
    format: winston.format.json(),
    defaultMeta: { service: "shai-hulud" },
    transports: [
      new NewrelicWinston({
        licenseKey: process.env.NEW_RELIC_LICENCE_KEY,
        apiUrl: "https://log-api.newrelic.com",
      }),
    ],
  });

  if (process.env.NODE_ENV !== "production") {
    wLogger.add(
      new winston.transports.Console({
        format: winston.format.simple(),
      })
    );
  }

  return wLogger;
};
const logger = createLogger();

const getLogger = () => logger;

export default getLogger;
