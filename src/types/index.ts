import { Request } from "express";

export interface UserData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterUserRequest extends Request {
    body: UserData;
}

export interface AuthRequest extends Request {
    auth: {
        sub: string;
        role: string;
        id?: string;
    };
}

export type AuthCookie = {
    accessToken: string;
    refreshToken: string;
};

export interface IRefreshTokenPayload {
    id: string;
}

export interface ITenant {
    name: string;
    address: string;
}

export interface CreateTenantResponse {
    id: string;
}

export interface CreateTenantRequest extends Request {
    body: ITenant;
}

export interface LimitedUserData {
    firstName: string;
    lastName: string;
    role: string;
}

export interface UpdateUserRequest extends Request {
    body: LimitedUserData;
}

export interface CreateUserResponse {
    id: string;
}
