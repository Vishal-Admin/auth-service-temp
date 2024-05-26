import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { CreateTenantResponse, ITenant } from "../../src/types";
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

    const SubmitTenant = async (tenantData: ITenant) => {
        const response = await request(app)
            .post("/tenants")
            .send(tenantData)
            .set("Cookie", [`accessToken=${adminToken}`]);
        return response;
    };

    const UpdateTenant = async (
        tenantData: ITenant,
        adminToken: string | null,
        id: number,
    ) => {
        const requestBuilder = request(app)
            .patch(`/tenants/${id}`)
            .send(tenantData);
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
        name: "Tenant Name1",
        address: "Tenant Address1",
    };

    const tenantMainData2 = {
        name: "Tenant Name2",
        address: "Tenant Address2",
    };

    describe("Given all filds", () => {
        it("should return the 200 status code", async () => {
            const submitResponse = await SubmitTenant(tenantMainData);
            const id = (submitResponse.body as CreateTenantResponse).id;
            const response = await UpdateTenant(
                tenantMainData2,
                adminToken,
                Number(id),
            );
            expect(response.statusCode).toBe(200);
        });

        it("should update tanant in database", async () => {
            const submitResponse = await SubmitTenant(tenantMainData);
            const id = (submitResponse.body as CreateTenantResponse).id;
            const CTanants = await getTenantData();
            expect(CTanants).toHaveLength(1);
            await UpdateTenant(tenantMainData2, adminToken, Number(id));
            const UTanants = await getTenantData();
            expect(UTanants).toHaveLength(1);
            expect(CTanants[0].name).not.toEqual(UTanants[0].name);
            expect(CTanants[0].address).not.toEqual(UTanants[0].address);
        });

        it("should return 401 status code if user is not authenticated", async () => {
            const submitResponse = await SubmitTenant(tenantMainData);
            const id = (submitResponse.body as CreateTenantResponse).id;
            const response = await UpdateTenant(
                tenantMainData2,
                null,
                Number(id),
            );
            expect(response.statusCode).toBe(401);
            const tanants = await getTenantData();
            expect(tanants[0].name).toBe(tenantMainData.name);
            expect(tanants[0].address).toBe(tenantMainData.address);
        });

        it("should return 403 status code if user is not ADMIN", async () => {
            const submitResponse = await SubmitTenant(tenantMainData);
            const id = (submitResponse.body as CreateTenantResponse).id;
            const managerToken = jwks.token({ sub: "1", role: Roles.MANAGER });
            const response = await UpdateTenant(
                tenantMainData2,
                managerToken,
                Number(id),
            );
            expect(response.statusCode).toBe(403);
            const tanants = await getTenantData();
            expect(tanants[0].name).toBe(tenantMainData.name);
            expect(tanants[0].address).toBe(tenantMainData.address);
        });

        it("should return valid JSON response", async () => {
            const submitResponse = await SubmitTenant(tenantMainData);
            const id = (submitResponse.body as CreateTenantResponse).id;
            const CTanants = await getTenantData();
            expect(CTanants).toHaveLength(1);
            const response = await UpdateTenant(
                tenantMainData2,
                adminToken,
                Number(id),
            );
            expect(
                (response.headers as Record<string, string>)["content-type"],
            ).toEqual(expect.stringContaining("json"));
        });

        it("should return 400 status code if id is NAN", async () => {
            await SubmitTenant(tenantMainData);
            const response = await UpdateTenant(
                tenantMainData2,
                adminToken,
                Number("xyz"),
            );
            expect(response.statusCode).toBe(400);
            const tanants = await getTenantData();
            expect(tanants[0].name).toBe(tenantMainData.name);
            expect(tanants[0].address).toBe(tenantMainData.address);
        });
    });

    describe("Filds are missing", () => {
        it("should return 400 status code if name field is missing", async () => {
            const submitResponse = await SubmitTenant(tenantMainData);
            const id = (submitResponse.body as CreateTenantResponse).id;
            const response = await UpdateTenant(
                { ...tenantMainData2, name: "" },
                adminToken,
                Number(id),
            );
            expect(response.statusCode).toBe(400);
            const tanants = await getTenantData();
            expect(tanants[0].name).toBe(tenantMainData.name);
            expect(tanants[0].address).toBe(tenantMainData.address);
        });

        it("should return 400 status code if address field is missing", async () => {
            const submitResponse = await SubmitTenant(tenantMainData);
            const id = (submitResponse.body as CreateTenantResponse).id;
            const response = await UpdateTenant(
                { ...tenantMainData2, address: "" },
                adminToken,
                Number(id),
            );
            expect(response.statusCode).toBe(400);
            const tanants = await getTenantData();
            expect(tanants[0].name).toBe(tenantMainData.name);
            expect(tanants[0].address).toBe(tenantMainData.address);
        });
    });
});
