import {
    ConflictException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { InvitationStatus } from '@prisma/client';
import { ChatPreview } from 'src/models/index.model';
import { SELECT_user_preview_WHERE_NOT, SELECT_user_preview } from 'src/query-helpers';
import { PrismaService } from 'src/services/prisma.service';
import { ChatType } from 'src/shared/index.model';
import { UsersService } from '../users.service';

@Injectable()
export class FriendshipsService {
    constructor(private prisma: PrismaService, private usersService: UsersService) {}
    private logger = new Logger('FriendshipsService');

    async getFriendships(userId: string) {
        const friendships = await this.prisma.friendship.findMany({
            where: {
                users: { some: { id: userId } },
            },
            select: {
                id: true,
                friendsSince: true,
                users: SELECT_user_preview_WHERE_NOT(userId),
            },
        });
        return friendships.map(({ users, ...friendship }) => ({
            ...friendship,
            friend: users[0],
        }));
    }

    async getFriendship(friendId1: string, friendId2: string) {
        try {
            const {
                users: [friend],
                ...friendship
            } = await this.prisma.friendship.findFirst({
                where: {
                    users: {
                        every: {
                            OR: [{ id: friendId1 }, { id: friendId2 }],
                        },
                    },
                },
                select: {
                    id: true,
                    friendsSince: true,
                    users: SELECT_user_preview_WHERE_NOT(friendId1),
                },
            });
            return {
                ...friendship,
                friend,
            };
        } catch (err) {
            return null;
        }
    }

    async getFriendshipMessages(userId: string, friendshipId: string) {
        const friendship = await this.prisma.friendship.findFirst({
            where: {
                id: friendshipId,
                users: { some: { id: userId } },
            },
            // @TODO: outsource this into query helpers
            select: {
                messages: {
                    select: {
                        id: true,
                        timestamp: true,
                        text: true,
                        messageType: true,
                        user: SELECT_user_preview,
                        repliedToMessageId: true,
                    },
                },
            },
        });
        if (!friendship) throw new NotFoundException('Friendship not found.');
        return friendship?.messages;
    }

    async deleteFriendship(userId: string, friendshipId: string) {
        const friendship = await this.prisma.friendship.findFirst({
            where: {
                id: friendshipId,
                users: { some: { id: userId } },
            },
        });
        if (!friendship) throw new NotFoundException('Friendship not found.');

        try {
            const deletedFriendship = await this.prisma.friendship.delete({
                where: { id: friendshipId },
                select: { id: true },
            });
            if (!deletedFriendship) throw new Error('Failed to delete friendship.');
            return { successMessage: 'You deleted the friendship.' };
        } catch (err) {
            this.logger.error(err);
            throw new InternalServerErrorException('Failed to delete friendship.');
        }
    }

    //#region invitations
    // @TODO: add check if the invitEE already has a pending invitation to the invitER
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
            const successMessage =
                prevInvitation.status == 'pending'
                    ? // pending invitation
                      `You already have a pending invitation to ${prevInvitation.invitee.username}.`
                    : // accepted invitation
                      `${prevInvitation.invitee.username} already accepted an invitation from you.`;
            return {
                successMessage,
                alreadyInvited: true,
            };
        }

        // check if there is already a friendship
        const friendship = await this.getFriendship(inviteeId, inviterId);
        if (friendship)
            return {
                successMessage: `You are already friends with ${friendship.friend.username}.`,
                alreadyInvited: true,
            };

        try {
            const invitation = await this.prisma.friendshipInvitvation.create({
                data: {
                    invitee: { connect: { id: inviteeId } },
                    inviter: { connect: { id: inviterId } },
                },
                select: {
                    id: true,
                    invitedAt: true,
                    invitee: SELECT_user_preview,
                    status: true,
                },
            });
            if (!invitation) throw '';

            return {
                successMessage: `You invited ${invitation.invitee.username} to a friendship.`,
                invitation,
                alreadyInvited: false,
            };
        } catch (err) {
            // check if invitation failed because invitee doesnt exist
            try {
                await this.usersService.getUser(inviterId, inviteeId);
            } catch (err) {
                throw new NotFoundException('Could not find the user you are trying to invite.');
            }

            this.logger.error(err);
            throw new InternalServerErrorException('Failed to create invitation.');
        }
    }

    async getFriendshipInvitations(inviterOrInviteeId: string, mode: 'sent' | 'received', filter: InvitationStatus) {
        const invitations = await this.prisma.friendshipInvitvation.findMany({
            where: {
                [mode == 'received' ? 'inviteeId' : 'inviterId']: inviterOrInviteeId,
                status: filter ? { equals: filter } : {},
            },
            select: {
                id: true,
                invitedAt: true,
                [mode == 'sent' ? 'invitee' : 'inviter']: SELECT_user_preview,
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
        const prevFriendship = await this.getFriendship(inviteeId, inviterId);
        if (prevFriendship) return { successMessage: `You are already friends with ${prevFriendship.friend.username}` };

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
        const chatPreview: ChatPreview = {
            friendshipOrChatGroupId: friendship.id,
            title: friend.username,
            chatType: ChatType.PRIVATE,
        };
        return {
            successMessage: `You have accepted the friendship.`,
            friendship: {
                ...friendship,
                friend,
            },
            chatPreview,
        };
    }

    async deleteFriendshipInvitation(userId: string, invitationId: string) {
        const invitation = await this.prisma.friendshipInvitvation.findFirst({
            where: {
                id: invitationId,
                OR: [{ inviteeId: userId }, { inviterId: userId }],
            },
        });
        if (!invitation) throw new NotFoundException('Invitation not found.');

        try {
            const deletedInvitation = await this.prisma.friendshipInvitvation.delete({
                where: { id: invitationId },
                select: { id: true },
            });
            if (!deletedInvitation) throw new Error('Failed to delete invitation.');
            return { successMessage: 'You deleted the invitation.' };
        } catch (err) {
            this.logger.error(err);
            throw new InternalServerErrorException('Failed to delete invitation.');
        }
    }
    //#endregion
}
