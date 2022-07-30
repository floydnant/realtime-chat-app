import { Controller, Get, Logger, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@prisma/client';
import { GetUser } from 'src/decorators/get-user.decorator';
import { UsersService } from '../users.service';

@UseGuards(AuthGuard())
@Controller('friendships')
export class FriendshipsController {
    constructor(private usersService: UsersService) {}
    private logger = new Logger('FriendshipController');

    @Post('/invitations/:inviteeId')
    inviteToFriendship(@GetUser() inviter: User, @Param('inviteeId') inviteeId: string) {
        this.logger.verbose(`'${inviter.username}' invites ${inviteeId} to friendship`);
        return this.usersService.inviteUserToFriendship(inviter.id, inviteeId);
    }

    @Patch('/invitations/accept/:invitationId')
    acceptFriendshipInvitation(@GetUser() invitee: User, @Param('invitationId') invitationId: string) {
        this.logger.verbose(`'${invitee.username}' accepts friendship invitation ${invitationId}`);
        return this.usersService.respondToFriendshipInvitation(invitee.id, invitationId, 'accept');
    }
    @Patch('/invitations/decline/:invitationId')
    declineFriendshipInvitation(@GetUser() invitee: User, @Param('invitationId') invitationId: string) {
        this.logger.verbose(`'${invitee.username}' declines friendship invitation ${invitationId}`);
        return this.usersService.respondToFriendshipInvitation(invitee.id, invitationId, 'decline');
    }

    @Get('/invitations/recieved')
    getFriendshipInvitationsRecieved(@GetUser() user: User) {
        this.logger.verbose(`'${user.username}' gets all friendship invitations recieved`);
        return this.usersService.getFriendshipInvitationsRecieved(user.id);
    }
    @Get('/invitations/sent')
    getFriendshipInvitationsSent(@GetUser() user: User) {
        this.logger.verbose(`'${user.username}' gets all friendship invitations sent`);
        return this.usersService.getFriendshipInvitationsSent(user.id);
    }
}
