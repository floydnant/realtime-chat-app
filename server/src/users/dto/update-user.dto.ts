import { Password, Username, Email } from './auth-credetials.dto';
import { IsString } from 'class-validator';

export type UpdateUserDTO = Username & Email;

export class UpdatePasswordDTO extends Password {
    @IsString()
    oldPassword: string;
}
