import fs from "fs";
import createHttpError from "http-errors";
import { JwtPayload, sign } from "jsonwebtoken";
import path from "path";
import { Config } from "../config";
import { RefreshToken } from "../entity/RefreshToken";
import { User } from "../entity/User";
import { Repository } from "typeorm";

export class TokenService {
    constructor(private refreshTokenRepository: Repository<RefreshToken>) {}

    generateAccessToken(payload: JwtPayload) {
        let privateKey: Buffer;
        try {
            privateKey = fs.readFileSync(
                path.join(__dirname, "../../certs/private.pem"),
            );
        } catch (err) {
            throw createHttpError(500, "Error while reading private key");
        }

        const accessToken = sign(payload, privateKey, {
            algorithm: "RS256",
            expiresIn: "1h",
            issuer: Config.ISSUER,
        });

        return accessToken;
    }

    generateRefreshToken(payload: JwtPayload) {
        const refreshToken = sign(payload, Config.REFRESH_TOKEN_KEY!, {
            algorithm: "HS256",
            expiresIn: "1y",
            issuer: Config.ISSUER,
            jwtid: String(payload.id),
        });

        return refreshToken;
    }

    async parsistRefreshToken(user: User) {
        //persist the refresh token
        const MS_IN_YEAR = 1000 * 24 * 60 * 60 * 365;
        const newRefreshToken = await this.refreshTokenRepository.save({
            expires_at: new Date(Date.now() + MS_IN_YEAR),
            user: user,
        });

        return newRefreshToken;
    }
}
