import { Injectable } from '@angular/core';
import {
    InvitationStatus,
    ReceivedFriendshipInvitation,
    FriendshipFull,
    SentFriendshipInvitation,
} from 'src/shared/index.model';
import { HttpSuccessResponse } from '../store/app.model';
import { SendFriendshipInvitationResponse, ChatPreview } from '../store/chat/chat.model';
import { BaseHttpClient } from './base-http-client.service';

@Injectable({
    providedIn: 'root',
})
export class FriendshipService {
    constructor(private http: BaseHttpClient) {}

    // @TODO: emit respective events to socket
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

    // @TODO: emit respective events to socket
    respondToInvitation(invitationId: string, response: 'accept' | 'decline') {
        type Response = HttpSuccessResponse<{
            friendship?: FriendshipFull;
            chatPreview?: ChatPreview;
        }>;

        return this.http.patch<Response>(`/friendships/invitations/${response}/${invitationId}`, {});
    }
}
