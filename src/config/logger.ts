import { Config } from "../config";
import winston from "winston";

const logger = winston.createLogger({
    level: "info",
    defaultMeta: { serviceName: "auth-service" },
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
    ),
    silent: Config.NODE_ENV === "test",
    transports: [
        new winston.transports.File({
            dirname: "logs",
            filename: "combined.log",
            level: "info",
        }),
        new winston.transports.File({
            dirname: "logs",
            filename: "error.log",
            level: "error",
        }),
        new winston.transports.Console({
            level: "info",
        }),
    ],
});

export default logger;
