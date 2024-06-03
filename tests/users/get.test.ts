import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { CreateUserResponse, UserData } from "../../src/types";
import createJWKSMock from "mock-jwks";
import { Roles } from "../../src/constants";

describe("GET /Users/ || GET /Users/id", () => {
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

    const getSingleUser = async (id: number) => {
        const tenant = request(app).get(`/users/${id}`);
        return tenant;
    };

    const getAllUser = async () => {
        const tenants = request(app).get("/users");
        return tenants;
    };

    const userMainData = {
        firstName: "Vishal",
        lastName: "Panchal",
        email: "vishalpanchal570@gmail.com",
        password: "Secret@123",
        role: Roles.MANAGER,
    };

    const userMainData2 = {
        firstName: "Vishal1",
        lastName: "Panchal1",
        email: "vishalpanchal5701@gmail.com",
        password: "Secret@123",
        role: Roles.MANAGER,
    };

    const userMainData3 = {
        firstName: "Vishal2",
        lastName: "Panchal2",
        email: "vishalpanchal5702@gmail.com",
        password: "Secret@123",
        role: Roles.MANAGER,
    };

    describe("Given all filds", () => {
        it("should return the 200 statusCode getSingle data of provided id and return the 200 statusCode get all datas of tenants from db", async () => {
            await SubmitUser(userMainData);
            await SubmitUser(userMainData2);
            const submitResponse = await SubmitUser(userMainData3);
            const id = (submitResponse.body as CreateUserResponse).id;
            const responseAll = await getAllUser();
            expect(responseAll.statusCode).toBe(200);
            expect(responseAll.body).toHaveLength(3);
            const response = await getSingleUser(Number(id));
            expect(response.statusCode).toBe(200);
            const expectedProperties = [
                "id",
                "firstName",
                "lastName",
                "email",
                "role",
            ];
            expectedProperties.forEach((property) => {
                expect(response.body).toHaveProperty(property);
            });
        });

        it("should return array from allUser Request", async () => {
            await SubmitUser(userMainData);
            await SubmitUser(userMainData2);
            await SubmitUser(userMainData3);
            const response = await getAllUser();
            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it("should return object from getSingleUser and do not get password poperty in reponce object", async () => {
            const submitResponse = await SubmitUser(userMainData);
            const id = (submitResponse.body as CreateUserResponse).id;
            const response = await getSingleUser(Number(id));
            expect(response.statusCode).toBe(200);
            expect(typeof response.body).toBe("object");
            expect(response.body).not.toHaveProperty("password");
        });

        it("should return valid JSON response form 'all data' and 'single data' request", async () => {
            await SubmitUser(userMainData);
            await SubmitUser(userMainData2);
            const submitResponse = await SubmitUser(userMainData3);
            const id = (submitResponse.body as CreateUserResponse).id;
            const responseAll = await getAllUser();
            const response = await getSingleUser(Number(id));
            expect(response.statusCode).toBe(200);
            expect(
                (response.headers as Record<string, string>)["content-type"],
            ).toEqual(expect.stringContaining("json"));
            expect(
                (responseAll.headers as Record<string, string>)["content-type"],
            ).toEqual(expect.stringContaining("json"));
        });

        it("should not data contain passwords in get allUser request", async () => {
            await SubmitUser(userMainData);
            await SubmitUser(userMainData2);
            await SubmitUser(userMainData3);
            const response = await getAllUser();
            expect(response.body).toHaveLength(3);

            (response.body as Array<object>).forEach((e) => {
                expect(e).not.toHaveProperty("password");
            });
        });
    });
});
