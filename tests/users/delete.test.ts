import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { CreateUserResponse, UserData } from "../../src/types";
import { User } from "../../src/entity/User";
import createJWKSMock from "mock-jwks";
import { Roles } from "../../src/constants";

describe("Delete /users/id ", () => {
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

    const SubmitUser = async (userData: UserData) => {
        const response = await request(app)
            .post("/users")
            .send(userData)
            .set("Cookie", [`accessToken=${adminToken}`]);
        return response;
    };

    const DeleteUser = async (adminToken: string | null, id: number) => {
        const requestBuilder = request(app).delete(`/users/${id}`);
        if (adminToken) {
            await requestBuilder.set("Cookie", [`accessToken=${adminToken}`]);
        }
        const response = await requestBuilder;
        return response;
    };

    const getTenantData = async () => {
        const userRepository = connection.getRepository(User);
        const users = await userRepository.find();
        return users;
    };

    const userMainData = {
        firstName: "Vishal",
        lastName: "Panchal",
        email: "vishalpanchal570@gmail.com",
        password: "Secret@123",
        role: Roles.MANAGER,
    };

    describe("Given all filds", () => {
        it("should return the 200 status code", async () => {
            const submitResponse = await SubmitUser(userMainData);
            const id = (submitResponse.body as CreateUserResponse).id;
            const response = await DeleteUser(adminToken, Number(id));
            expect(response.statusCode).toBe(200);
        });

        it("should delete user from database", async () => {
            const submitResponse = await SubmitUser(userMainData);
            const id = (submitResponse.body as CreateUserResponse).id;
            const CUsers = await getTenantData();
            expect(CUsers).toHaveLength(1);
            await DeleteUser(adminToken, Number(id));
            const UUsers = await getTenantData();
            expect(UUsers).toHaveLength(0);
        });

        it("should return 401 status code if user is not authenticated", async () => {
            const submitResponse = await SubmitUser(userMainData);
            const id = (submitResponse.body as CreateUserResponse).id;
            const response = await DeleteUser(null, Number(id));
            expect(response.statusCode).toBe(401);
            const users = await getTenantData();
            expect(users).toHaveLength(1);
        });

        it("should return 403 status code if user is not ADMIN", async () => {
            const submitResponse = await SubmitUser(userMainData);
            const id = (submitResponse.body as CreateUserResponse).id;
            const managerToken = jwks.token({ sub: "1", role: Roles.MANAGER });
            const response = await DeleteUser(managerToken, Number(id));
            expect(response.statusCode).toBe(403);
            const users = await getTenantData();
            expect(users).toHaveLength(1);
        });

        it("should return valid JSON response", async () => {
            const submitResponse = await SubmitUser(userMainData);
            const id = (submitResponse.body as CreateUserResponse).id;
            const CUsers = await getTenantData();
            expect(CUsers).toHaveLength(1);
            const response = await DeleteUser(adminToken, Number(id));
            expect(
                (response.headers as Record<string, string>)["content-type"],
            ).toEqual(expect.stringContaining("json"));
        });

        it("should return 400 status code if id is NAN", async () => {
            await SubmitUser(userMainData);
            const response = await DeleteUser(adminToken, Number("xyz"));
            expect(response.statusCode).toBe(400);
            const users = await getTenantData();
            expect(users).toHaveLength(1);
        });
    });
});
