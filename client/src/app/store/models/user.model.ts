import { UserPreview } from 'src/shared/index.model';

export class LoggedInUser implements UserPreview {
    id: string;
    username: string;
    accessToken: string;
}
export type UserState = LoggedInUser | null;

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
    user: LoggedInUser;
    successMessage: string;
}
