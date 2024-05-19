import fs from "fs";
import path from "path";
import { NextFunction, Response } from "express";
import { JwtPayload, sign } from "jsonwebtoken";
import { RegisterUserRequest } from "../types";
import { UserService } from "../services/UserServices";
import { Logger } from "winston";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import { Config } from "../config";

export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
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

            //jWT token with public and private keys
            let privateKey: Buffer;
            try {
                privateKey = fs.readFileSync(
                    path.join(__dirname, "../../certs/private.pem"),
                );
            } catch (err) {
                const error = createHttpError(
                    500,
                    "Error while reading private key",
                );
                next(error);
                return;
            }
            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            };
            const accessToken = sign(payload, privateKey, {
                algorithm: "RS256",
                expiresIn: "1h",
                issuer: Config.ISSUER,
            });
            const refreshToken = sign(payload, Config.REFRESH_TOKEN_KEY!, {
                algorithm: "HS256",
                expiresIn: "1y",
                issuer: Config.ISSUER,
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
