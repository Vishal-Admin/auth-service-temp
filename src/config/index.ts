import { config } from "dotenv";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
config({
    path: path.join(__dirname, `../../.env.${process.env.NODE_ENV || "dev"}`),
});

const {
    PORT,
    HOST,
    NODE_ENV,
    DB_HOST,
    DB_PORT,
    DB_USERNAME,
    DB_PASSWORD,
    DB_NAME,
    REFRESH_TOKEN_KEY,
    ISSUER,
    JWKS_URI,
} = process.env;

export const Config = {
    PORT,
    HOST,
    NODE_ENV,
    DB_HOST,
    DB_PORT,
    DB_USERNAME,
    DB_PASSWORD,
    DB_NAME,
    REFRESH_TOKEN_KEY,
    ISSUER,
    JWKS_URI,
};
