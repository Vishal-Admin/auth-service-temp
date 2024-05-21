import bcrypt from "bcrypt";

export class CredentialService {
    async comparePassword(userPassword: string, hashPassword: string) {
        return await bcrypt.compare(userPassword, hashPassword);
    }
}
