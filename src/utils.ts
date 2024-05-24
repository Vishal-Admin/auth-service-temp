import { JwtPayload } from "jsonwebtoken";
import { TokenService } from "./services/TokenService";
import { Config } from "./config";
import { User } from "./entity/User";

export const calculateDiscount = (price: number, persentage: number) => {
    return price * (persentage / 100);
};
export class Utility {
    constructor(private tokenService: TokenService) {}
    async genrateAccessAndRefreshToken(payload: JwtPayload, user: User) {
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
        return { refreshToken, accessToken, options };
    }
}
