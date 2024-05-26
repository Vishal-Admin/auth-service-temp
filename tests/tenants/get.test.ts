import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { CreateTenantResponse, ITenant } from "../../src/types";
import createJWKSMock from "mock-jwks";
import { Roles } from "../../src/constants";

describe("GET /Tenants/ || GET /Tenants/id", () => {
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

    const getSingleTenant = async (id: number) => {
        const tenant = request(app).get(`/tenants/${id}`);
        return tenant;
    };

    const getAllTenants = async () => {
        const tenants = request(app).get("/tenants");
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

    const tenantMainData3 = {
        name: "Tenant Name3",
        address: "Tenant Address3",
    };

    describe("Given all filds", () => {
        it("should return the 200 statusCode getSingle data of provided id and return the 200 statusCode get all datas of tenants from db", async () => {
            await SubmitTenant(tenantMainData);
            await SubmitTenant(tenantMainData2);
            const submitResponse = await SubmitTenant(tenantMainData3);
            const id = (submitResponse.body as CreateTenantResponse).id;
            const responseAll = await getAllTenants();
            expect(responseAll.statusCode).toBe(200);
            expect(responseAll.body).toHaveLength(3);
            const response = await getSingleTenant(Number(id));
            expect(response.statusCode).toBe(200);
            const expectedProperties = [
                "id",
                "name",
                "address",
                "updated_at",
                "created_at",
            ];
            expectedProperties.forEach((property) => {
                expect(response.body).toHaveProperty(property);
            });
        });

        it("should return array from alltenant Request", async () => {
            await SubmitTenant(tenantMainData);
            await SubmitTenant(tenantMainData2);
            await SubmitTenant(tenantMainData3);
            const response = await getAllTenants();
            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it("should return object from getSingleTenant", async () => {
            const submitResponse = await SubmitTenant(tenantMainData);
            const id = (submitResponse.body as CreateTenantResponse).id;
            const response = await getSingleTenant(Number(id));
            expect(response.statusCode).toBe(200);
            expect(typeof response.body).toBe("object");
        });

        it("should return valid JSON response form all data and single data request", async () => {
            await SubmitTenant(tenantMainData);
            await SubmitTenant(tenantMainData2);
            const submitResponse = await SubmitTenant(tenantMainData3);
            const id = (submitResponse.body as CreateTenantResponse).id;
            const responseAll = await getAllTenants();
            const response = await getSingleTenant(Number(id));
            expect(response.statusCode).toBe(200);
            expect(
                (response.headers as Record<string, string>)["content-type"],
            ).toEqual(expect.stringContaining("json"));
            expect(
                (responseAll.headers as Record<string, string>)["content-type"],
            ).toEqual(expect.stringContaining("json"));
        });
    });
});
