import request from "supertest";
import app from "./src/app";
import { calculateDiscount } from "./src/utils";

describe.skip("App", () => {
    it("should calculate the discount", () => {
        const discount = calculateDiscount(100, 10);
        expect(discount).toBe(10);
    });

    it("should return 200 status", async () => {
        const response = await request(app).get("/").send();
        expect(response.statusCode).toBe(200);
    });
});
