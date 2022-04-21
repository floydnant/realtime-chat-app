import { HttpServerErrorResponse } from '.';

export class User {
    id: string;
    username: string;
    accessToken: string;
}
export type UserState = User | null;

export class LoginCredentialsDTO {
    usernameOrEmail: string;
    password: string;
}
export class SignupCredentialsDTO {
    email: string;
    username: string;
    password: string;
}

export interface AuthSuccessResponse {
    user: User;
    successMessage: string;
}

export type AuthResponse = AuthSuccessResponse | HttpServerErrorResponse;
