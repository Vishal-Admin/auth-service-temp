import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { User } from "../../src/entity/User";
import { Roles } from "../../src/constants";
import { UserData } from "../../src/types";
import { isJwt } from "../utils";
import { RefreshToken } from "../../src/entity/RefreshToken";

describe.skip("POST /auth/Register", () => {
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

    const userMainData = {
        firstName: "Vishal",
        lastName: "Panchal",
        email: "vishalpanchal570@gmail.com",
        password: "Secret@123",
    };

    const SubmitData = async (data: UserData) => {
        const response = await request(app).post("/auth/register").send(data);
        return response;
    };

    const getUserData = async () => {
        const userRepository = connection.getRepository(User);
        const users = await userRepository.find();
        return users;
    };

    describe("Given all filds", () => {
        it("should return the 201 status code", async () => {
            const response = await SubmitData({ ...userMainData });
            expect(response.statusCode).toBe(201);
        });
        it("should return valid JSON response", async () => {
            const response = await SubmitData({ ...userMainData });
            expect(
                (response.headers as Record<string, string>)["content-type"],
            ).toEqual(expect.stringContaining("json"));
        });

        it("should persist the user in database", async () => {
            const userData = { ...userMainData };
            await SubmitData(userData);
            const users = await getUserData();
            expect(users).toHaveLength(1);
            expect(users[0].firstName).toBe(userData.firstName);
            expect(users[0].lastName).toBe(userData.lastName);
            expect(users[0].email).toBe(userData.email);
        });

        it("should retun the user.id", async () => {
            const user = await SubmitData({ ...userMainData });
            expect(user.body).toHaveProperty("id");
        });

        it("should assign only the customer role to the user", async () => {
            const userData = { ...userMainData };
            await SubmitData(userData);
            const users = await getUserData();
            expect(users[0]).toHaveProperty("role");
            expect(users[0].role).toBe(Roles.CUSTOMER);
        });

        it("should store the hased password in the database", async () => {
            const userData = { ...userMainData };
            await SubmitData(userData);
            const users = await getUserData();
            expect(users[0].password).not.toBe(userData.password);
            expect(users[0].password).toHaveLength(60);
            expect(users[0].password).toMatch(/^\$2b\$\d+\$/);
        });

        it("should return 400 status code if email is already exists", async () => {
            const userData = { ...userMainData };
            const userRepository = connection.getRepository(User);
            await userRepository.save({ ...userData, role: Roles.CUSTOMER });
            const response = await SubmitData(userData);
            const users = await getUserData();
            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(1);
        });

        it("should return the access token and refresh token inside a cookie", async () => {
            const userData = { ...userMainData };
            const response = await SubmitData(userData);
            interface Headers {
                ["set-cookie"]: string[];
            }
            let accessToken = null;
            let refreshToken = null;
            const cookies =
                (response.headers as unknown as Headers)["set-cookie"] || [];
            cookies.forEach((cookie) => {
                if (cookie.startsWith("accessToken=")) {
                    accessToken = cookie.split(";")[0].split("=")[1];
                }
                if (cookie.startsWith("refreshToken=")) {
                    refreshToken = cookie.split(";")[0].split("=")[1];
                }
            });
            expect(accessToken).not.toBeNull();
            expect(refreshToken).not.toBeNull();

            expect(isJwt(accessToken)).toBeTruthy();
            expect(isJwt(refreshToken)).toBeTruthy();
        });

        it("should store the refresh token in the database", async () => {
            const userData = { ...userMainData };
            const response = await SubmitData(userData);
            const refreshTokenRepo = connection.getRepository(RefreshToken);

            const tokens = await refreshTokenRepo
                .createQueryBuilder("refreshToken")
                .where("refreshToken.userId = :userId", {
                    userId: (response.body as Record<string, string>).id,
                })
                .getMany();

            expect(tokens).toHaveLength(1);
        });
    });
    describe("Filds are missing", () => {
        it("should return 400 status code if email field is missing", async () => {
            const userData = { ...userMainData, email: "" };
            const response = await SubmitData(userData);
            expect(response.statusCode).toBe(400);
            const users = await getUserData();
            expect(users).toHaveLength(0);
        });
        it("should return 400 status code if firstName field is missing", async () => {
            const userData = { ...userMainData, firstName: "" };
            const response = await SubmitData(userData);
            expect(response.statusCode).toBe(400);
            const users = await getUserData();
            expect(users).toHaveLength(0);
        });
        it("should return 400 status code if lastName field is missing", async () => {
            const userData = { ...userMainData, lastName: "" };
            const response = await SubmitData(userData);
            expect(response.statusCode).toBe(400);
            const users = await getUserData();
            expect(users).toHaveLength(0);
        });
        it("should return 400 status code if password field is missing", async () => {
            const userData = { ...userMainData, password: "" };
            const response = await SubmitData(userData);
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
            await SubmitData(userData);
            const users = await getUserData();
            const user = users[0];
            expect(user.email).toBe("vishalpanchal570@gmail.com");
        });

        it("should return 400 status code if email is not valid email", async () => {
            const userData = { ...userMainData, email: "@gmail.com" };
            const response = await SubmitData(userData);
            expect(response.status).toBe(400);
            const users = await getUserData();
            expect(users).toHaveLength(0);
        });

        it("should return 400 status code if password length is less then 8 character", async () => {
            const userData = { ...userMainData, password: "secret" };
            const response = await SubmitData(userData);
            expect(response.status).toBe(400);
            const users = await getUserData();
            expect(users).toHaveLength(0);
        });
        it("shoud return an array of error messages if email is missing", async () => {
            const userData = { ...userMainData, email: "" };
            const response = await SubmitData(userData);
            expect(response.body).toHaveProperty("errors");
            expect(
                (response.body as Record<string, string>).errors.length,
            ).toBeGreaterThan(0);
        });
    });
});
