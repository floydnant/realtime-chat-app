import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class Password {
    @IsString()
    @MinLength(8, { message: 'Password is too short.' })
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'Password is too weak.',
    })
    password: string;
}

export class Username {
    @IsString()
    @MinLength(3, { message: 'Username is to short.' })
    @MaxLength(20, { message: 'Username is to long.' })
    username: string;
}

export class Email {
    @IsString()
    @IsEmail()
    email: string;
}

export type SignupCredentialsDTO = Password & Username & Email;

export class LoginCredentialsDTO extends Password {
    @IsString()
    usernameOrEmail: string;
}
