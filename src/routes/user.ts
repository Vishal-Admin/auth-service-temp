import express from "express";
import { UserController } from "../controllers/UserController";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import { UserService } from "../services/UserServices";
import authenticate from "../middlewares/authenticate";
import { canAccess } from "../middlewares/canAccess";
import { Roles } from "../constants";

const router = express.Router();
const userRepository = AppDataSource.getRepository(User);
const userService = new UserService(userRepository);
const userController = new UserController(userService);

router.post(
    "/",
    authenticate,
    canAccess([Roles.ADMIN]),
    async (req, res, next) => {
        await userController.create(req, res, next);
    },
);

export default router;
