import { Injectable } from '@angular/core';
import {
    InvitationStatus,
    ReceivedFriendshipInvitation,
    FriendshipFull,
    SentFriendshipInvitation,
    InvitationResponse,
    FriendshipInvitation,
} from 'src/shared/index.model';
import { HttpSuccessResponse } from '../store/app.model';
import { SendFriendshipInvitationResponse, ChatPreview } from '../store/chat/chat.model';
import { BaseHttpClient } from './base-http-client.service';

@Injectable({
    providedIn: 'root',
})
export class FriendshipService {
    constructor(private http: BaseHttpClient) {}

    getInvitation(invitationId: string) {
        return this.http.get<FriendshipInvitation>(`/friendships/invitations/${invitationId}`);
    }
    sendInvitation(userId: string) {
        return this.http.post<SendFriendshipInvitationResponse>(`/friendships/invitations/${userId}`);
    }
    deleteInvitation(invitationId: string) {
        return this.http.delete<HttpSuccessResponse>(`/friendships/invitations/${invitationId}`);
    }

    getInvitationsSent() {
        return this.http.get<SentFriendshipInvitation[]>(`/friendships/invitations/sent`);
    }
    getInvitationsReceived(filter: InvitationStatus) {
        return this.http.get<ReceivedFriendshipInvitation[]>(`/friendships/invitations/received?filter=${filter}`);
    }

    getFriendshipChatPreview(friendshipId: string) {
        return this.http.get<ChatPreview>(`/chat-previews/${friendshipId}?type=friendship`);
    }

    respondToInvitation(invitationId: string, response: InvitationResponse) {
        type Response = HttpSuccessResponse<{
            friendship?: FriendshipFull;
            chatPreview?: ChatPreview;
        }>;

        return this.http.patch<Response>(`/friendships/invitations/${response}/${invitationId}`, {});
    }
}
