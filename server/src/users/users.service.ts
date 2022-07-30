import {
    ConflictException,
    Injectable,
    InternalServerErrorException,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ADMIN_PWD } from 'src/constants';
import { SELECT_user_preview_WHERE_NOT } from 'src/query-helpers';
import { PrismaService } from 'src/services/prisma.service';
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
                include: { chatGroupsJoined: { select: { chatGroupId: true } } },
            });

            return {
                id,
                username: user?.username,
                authenticated: !!user,
                chatIds: user?.chatGroupsJoined.map(({ chatGroupId }) => chatGroupId),
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
        else return new InternalServerErrorException('Something went wriong');
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

    /////////// public user actions ////////////
    async getUser(requestingUserId: string, requestedUserId: string) {
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
                },
            },
        });
        return {
            profileImageUrl: null,
            ...requestedUser,
            isFriendsWithYou: !!friends.length,
        };
    }
    //#region friendship invitations
    async inviteUserToFriendship(inviterId: string, inviteeId: string) {
        if (inviterId == inviteeId) throw new ConflictException('You cannot invite yourself to a friendship.');

        const prevInvitation = await this.prisma.friendshipInvitvation.findFirst({
            where: {
                inviterId,
                inviteeId,
                status: {
                    not: 'declined',
                },
            },
            select: {
                id: true,
                status: true,
                invitee: { select: { username: true } },
            },
        });
        if (prevInvitation) {
            if (prevInvitation.status == 'pending')
                throw new ConflictException(
                    `You already have a pending invitation to ${prevInvitation.invitee.username}.`,
                );
            // accepted
            else
                return {
                    successMessage: `${prevInvitation.invitee.username} already accepted an invitation from you.`,
                };
        }

        const invitation = await this.prisma.friendshipInvitvation.create({
            data: {
                invitee: { connect: { id: inviteeId } },
                inviter: { connect: { id: inviterId } },
            },
            select: {
                id: true,
                inviterId: true,
                invitedAt: true,
                inviteeId: true,
                status: true,
            },
        });

        return invitation;
    }
    async getFriendshipInvitationsRecieved(inviteeId: string) {
        const invitations = await this.prisma.friendshipInvitvation.findMany({
            where: { inviteeId },
            select: {
                id: true,
                invitedAt: true,
                inviterId: true,
                status: true,
            },
            orderBy: { invitedAt: 'desc' },
        });
        return invitations;
    }
    async getFriendshipInvitationsSent(inviterId: string) {
        const invitations = await this.prisma.friendshipInvitvation.findMany({
            where: { inviterId },
            select: {
                id: true,
                invitedAt: true,
                inviteeId: true,
                status: true,
            },
            orderBy: { invitedAt: 'desc' },
        });
        return invitations;
    }
    async respondToFriendshipInvitation(inviteeId: string, invitationId: string, action: 'accept' | 'decline') {
        const invitation = await this.prisma.friendshipInvitvation.findFirst({
            where: {
                id: invitationId,
                AND: { inviteeId },
            },
            select: { status: true },
        });
        if (!invitation) throw new UnauthorizedException('This invitation is not meant for you.');

        // accepted invitations should not be revokable, the user should delete the friendship instead
        if (invitation.status == 'accepted') return { successMessage: 'You already accepted to this invitation.' };

        if (invitation.status == 'declined' && action == 'decline')
            return { successMessage: 'You already declined to this invitation.' };

        const status = action == 'accept' ? 'accepted' : 'declined';
        const { inviterId } = await this.prisma.friendshipInvitvation.update({
            where: { id: invitationId },
            data: { status },
            select: { inviterId: true },
        });

        if (status == 'declined')
            return {
                successMessage: `You have declined the friendship.`,
            };

        // accepted, check if there is already a friendship
        const prevFriendship = await this.prisma.friendship.findFirst({
            where: {
                users: {
                    every: {
                        OR: [{ id: inviteeId }, { id: inviterId }],
                    },
                },
            },
            select: { users: SELECT_user_preview_WHERE_NOT(inviteeId) },
        });
        if (prevFriendship)
            throw new ConflictException(`You are already friends with ${prevFriendship.users[0].username}`);

        // otherwise create a friendship
        const {
            users: [friend], // the only user should be the new friend
            ...friendship
        } = await this.prisma.friendship.create({
            data: {
                users: {
                    connect: [{ id: inviteeId }, { id: inviterId }],
                },
            },
            select: {
                id: true,
                friendsSince: true,
                users: SELECT_user_preview_WHERE_NOT(inviteeId),
            },
        });
        return {
            successMessage: `You have accepted the friendship.`,
            friendship: {
                ...friendship,
                friend,
            },
        };
    }
    //#endregion
}
