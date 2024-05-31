import { Repository } from "typeorm";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";
import { User } from "../entity/User";
import { LimitedUserData, UserData } from "../types";

export class UserService {
    constructor(private userRepository: Repository<User>) {}

    async create({ firstName, lastName, email, password, role }: UserData) {
        const user = await this.userRepository.findOne({
            where: { email: email },
        });
        if (user) {
            const err = createHttpError(
                400,
                "User with this email already exists",
            );
            throw err;
        }
        // hash the password
        const soltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, soltRounds);
        try {
            return await this.userRepository.save({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role,
            });
        } catch (error) {
            const err = createHttpError(
                500,
                "Faild to Store data in the database",
            );
            throw err;
        }
    }

    async findByEmail(email: string) {
        return await this.userRepository.findOne({
            where: { email },
        });
    }

    async findById(id: number) {
        return await this.userRepository.findOne({
            where: { id },
        });
    }

    async update(
        userId: number,
        { firstName, lastName, role }: LimitedUserData,
    ) {
        try {
            return await this.userRepository.update(userId, {
                firstName,
                lastName,
                role,
            });
        } catch (err) {
            const error = createHttpError(
                500,
                "Failed to update the user in the database",
            );
            throw error;
        }
    }
}
