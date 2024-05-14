import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { truncateTables } from "../../tests/utils";
import { User } from "../../src/entity/User";

describe("POST /auth/Register", () => {
    let connection: DataSource;

    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        await truncateTables(connection);
    });

    afterAll(async () => {
        await connection.destroy();
    });

    describe("Given all filds", () => {
        it("should return the 201 status code", async () => {
            const userData = {
                firstName: "Vishal",
                lastName: "Panchal",
                email: "vishalpanchal570@gmail.com",
                password: "secret",
            };

            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            expect(response.statusCode).toBe(201);
        });
        it("should return valid JSON response", async () => {
            const userData = {
                firstName: "Vishal",
                lastName: "Panchal",
                email: "vishalpanchal570@gmail.com",
                password: "secret",
            };

            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            expect(
                (response.headers as Record<string, string>)["content-type"],
            ).toEqual(expect.stringContaining("json"));
        });

        it("should persist the user in database", async () => {
            const userData = {
                firstName: "Vishal",
                lastName: "Panchal",
                email: "vishalpanchal570@gmail.com",
                password: "secret",
            };

            await request(app).post("/auth/register").send(userData);

            const userRepository = connection.getRepository(User);

            const users = await userRepository.find();
            expect(users).toHaveLength(1);
            expect(users[0].firstName).toBe(userData.firstName);
            expect(users[0].lastName).toBe(userData.lastName);
            expect(users[0].email).toBe(userData.email);
        });

        it("should retun the user.id", async () => {
            const userData = {
                firstName: "Vishal",
                lastName: "Panchal",
                email: "vishalpanchal570@gmail.com",
                password: "secret",
            };

            const user = await request(app)
                .post("/auth/register")
                .send(userData);
            expect(user.body).toHaveProperty("id");
        });
    });
    describe("Filds are missing", () => {});
});
