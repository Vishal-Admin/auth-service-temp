import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";

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

    describe("Given all filds", () => {
        it("should return the 201 status code", async () => {
            const tenantData = {
                name: "Tenant Name",
                address: "Tenant Address",
            };
            const response = await request(app)
                .post("/tenants")
                .send(tenantData);
            expect(response.statusCode).toBe(201);
        });

        // it("should return valid JSON response", async () => {
        //     const userData = { ...userMainData };
        //     await registerSubmit(userData);
        //     const loginData = { ...loginMainData };
        //     const response = await loginSubmit(loginData);
        //     expect(
        //         (response.headers as Record<string, string>)["content-type"],
        //     ).toEqual(expect.stringContaining("json"));
        // });
    });
});
