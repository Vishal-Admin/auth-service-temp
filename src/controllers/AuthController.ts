import { NextFunction, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { AuthRequest, RegisterUserRequest } from "../types";
import { UserService } from "../services/UserServices";
import { Logger } from "winston";
import { validationResult } from "express-validator";
import { TokenService } from "../services/TokenService";
import createHttpError from "http-errors";
import { CredentialService } from "../services/CredentialService";
import { Utility } from "../utils";

export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
        private tokenService: TokenService,
        private credentialService: CredentialService,
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
            const utility = new Utility(this.tokenService);
            const {
                refreshTitle,
                refreshToken,
                refreshOptions,
                accessTitle,
                accessToken,
                accessOptions,
            } = await utility.genrateAccessAndRefreshToken(payload, user);

            res.cookie(accessTitle, accessToken, accessOptions);
            res.cookie(refreshTitle, refreshToken, refreshOptions);
            res.status(201).json({ id: user.id });
        } catch (err) {
            next(err);
            return;
        }
    }

    async login(req: RegisterUserRequest, res: Response, next: NextFunction) {
        // validate the request
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() });
        }

        const { email, password } = req.body;

        this.logger.debug(`new request to login`, {
            email,
            password: "******",
        });

        try {
            const user = await this.userService.findByEmail(email);
            if (!user) {
                const error = createHttpError(404, "Invalid credentials");
                next(error);
                return;
            }
            const isPasswordMatch =
                await this.credentialService.comparePassword(
                    password,
                    user.password,
                );
            if (!isPasswordMatch) {
                const error = createHttpError(404, "Invalid credentials");
                next(error);
                return;
            }
            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            };

            const utility = new Utility(this.tokenService);
            const {
                refreshTitle,
                refreshToken,
                refreshOptions,
                accessTitle,
                accessToken,
                accessOptions,
            } = await utility.genrateAccessAndRefreshToken(payload, user);

            res.cookie(accessTitle, accessToken, accessOptions);
            res.cookie(refreshTitle, refreshToken, refreshOptions);
            this.logger.info("User has been logged in", { id: user.id });
            res.json({ id: user.id });
        } catch (err) {
            next(err);
            return;
        }
    }

    async self(req: AuthRequest, res: Response) {
        const id = Number(req.auth.sub);
        const user = await this.userService.findById(id);
        res.json({ ...user, password: undefined });
    }

    async refresh(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const payload: JwtPayload = {
                sub: req.auth.sub,
                role: req.auth.role,
            };

            const user = await this.userService.findById(Number(req.auth.sub));
            if (!user) {
                const error = createHttpError(
                    404,
                    "user with this token not found",
                );
                next(error);
                return;
            }
            const utility = new Utility(this.tokenService);
            const {
                refreshTitle,
                refreshToken,
                refreshOptions,
                accessTitle,
                accessToken,
                accessOptions,
            } = await utility.genrateAccessAndRefreshToken(payload, user);
            // delete the old refresh token
            await this.tokenService.deleteRefreshToken(Number(req.auth.id));

            res.cookie(accessTitle, accessToken, accessOptions);
            res.cookie(refreshTitle, refreshToken, refreshOptions);
            this.logger.info("User has been logged in", { id: user.id });
            res.json({ id: user.id });
        } catch (error) {
            next(error);
            return;
        }
    }
}
