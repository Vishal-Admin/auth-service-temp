import "reflect-metadata";
import { DataSource } from "typeorm";
import { Config } from ".";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: Config.DB_HOST,
    port: Number(Config.DB_PORT),
    username: Config.DB_USERNAME,
    password: Config.DB_PASSWORD,
    database: Config.DB_NAME,

    //Don't use this in production allways keep false
    synchronize: false, // temp pased afetr testing coplete change it to false
    logging: false,
    entities: ["src/entity/*.ts"],
    migrations: ["src/migration/*.ts"],
    subscribers: [],
});
