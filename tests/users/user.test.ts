import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import createJWKSMock from "mock-jwks";
import { User } from "../../src/entity/User";
import { Roles } from "../../src/constants";

describe("Get /auth/self ", () => {
    let connection: DataSource;
    let jwks: ReturnType<typeof createJWKSMock>;

    beforeAll(async () => {
        jwks = createJWKSMock("http://localhost:5501");
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        jwks.start();
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterEach(() => {
        jwks.stop();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    const userMainData = {
        firstName: "Vishal",
        lastName: "Panchal",
        email: "vishalpanchal570@gmail.com",
        password: "Secret@123",
    };

    describe("Given all filds", () => {
        it("should return the 200 status code", async () => {
            const accessToken = jwks.token({ sub: "1", role: Roles.CUSTOMER });
            const response = await request(app)
                .get("/auth/self")
                .set("Cookie", [`accessToken=${accessToken}`]);
            expect(response.statusCode).toBe(200);
        });

        it("should return the user data", async () => {
            const userRepository = connection.getRepository(User);
            const data = await userRepository.save({
                ...userMainData,
                role: Roles.CUSTOMER,
            });
            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            });

            const response = await request(app)
                .get("/auth/self")
                .set("Cookie", [`accessToken=${accessToken}`]);

            expect((response.body as Record<string, string>).id).toBe(data.id);
        });

        it("should not have property password in user", async () => {
            const userRepository = connection.getRepository(User);
            const data = await userRepository.save({
                ...userMainData,
                role: Roles.CUSTOMER,
            });
            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            });

            const response = await request(app)
                .get("/auth/self")
                .set("Cookie", [`accessToken=${accessToken}`]);

            expect(response.body as Record<string, string>).not.toHaveProperty(
                "password",
            );
        });

        it("should return 401 statusCode if token dose not exists", async () => {
            const userRepository = connection.getRepository(User);
            await userRepository.save({
                ...userMainData,
                role: Roles.CUSTOMER,
            });

            const response = await request(app).get("/auth/self");

            expect(response.statusCode).toBe(401);
        });
    });
});
