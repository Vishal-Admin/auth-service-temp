import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { isJwt } from "../utils";
import { LoginCredentials, UserData } from "../../src/types";

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

    const loginMainData = {
        email: "vishalpanchal570@gmail.com",
        password: "Secret@123",
    };

    const userMainData = {
        firstName: "Vishal",
        lastName: "Panchal",
        email: "vishalpanchal570@gmail.com",
        password: "Secret@123",
    };

    const loginSubmit = async (data: LoginCredentials) => {
        const response = await request(app).post("/auth/login").send(data);
        return response;
    };

    const registerSubmit = async (data: UserData) => {
        const response = await request(app).post("/auth/register").send(data);
        return response;
    };

    describe("Given all filds", () => {
        it("should return the 200 status code", async () => {
            const userData = { ...userMainData };
            await registerSubmit(userData);
            const loginData = { ...loginMainData };
            const response = await loginSubmit(loginData);
            expect(response.statusCode).toBe(200);
        });

        it("should return valid JSON response", async () => {
            const userData = { ...userMainData };
            await registerSubmit(userData);
            const loginData = { ...loginMainData };
            const response = await loginSubmit(loginData);
            expect(
                (response.headers as Record<string, string>)["content-type"],
            ).toEqual(expect.stringContaining("json"));
        });

        it("should retun the user.id", async () => {
            const userData = { ...userMainData };
            await registerSubmit(userData);
            const loginData = { ...loginMainData };
            const response = await loginSubmit(loginData);
            expect(response.body).toHaveProperty("id");
        });

        it("should return 404 status code if email is not exists", async () => {
            const userData = { ...userMainData };
            await registerSubmit(userData);
            const loginData = { ...loginMainData, email: "user@example.com" };
            const response = await loginSubmit(loginData);
            expect(response.statusCode).toBe(404);
        });

        it("should return 400 status code if email exists but password not Match", async () => {
            const userData = { ...userMainData };
            await registerSubmit(userData);
            const loginData = { ...loginMainData, password: "password" };
            const response = await loginSubmit(loginData);
            expect(response.statusCode).toBe(404);
        });

        it("should return the access token and refresh token inside a cookie", async () => {
            const userData = { ...userMainData };
            await registerSubmit(userData);
            const loginData = { ...loginMainData };
            const response = await loginSubmit(loginData);
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
    });
    describe("Filds are missing", () => {
        it("should return 400 status code if email field is missing", async () => {
            const loginData = { ...loginMainData, email: "" };
            const response = await loginSubmit(loginData);
            expect(response.statusCode).toBe(400);
        });

        it("should return 400 status code if password field is missing", async () => {
            const loginData = { ...loginMainData, password: "" };
            const response = await loginSubmit(loginData);
            expect(response.statusCode).toBe(400);
        });
    });
    describe("Filds are not in proper Format", () => {
        it("should return 400 status code if email is not valid email", async () => {
            const loginData = { ...loginMainData, email: "@gmail.com" };
            const response = await loginSubmit(loginData);
            expect(response.status).toBe(400);
        });

        it("shoud return an array of error messages if email is missing", async () => {
            const loginData = { ...loginMainData, email: "" };
            const response = await loginSubmit(loginData);
            expect(response.body).toHaveProperty("errors");
            expect(
                (response.body as Record<string, string>).errors.length,
            ).toBeGreaterThan(0);
        });
    });
});
