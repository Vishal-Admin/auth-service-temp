import { NextFunction, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { RegisterUserRequest } from "../types";
import { UserService } from "../services/UserServices";
import { Logger } from "winston";
import { validationResult } from "express-validator";
import { Config } from "../config";
import { TokenService } from "../services/TokenService";

export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
        private tokenService: TokenService,
    ) {}

    async register(
        req: RegisterUserRequest,
        res: Response,
        next: NextFunction,
    ) {
        // validate the request
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() });
        }

        const { firstName, lastName, email, password } = req.body;

        this.logger.debug(`new request to registration`, {
            firstName,
            lastName,
            email,
            password: "******",
        });
        try {
            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
            });
            this.logger.info(`User has been regitered`, { id: user.id });

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            };

            const accessToken = this.tokenService.generateAccessToken(payload);

            //persist the refresh token
            const newRefreshToken =
                await this.tokenService.parsistRefreshToken(user);

            const refreshToken = this.tokenService.generateRefreshToken({
                ...payload,
                id: String(newRefreshToken.id),
            });

            const options = {
                domain: Config.HOST,
                httpOnly: true,
            };
            res.cookie("accessToken", accessToken, {
                ...options,
                sameSite: "strict",
                maxAge: 1000 * 60 * 60 /*1 hrs*/,
            });

            res.cookie("refreshToken", refreshToken, {
                ...options,
                sameSite: "strict",
                maxAge: 1000 * 60 * 60 * 24 * 365 /*365 Days*/,
            });

            res.status(201).json({ id: user.id });
        } catch (err) {
            next(err);
            return;
        }
    }
}
