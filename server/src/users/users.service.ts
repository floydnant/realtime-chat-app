import {
    ConflictException,
    Injectable,
    InternalServerErrorException,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/services/prisma.service';
import { LoginCredentialsDTO, SignupCredentialsDTO } from './dto/auth-credetials.dto';
import { UpdatePasswordDTO, UpdateUserDTO } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService, private jwtService: JwtService) {}

    private logger = new Logger('UsersService');

    async signup(credetials: SignupCredentialsDTO) {
        const createdUser = await this.createUser(credetials);

        return {
            user: this.getValidatedUser(createdUser),
            successMessage: `Successfully signed up as '${createdUser.username}'.`,
        };
    }

    async login({ password, usernameOrEmail }: LoginCredentialsDTO) {
        const foundUser = await this.prisma.user.findFirst({
            where: {
                OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
            },
        });

        await this.autheticateUser(password, foundUser);
        return {
            user: this.getValidatedUser(foundUser),
            successMessage: `Successfully logged in as '${foundUser.username}'.`,
        };
    }

    me(user: User) {
        return {
            user: this.getValidatedUser(user),
            successMessage: `Still logged in as '${user.username}'.`,
        };
    }

    async updateUser(user: User, updateUserDTO: UpdateUserDTO) {
        try {
            const updatedUser = await this.prisma.user.update({
                where: { id: user.id },
                data: { ...updateUserDTO },
            });
            const { username, email } = updatedUser;
            const usrChanged = user.username != username;
            const mailChanged = user.email != email;

            return {
                user: this.getValidatedUser(updatedUser),
                successMessage: `Successfully changed ${usrChanged ? `username to '${username}'` : ''}${
                    usrChanged && mailChanged ? ' and ' : ''
                }${mailChanged ? `email to '${email}'` : ''}.`,
            };
        } catch (err) {
            // duplicate username or email
            if (err.code != 'P2002') throw new InternalServerErrorException(err);

            this.logger.verbose(
                `update user failed => '${
                    err.meta.target[0] == 'username' ? updateUserDTO.username : updateUserDTO.email
                }' already exists`,
            );

            if (err.meta.target[0] == 'username')
                throw new ConflictException(`Username '${updateUserDTO.username}' already exists.`);
            else throw new ConflictException(`${updateUserDTO.email}' is already in use.`);
        }
    }

    async updatePassword(user: User, { oldPassword, password }: UpdatePasswordDTO) {
        await this.autheticateUser(oldPassword, user);

        const updatedUser = await this.prisma.user.update({
            where: { id: user.id },
            data: { password: await this.hashPassword(password) },
        });

        return {
            user: this.getValidatedUser(updatedUser),
            successMessage: `Successfully updated password for '${user.username}'.`,
        };
    }

    async deleteUser({ id, password: encryptedPassword, username }: User, password: string) {
        await this.autheticateUser(password, { password: encryptedPassword });

        if (await this.prisma.user.delete({ where: { id } }))
            return {
                successMessage: `Successfully deleted user '${username}'.`,
            };
        else return new InternalServerErrorException('Something went wriong');
    }

    private getValidatedUser({ username, id }: User) {
        return {
            id,
            username,
            accessToken: this.createAccessToken({ username }),
        };
    }
    private createAccessToken(payload: JwtPayload) {
        return this.jwtService.sign(payload);
    }

    private async autheticateUser(passwordToCompare: string, user: User | { password: string }) {
        if (user && (await bcrypt.compare(passwordToCompare, user.password))) return true;
        else {
            this.logger.verbose('auth failed => Username/Email or Password is wrong');
            throw new UnauthorizedException('Username/Email or Password is wrong');
        }
    }

    private async createUser({ password, username, email }: SignupCredentialsDTO) {
        const hashedPassword = await this.hashPassword(password);

        try {
            return await this.prisma.user.create({ data: { password: hashedPassword, username, email } });
        } catch (err) {
            // duplicate username or email
            if (err.code != 'P2002') throw new InternalServerErrorException(err);

            this.logger.verbose(
                `signup failed => ${err.meta.target.join(', ')} '${
                    err.meta.target[0] == 'username' ? username : email
                }' already exists`,
            );

            if (err.meta.target[0] == 'username') throw new ConflictException(`Username '${username}' already exists.`);
            else throw new ConflictException(`You cannot signup for '${email}' more than once.`);
        }
    }

    private async hashPassword(password: string) {
        const salt = await bcrypt.genSalt();
        return await bcrypt.hash(password, salt);
    }
}
