import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import createJWKSMock from "mock-jwks";
import { User } from "../../src/entity/User";
import { Roles } from "../../src/constants";
import { UserData } from "../../src/types";

describe("POST /users", () => {
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

    const userMainData = {
        firstName: "Vishal",
        lastName: "Panchal",
        email: "vishalpanchal570@gmail.com",
        password: "Secret@123",
        role: Roles.MANAGER,
    };

    const SubmitUser = async (
        userData: UserData,
        adminToken: string | null,
    ) => {
        const requestBuilder = request(app).post("/users").send(userData);
        if (adminToken) {
            await requestBuilder.set("Cookie", [`accessToken=${adminToken}`]);
        }
        const response = await requestBuilder;
        return response;
    };

    const getUserData = async () => {
        const userRepository = connection.getRepository(User);
        const users = await userRepository.find();
        return users;
    };

    describe("Given all filds", () => {
        it("should return statusCode 201", async () => {
            const response = await SubmitUser(userMainData, adminToken);
            expect(response.statusCode).toBe(201);
        });

        it("should pesist the user in database", async () => {
            await SubmitUser(userMainData, adminToken);
            const users = await getUserData();
            expect(users).toHaveLength(1);
            const expectedProperties = [
                "id",
                "firstName",
                "lastName",
                "email",
                "password",
            ];
            expectedProperties.forEach((property) => {
                expect(users[0]).toHaveProperty(property);
            });
        });

        it("should return 401 status code if user is not authenticated", async () => {
            const response = await SubmitUser(userMainData, null);
            expect(response.statusCode).toBe(401);
            const tanants = await getUserData();
            expect(tanants).toHaveLength(0);
        });

        it("should return 403 status code if user is not ADMIN", async () => {
            const managerToken = jwks.token({ sub: "1", role: Roles.MANAGER });
            const response = await SubmitUser(userMainData, managerToken);
            expect(response.statusCode).toBe(403);
            const users = await getUserData();
            expect(users).toHaveLength(0);
        });

        it("should return valid JSON response", async () => {
            const response = await SubmitUser(userMainData, adminToken);
            expect(
                (response.headers as Record<string, string>)["content-type"],
            ).toEqual(expect.stringContaining("json"));
        });
    });
    describe("Filds are missing", () => {
        it("should return 400 status code if email field is missing", async () => {
            const userData = { ...userMainData, email: "" };
            const response = await SubmitUser(userData, adminToken);
            expect(response.statusCode).toBe(400);
            const users = await getUserData();
            expect(users).toHaveLength(0);
        });
        it("should return 400 status code if firstName field is missing", async () => {
            const userData = { ...userMainData, firstName: "" };
            const response = await SubmitUser(userData, adminToken);
            expect(response.statusCode).toBe(400);
            const users = await getUserData();
            expect(users).toHaveLength(0);
        });
        it("should return 400 status code if lastName field is missing", async () => {
            const userData = { ...userMainData, lastName: "" };
            const response = await SubmitUser(userData, adminToken);
            expect(response.statusCode).toBe(400);
            const users = await getUserData();
            expect(users).toHaveLength(0);
        });
        it("should return 400 status code if password field is missing", async () => {
            const userData = { ...userMainData, password: "" };
            const response = await SubmitUser(userData, adminToken);
            expect(response.statusCode).toBe(400);
            const users = await getUserData();
            expect(users).toHaveLength(0);
        });
    });
    describe("Filds are not in proper Format", () => {
        it("should should tream the email field", async () => {
            const userData = {
                ...userMainData,
                email: " vishalpanchal570@gmail.com ",
            };
            await SubmitUser(userData, adminToken);
            const users = await getUserData();
            const user = users[0];
            expect(user.email).toBe("vishalpanchal570@gmail.com");
        });

        it("should return 400 status code if email is not valid email", async () => {
            const userData = { ...userMainData, email: "@gmail.com" };
            const response = await SubmitUser(userData, adminToken);
            expect(response.status).toBe(400);
            const users = await getUserData();
            expect(users).toHaveLength(0);
        });

        it("should return 400 status code if password length is less then 8 character", async () => {
            const userData = { ...userMainData, password: "secret" };
            const response = await SubmitUser(userData, adminToken);
            expect(response.status).toBe(400);
            const users = await getUserData();
            expect(users).toHaveLength(0);
        });
        it("shoud return an array of error messages if email is missing", async () => {
            const userData = { ...userMainData, email: "" };
            const response = await SubmitUser(userData, adminToken);
            expect(response.body).toHaveProperty("errors");
            expect(
                (response.body as Record<string, string>).errors.length,
            ).toBeGreaterThan(0);
        });
    });
});
