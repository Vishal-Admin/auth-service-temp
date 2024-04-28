import { config } from "dotenv";

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
config();

const { PORT, NODE_ENV } = process.env;

export const Config = {
    PORT,
    NODE_ENV,
};
