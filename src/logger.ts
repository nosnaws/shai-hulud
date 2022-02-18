import winston from "winston";
// @ts-ignore
import NewrelicWinston from "winston-to-newrelic-logs";
import newrelicFormatter from "@newrelic/winston-enricher";

const createLogger = () => {
  const wLogger = winston.createLogger({
    level: "info",
    format: newrelicFormatter(),
    defaultMeta: { service: "shai-hulud" },
    transports: [
      new NewrelicWinston({
        licenseKey: process.env.NEW_RELIC_LICENSE_KEY,
        apiUrl: "https://log-api.newrelic.com",
        pluginOptions: {},
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
