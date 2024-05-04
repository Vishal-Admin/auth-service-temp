import request from "supertest";
import app from "../../src/app";

describe("POST /auth/Register", () => {
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
        });
    });
    describe("Filds are missing", () => {});
});
