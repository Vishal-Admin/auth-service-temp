import { config } from "dotenv";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
config({ path: path.join(__dirname, `../../.env/${process.env.NODE_ENV}`) });

const { PORT, NODE_ENV, DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME } =
    process.env;

export const Config = {
    PORT,
    NODE_ENV,
    DB_HOST,
    DB_PORT,
    DB_USERNAME,
    DB_PASSWORD,
    DB_NAME,
};
