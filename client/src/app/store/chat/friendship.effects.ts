import { Injectable } from '@angular/core';
import { HotToastService } from '@ngneat/hot-toast';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, mergeMap } from 'rxjs';
import { FriendshipService } from 'src/app/services/friendship.service';
import { SocketService } from 'src/app/services/socket.service';
import { SocketEvents } from 'src/shared/socket-events.model';
import { appActions } from '../app.actions';
import { catchAndHandleError, handleResponse, throwIfErrorExists } from '../app.effects';
import { chatActions } from './chat.actions';

@Injectable()
export class FriendshipEffects {
    constructor(
        private actions$: Actions,
        private friendshipService: FriendshipService,
        private toastService: HotToastService,
        private socket: SocketService,
    ) {}

    forwardLoadInvitation = createEffect(() => {
        return this.socket
            .fromEvent(SocketEvents.SERVER__NEW_FRIEND_INVITE)
            .pipe(map(({ invitationId }) => chatActions.loadReceivedInvitation({ invitationId })));
    });
    loadNewInvitation = createEffect(() => {
        return this.actions$.pipe(
            ofType(chatActions.loadReceivedInvitation),
            mergeMap(({ invitationId, ...action }) =>
                this.friendshipService.getInvitation(invitationId).pipe(
                    handleResponse({
                        onSuccess: invitation => {
                            this.toastService.info(`${invitation.inviter.username} invited you to a friendship.`);
                            return chatActions.newInvitationReceived({ invitation });
                        },
                        actionToRetry: { invitationId, ...action },
                    }),
                ),
            ),
        );
    });

    forwardLoadNewChatPreview = createEffect(() => {
        return this.socket.fromEvent(SocketEvents.SERVER__ACCEPT_FRIEND_INVITE).pipe(
            map(({ friendshipId, friendName }) => {
                this.toastService.info(`${friendName} accepted your invitation`);
                return chatActions.loadChatPreview({ chatId: friendshipId });
            }),
        );
    });

    removeDeletedInvitation = createEffect(() => {
        return this.socket
            .fromEvent(SocketEvents.SERVER__DELETE_FRIEND_INVITE)
            .pipe(map(({ invitationId }) => chatActions.deleteInvitationSuccess({ invitationId })));
    });

    loadInvitationsReceived = createEffect(() => {
        return this.actions$.pipe(
            ofType(chatActions.loadReceivedInvitations),
            mergeMap(({ statusFilter, ...action }) => {
                return this.friendshipService.getInvitationsReceived(statusFilter).pipe(
                    handleResponse({
                        onSuccess: invitations =>
                            chatActions.loadReceivedInvitationsSuccess({
                                invitations,
                                statusFilter,
                            }),
                        actionToRetry: { statusFilter, ...action },
                    }),
                );
            }),
        );
    });

    respondtoInvitation = createEffect(() => {
        return this.actions$.pipe(
            ofType(chatActions.respondToInvitation),
            mergeMap(action => {
                const { invitationId, response } = action;
                return this.friendshipService.respondToInvitation(invitationId, response).pipe(
                    handleResponse({
                        onSuccess: res => {
                            this.toastService.success(res.successMessage);
                            return chatActions.respondToInvitationSuccess({
                                chatPreview: res.chatPreview,
                                invitationId,
                                invitationResponse: response,
                            });
                        },
                        actionToRetry: action,
                    }),
                );
            }),
        );
    });

    loadInvitationsSent = createEffect(() => {
        return this.actions$.pipe(
            ofType(chatActions.loadSentInvitations),
            mergeMap(action => {
                return this.friendshipService.getInvitationsSent().pipe(
                    handleResponse({
                        onSuccess: invitations => chatActions.loadSentInvitationsSuccess({ invitations }),
                        actionToRetry: action,
                    }),
                );
            }),
        );
    });

    sendInvitation = createEffect(() => {
        return this.actions$.pipe(
            ofType(chatActions.sendInvitation),
            mergeMap(({ userId, ...action }) => {
                return this.friendshipService.sendInvitation(userId).pipe(
                    throwIfErrorExists(),
                    this.toastService.observe({
                        loading: `Creating invitation...`,
                        success: res => res.successMessage,
                        error: res => res.error.message,
                    }),
                    map(res => chatActions.sendInvitationSuccess(res)),
                    catchAndHandleError({ userId, ...action }),
                );
            }),
        );
    });

    deleteInvitation = createEffect(() => {
        return this.actions$.pipe(
            ofType(chatActions.deleteInvitation),
            mergeMap(({ invitationId, ...action }) => {
                return this.friendshipService.deleteInvitation(invitationId).pipe(
                    throwIfErrorExists(),
                    this.toastService.observe({
                        loading: `Deleting invitation...`,
                        success: res => res.successMessage,
                        error: res => res.error.message,
                    }),
                    map(() => chatActions.deleteInvitationSuccess({ invitationId })),
                    catchAndHandleError({ invitationId, ...action }),
                );
            }),
        );
    });
}
