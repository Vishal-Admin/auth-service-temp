import { NextFunction, Response } from "express";
import { UserService } from "../services/UserServices";
import { RegisterUserRequest, UpdateUserRequest } from "../types";
import { validationResult } from "express-validator";
import { Logger } from "winston";
import createHttpError from "http-errors";

export class UserController {
    constructor(
        private userService: UserService,
        private logger: Logger,
    ) {}

    async create(req: RegisterUserRequest, res: Response, next: NextFunction) {
        // validate the request
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() });
        }

        const { firstName, lastName, email, password, role } = req.body;

        this.logger.debug(`request to create Manger User`, {
            firstName,
            lastName,
            email,
            role,
            password: "******",
        });

        try {
            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
                role,
            });
            res.status(201).json({ id: user.id });
        } catch (error) {
            next(error);
            return;
        }
    }

    async update(req: UpdateUserRequest, res: Response, next: NextFunction) {
        // validate the request
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() });
        }

        const { firstName, lastName, role } = req.body;
        const userId = req.params.id;

        if (isNaN(Number(userId))) {
            next(createHttpError(400, "Invalid url param."));
            return;
        }

        this.logger.debug("Request for updating a Manager User", req.body);

        try {
            await this.userService.update(Number(userId), {
                firstName,
                lastName,
                role,
            });

            this.logger.info("Manager User has been updated", { id: userId });
            res.json({ id: Number(userId) });
        } catch (err) {
            next(err);
        }
    }
}
