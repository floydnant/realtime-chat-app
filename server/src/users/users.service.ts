import {
    ConflictException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ADMIN_PWD } from 'src/constants';
import { SELECT_user_preview } from 'src/prisma-abstractions/query-helpers';
import { PrismaService } from 'src/prisma-abstractions/prisma.service';
import { LoginCredentialsDTO, SignupCredentialsDTO } from './dto/auth-credetials.dto';
import { UpdatePasswordDTO, UpdateUserDTO } from './dto/update-user.dto';
import { JwtPayload } from './jwt-payload.interface';

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

    async authenticateFromToken(accessToken: string) {
        try {
            const { id } = this.jwtService.verify<JwtPayload>(accessToken);
            const user = await this.prisma.user.findFirst({
                where: { id },
                select: {
                    username: true,
                    // @TODO: this should be in its own function
                    chatGroupsJoined: { select: { chatGroupId: true } },
                    friends: { select: { id: true } },
                },
            });

            return {
                id,
                username: user?.username,
                authenticated: !!user,
                chatIds: [
                    ...user?.chatGroupsJoined.map(({ chatGroupId }) => chatGroupId),
                    ...user?.friends.map(({ id }) => id),
                ],
            };
        } catch (err) {
            return {
                id: null,
                username: null,
                authenticated: false,
                chatIds: [],
            };
        }
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
        else throw new InternalServerErrorException('Failed to delete your account.');
    }

    private getValidatedUser({ username, id }: User) {
        return {
            id,
            username,
            accessToken: this.createAccessToken({ id, username }),
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

    async getOrCreateAdminUser() {
        const adminUser =
            (await this.prisma.user.findFirst({
                where: { username: 'admin' },
            })) ||
            (await this.createUser({
                username: 'admin',
                email: 'admin@dummy.com',
                password: ADMIN_PWD,
            }));

        return adminUser.id;
    }
    private async createUser({ password, username, email }: SignupCredentialsDTO) {
        const hashedPassword = await this.hashPassword(password);

        try {
            return await this.prisma.user.create({
                data: { password: hashedPassword, username, email },
            });
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

    async getUsername(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
        return user?.username;
    }

    /////////// public user actions ////////////
    async getUser(requestingUserId: string, requestedUserId: string) {
        try {
            const { friends, ...requestedUser } = await this.prisma.user.findFirst({
                // @TODO: maybe this should only be accesible to users who are friends with the requested user
                where: { id: requestedUserId },
                select: {
                    username: true,
                    bio: true,
                    lastOnline: true,
                    friends: {
                        where: {
                            users: { some: { id: requestingUserId } },
                        },
                        select: { id: true },
                    },
                },
            });
            return {
                imageUrl: null,
                ...requestedUser,
                friendshipId: friends[0]?.id || null,
            };
        } catch (err) {
            throw new NotFoundException('Could not find user.');
        }
    }

    async searchUsers(userId: string, query: string) {
        // this is where a full text search engine would come in handy
        const users = await this.prisma.user.findMany({
            where: {
                username: {
                    contains: query,
                },
            },
            select: {
                ...SELECT_user_preview.select,
                bio: true,
                friends: {
                    where: {
                        users: { some: { id: userId } },
                    },
                    select: { id: true },
                },
            },
        });
        return users.map(({ friends, ...u }) => ({ ...u, friendshipId: friends[0]?.id || null }));
    }
}
