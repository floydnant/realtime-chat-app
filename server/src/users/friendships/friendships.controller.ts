import {
    Controller,
    Delete,
    Get,
    Logger,
    NotFoundException,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InvitationStatus, User } from '@prisma/client';
import { GetUser } from 'src/decorators/get-user.decorator';
import { FriendshipsService } from './friendships.service';

@UseGuards(AuthGuard())
@Controller('friendships')
export class FriendshipsController {
    constructor(private friendshipsService: FriendshipsService) {}
    private logger = new Logger('FriendshipController');

    @Get()
    getFriendships(@GetUser() user: User) {
        this.logger.verbose(`'${user.username}' retrieves all friendships`);
        return this.friendshipsService.getFriendships(user.id);
    }
    @Get('/with/:friendId')
    async getFriendshipFromFriendId(@GetUser() user: User, @Param('friendId') friendId: string) {
        this.logger.verbose(`'${user.username}' retrieves friendship with ${friendId}`);
        const friendship = await this.friendshipsService.getFriendship(user.id, friendId);
        if (!friendship) throw new NotFoundException('Friendship not found.');
        return friendship;
    }

    @Get('/:id/messages')
    getMessages(@GetUser() user: User, @Param('id') id: string) {
        return this.friendshipsService.getFriendshipMessages(user.id, id);
    }

    @Delete('/:id')
    deleteFriendship(@GetUser() user: User, @Param('id') id: string) {
        this.logger.verbose(`'${user.username}' deleted friendship ${id}`);
        return this.friendshipsService.deleteFriendship(user.id, id);
    }

    //#region invitations
    @Post('/invitations/:inviteeId')
    inviteToFriendship(@GetUser() inviter: User, @Param('inviteeId') inviteeId: string) {
        this.logger.verbose(`'${inviter.username}' invites ${inviteeId} to friendship`);
        return this.friendshipsService.inviteUserToFriendship(inviter.id, inviteeId);
    }

    @Patch('/invitations/accept/:invitationId')
    acceptInvitation(@GetUser() invitee: User, @Param('invitationId') invitationId: string) {
        this.logger.verbose(`'${invitee.username}' accepts friendship invitation ${invitationId}`);
        return this.friendshipsService.respondToFriendshipInvitation(invitee.id, invitationId, 'accept');
    }
    @Patch('/invitations/decline/:invitationId')
    declineInvitation(@GetUser() invitee: User, @Param('invitationId') invitationId: string) {
        this.logger.verbose(`'${invitee.username}' declines friendship invitation ${invitationId}`);
        return this.friendshipsService.respondToFriendshipInvitation(invitee.id, invitationId, 'decline');
    }

    @Get('/invitations/received')
    getInvitationsReceived(@GetUser() user: User, @Query('filter') filter: InvitationStatus) {
        this.logger.verbose(`'${user.username}' gets all friendship invitations received`);
        return this.friendshipsService.getFriendshipInvitations(user.id, 'received', filter);
    }
    @Get('/invitations/sent')
    getInvitationsSent(@GetUser() user: User, @Query('filter') filter: InvitationStatus) {
        this.logger.verbose(`'${user.username}' gets all friendship invitations sent`);
        return this.friendshipsService.getFriendshipInvitations(user.id, 'sent', filter);
    }

    @Delete('/invitations/:invitationId')
    deleteInvitation(@GetUser() user: User, @Param('invitationId') invitationId: string) {
        this.logger.verbose(`'${user.username}' deletes friendship invitation ${invitationId}`);
        return this.friendshipsService.deleteFriendshipInvitation(user.id, invitationId);
    }
    //#endregion
}
