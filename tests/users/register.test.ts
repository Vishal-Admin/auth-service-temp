import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { User } from "../../src/entity/User";
import { Roles } from "../../src/constants";

describe("POST /auth/Register", () => {
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

        it("should assign only the customer role to the user", async () => {
            const userData = {
                firstName: "Vishal",
                lastName: "Panchal",
                email: "vishalpanchal570@gmail.com",
                password: "secret",
            };

            await request(app).post("/auth/register").send(userData);
            const userRepository = connection.getRepository(User);

            const users = await userRepository.find();

            expect(users[0]).toHaveProperty("role");

            expect(users[0].role).toBe(Roles.CUSTOMER);
        });

        it("should store the hased password in the database", async () => {
            const userData = {
                firstName: "Vishal",
                lastName: "Panchal",
                email: "vishalpanchal570@gmail.com",
                password: "secret",
            };
            await request(app).post("/auth/register").send(userData);

            const userRepository = connection.getRepository(User);

            const users = await userRepository.find();

            expect(users[0].password).not.toBe(userData.password);
            expect(users[0].password).toHaveLength(60);
            expect(users[0].password).toMatch(/^\$2b\$\d+\$/);
        });

        it("should return 400 status code if email is already exists", async () => {
            const userData = {
                firstName: "Vishal",
                lastName: "Panchal",
                email: "vishalpanchal570@gmail.com",
                password: "secret",
            };

            const userRepository = connection.getRepository(User);
            await userRepository.save({ ...userData, role: Roles.CUSTOMER });

            const responce = await request(app)
                .post("/auth/register")
                .send(userData);
            const users = await userRepository.find();

            expect(responce.statusCode).toBe(400);
            expect(users).toHaveLength(1);
        });
    });
    describe("Filds are missing", () => {
        it("should return 400 status code if email field is missing", async () => {
            const userData = {
                firstName: "Vishal",
                lastName: "Panchal",
                email: "",
                password: "secret",
            };
            const responce = await request(app)
                .post("/auth/register")
                .send(userData);
            expect(responce.statusCode).toBe(400);

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });
    });
});
