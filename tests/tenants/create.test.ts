import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { ITenant } from "../../src/types";
import { Tenant } from "../../src/entity/Tenant";
import createJWKSMock from "mock-jwks";
import { Roles } from "../../src/constants";

describe("POST /auth/login ", () => {
    let connection: DataSource;
    let jwks: ReturnType<typeof createJWKSMock>;
    let adminToken: string;

    beforeAll(async () => {
        jwks = createJWKSMock("http://localhost:5501");
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        jwks.start();
        await connection.dropDatabase();
        await connection.synchronize();
        adminToken = jwks.token({ sub: "1", role: Roles.ADMIN });
    });

    afterEach(() => {
        jwks.stop();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    const submitTenant = async (
        tenantData: ITenant,
        adminToken: string | null,
    ) => {
        const requestBuilder = request(app).post("/tenants").send(tenantData);
        if (adminToken) {
            await requestBuilder.set("Cookie", [`accessToken=${adminToken}`]);
        }
        const response = await requestBuilder;
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
            const response = await submitTenant(tenantData, adminToken);
            expect(response.statusCode).toBe(201);
        });

        it("should create tanant in database with all required fields", async () => {
            const tenantData = { ...tenantMainData };
            await submitTenant(tenantData, adminToken);
            const tanants = await getTenantData();
            expect(tanants).toHaveLength(1);
            expect(tanants[0].name).toBe(tenantData.name);
            expect(tanants[0].address).toBe(tenantData.address);
        });

        it("should return 401 status code if user is not authenticated", async () => {
            const tenantData = { ...tenantMainData };
            const response = await submitTenant(tenantData, null);
            expect(response.statusCode).toBe(401);
            const tanants = await getTenantData();
            expect(tanants).toHaveLength(0);
        });

        it("should return 403 status code if user is not ADMIN", async () => {
            const tenantData = { ...tenantMainData };
            const managerToken = jwks.token({ sub: "1", role: Roles.MANAGER });
            const response = await submitTenant(tenantData, managerToken);
            expect(response.statusCode).toBe(403);
            const tanants = await getTenantData();
            expect(tanants).toHaveLength(0);
        });

        it("should return valid JSON response", async () => {
            const tenantData = { ...tenantMainData };
            const response = await submitTenant(tenantData, adminToken);
            expect(
                (response.headers as Record<string, string>)["content-type"],
            ).toEqual(expect.stringContaining("json"));
        });
    });
});
