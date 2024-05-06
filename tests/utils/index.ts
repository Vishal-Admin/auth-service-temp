import { DataSource } from "typeorm";

export const truncateTables = async (connection: DataSource) => {
    const entities = connection.entityMetadatas;
    for (const entity of entities) {
        const repositry = connection.getRepository(entity.name);
        await repositry.clear();
    }
};
