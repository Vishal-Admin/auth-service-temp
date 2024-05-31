import express, { NextFunction, Response } from "express";
import { UserController } from "../controllers/UserController";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import { UserService } from "../services/UserServices";
import authenticate from "../middlewares/authenticate";
import { canAccess } from "../middlewares/canAccess";
import { Roles } from "../constants";
import createUserValidator from "../validators/create-user-validator";
import updateUserValidator from "../validators/update-user-validator";
import { RegisterUserRequest, UpdateUserRequest } from "../types";
import logger from "../config/logger";

const router = express.Router();
const userRepository = AppDataSource.getRepository(User);
const userService = new UserService(userRepository);
const userController = new UserController(userService, logger);

router.post(
    "/",
    createUserValidator,
    authenticate,
    canAccess([Roles.ADMIN]),
    async (req: RegisterUserRequest, res: Response, next: NextFunction) => {
        await userController.create(req, res, next);
    },
);

router.patch(
    "/:id",
    updateUserValidator,
    authenticate,
    canAccess([Roles.ADMIN]),
    async (req: UpdateUserRequest, res: Response, next: NextFunction) => {
        await userController.update(req, res, next);
    },
);

export default router;
