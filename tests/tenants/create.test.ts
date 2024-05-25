import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { ITenant } from "../../src/types";
import { Tenant } from "../../src/entity/Tenant";

describe("POST /auth/login ", () => {
    let connection: DataSource;

    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    const submitTenant = async (tenantData: ITenant) => {
        const response = await request(app).post("/tenants").send(tenantData);
        return response;
    };

    const getTenantData = async () => {
        const tenantRepository = connection.getRepository(Tenant);
        const tenants = await tenantRepository.find();
        return tenants;
    };

    const tenantMainData = {
        name: "Tenant Name",
        address: "Tenant Address",
    };

    describe("Given all filds", () => {
        it("should return the 201 status code", async () => {
            const tenantData = { ...tenantMainData };
            const response = await submitTenant(tenantData);
            expect(response.statusCode).toBe(201);
        });

        it("should create tanant in database with all required fields", async () => {
            const tenantData = { ...tenantMainData };
            await submitTenant(tenantData);
            const tanants = await getTenantData();
            expect(tanants).toHaveLength(1);
            expect(tanants[0].name).toBe(tenantData.name);
            expect(tanants[0].address).toBe(tenantData.address);
        });

        it("should return valid JSON response", async () => {
            const tenantData = { ...tenantMainData };
            const response = await submitTenant(tenantData);
            expect(
                (response.headers as Record<string, string>)["content-type"],
            ).toEqual(expect.stringContaining("json"));
        });
    });
});
