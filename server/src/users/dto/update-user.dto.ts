import { Password, Username, validation } from './auth-credetials.dto';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UpdateUserDTO extends Username {
    @IsEmail(...validation.email.isEmail)
    email: string;
}

export class UpdatePasswordDTO extends Password {
    @IsNotEmpty({ message: 'You need to enter your old password in order to change it' })
    @IsString()
    oldPassword: string;
}
