import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { CreateUserResponse, LimitedUserData } from "../../src/types";
import createJWKSMock from "mock-jwks";
import { Roles } from "../../src/constants";
import { User } from "../../src/entity/User";

describe("PATCH(Update) /User/id ", () => {
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

    const SubmitUser = async (userData: LimitedUserData) => {
        const response = await request(app)
            .post("/users")
            .send(userData)
            .set("Cookie", [`accessToken=${adminToken}`]);
        return response;
    };

    const UpdateUser = async (
        userData: LimitedUserData,
        adminToken: string | null,
        id: number,
    ) => {
        const requestBuilder = request(app)
            .patch(`/users/${id}`)
            .send(userData);
        if (adminToken) {
            await requestBuilder.set("Cookie", [`accessToken=${adminToken}`]);
        }
        const response = await requestBuilder;
        return response;
    };

    const getUsers = async () => {
        const tenantRepository = connection.getRepository(User);
        const tenants = await tenantRepository.find();
        return tenants;
    };

    const userMainData = {
        firstName: "Vishal",
        lastName: "Panchal",
        email: "vishalpanchal570@gmail.com",
        password: "Secret@123",
        role: Roles.MANAGER,
    };

    const userUpdateData = {
        firstName: "vishal2",
        lastName: "Panchal2",
        role: Roles.MANAGER,
    };

    describe("Given all filds", () => {
        it("should return the 200 status code", async () => {
            const submitResponse = await SubmitUser(userMainData);
            const id = (submitResponse.body as CreateUserResponse).id;
            const response = await UpdateUser(
                userUpdateData,
                adminToken,
                Number(id),
            );
            expect(response.statusCode).toBe(200);
        });

        it("should update tanant in database", async () => {
            const submitResponse = await SubmitUser(userMainData);
            const id = (submitResponse.body as CreateUserResponse).id;
            const CUsers = await getUsers();
            expect(CUsers).toHaveLength(1);
            await UpdateUser(
                { ...userUpdateData, role: Roles.ADMIN },
                adminToken,
                Number(id),
            );
            const UUsers = await getUsers();
            expect(UUsers).toHaveLength(1);
            expect(CUsers[0].firstName).not.toEqual(UUsers[0].firstName);
            expect(CUsers[0].lastName).not.toEqual(UUsers[0].lastName);
            expect(CUsers[0].role).not.toEqual(UUsers[0].role);
        });

        it("should return 401 status code if user is not authenticated", async () => {
            const submitResponse = await SubmitUser(userMainData);
            const id = (submitResponse.body as CreateUserResponse).id;
            const response = await UpdateUser(userUpdateData, null, Number(id));
            expect(response.statusCode).toBe(401);
            const users = await getUsers();
            expect(users[0].firstName).toBe(userMainData.firstName);
            expect(users[0].lastName).toBe(userMainData.lastName);
            expect(users[0].role).toBe(userMainData.role);
        });

        it("should return 403 status code if user is not ADMIN", async () => {
            const submitResponse = await SubmitUser(userMainData);
            const id = (submitResponse.body as CreateUserResponse).id;
            const managerToken = jwks.token({ sub: "1", role: Roles.MANAGER });
            const response = await UpdateUser(
                userUpdateData,
                managerToken,
                Number(id),
            );
            expect(response.statusCode).toBe(403);
            const users = await getUsers();
            expect(users[0].firstName).toBe(userMainData.firstName);
            expect(users[0].lastName).toBe(userMainData.lastName);
            expect(users[0].role).toBe(userMainData.role);
        });

        it("should return valid JSON response", async () => {
            const submitResponse = await SubmitUser(userMainData);
            const id = (submitResponse.body as CreateUserResponse).id;
            const CUsers = await getUsers();
            expect(CUsers).toHaveLength(1);
            const response = await UpdateUser(
                userUpdateData,
                adminToken,
                Number(id),
            );
            expect(
                (response.headers as Record<string, string>)["content-type"],
            ).toEqual(expect.stringContaining("json"));
        });

        it("should return 400 status code if id is NAN", async () => {
            await SubmitUser(userMainData);
            const response = await UpdateUser(
                userUpdateData,
                adminToken,
                Number("xyz"),
            );
            expect(response.statusCode).toBe(400);
            const users = await getUsers();
            expect(users[0].firstName).toBe(userMainData.firstName);
            expect(users[0].lastName).toBe(userMainData.lastName);
            expect(users[0].role).toBe(userMainData.role);
        });
    });

    describe("Filds are missing", () => {
        it("should return 400 status code if firstName field is missing", async () => {
            const submitResponse = await SubmitUser(userMainData);
            const id = (submitResponse.body as CreateUserResponse).id;
            const response = await UpdateUser(
                { ...userUpdateData, firstName: "" },
                adminToken,
                Number(id),
            );
            expect(response.statusCode).toBe(400);
            const users = await getUsers();
            expect(users[0].firstName).toBe(userMainData.firstName);
            expect(users[0].lastName).toBe(userMainData.lastName);
            expect(users[0].role).toBe(userMainData.role);
        });

        it("should return 400 status code if lastName field is missing", async () => {
            const submitResponse = await SubmitUser(userMainData);
            const id = (submitResponse.body as CreateUserResponse).id;
            const response = await UpdateUser(
                { ...userUpdateData, lastName: "" },
                adminToken,
                Number(id),
            );
            expect(response.statusCode).toBe(400);
            const users = await getUsers();
            expect(users[0].firstName).toBe(userMainData.firstName);
            expect(users[0].lastName).toBe(userMainData.lastName);
            expect(users[0].role).toBe(userMainData.role);
        });

        it("should return 400 status code if role field is missing", async () => {
            const submitResponse = await SubmitUser(userMainData);
            const id = (submitResponse.body as CreateUserResponse).id;
            const response = await UpdateUser(
                { ...userUpdateData, role: "" },
                adminToken,
                Number(id),
            );
            expect(response.statusCode).toBe(400);
            const users = await getUsers();
            expect(users[0].firstName).toBe(userMainData.firstName);
            expect(users[0].lastName).toBe(userMainData.lastName);
            expect(users[0].role).toBe(userMainData.role);
        });
    });

    describe("Filds are not in proper Format", () => {
        it("should tream the all the fields", async () => {
            const submitResponse = await SubmitUser(userMainData);
            const id = (submitResponse.body as CreateUserResponse).id;
            await UpdateUser(
                {
                    ...userUpdateData,
                    firstName: " vishal2 ",
                    lastName: " Panchal2 ",
                },
                adminToken,
                Number(id),
            );
            const users = await getUsers();
            const user = users[0];
            expect(user.firstName).toBe("vishal2");
            expect(user.lastName).toBe("Panchal2");
        });
    });
});
