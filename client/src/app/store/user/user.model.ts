import { UserPreview } from 'src/shared/index.model';

export class UserState {
    loggedInUser: LoggedInUser | null = null;
    loading = false;
}
export interface LoggedInUser extends UserPreview {
    accessToken: string;
}

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
