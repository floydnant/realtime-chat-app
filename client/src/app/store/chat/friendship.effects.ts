import { Injectable } from '@angular/core';
import { HotToastService } from '@ngneat/hot-toast';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, mergeMap } from 'rxjs';
import { FriendshipService } from 'src/app/services/friendship.service';
import { SocketService } from 'src/app/services/socket.service';
import { SocketEvents } from 'src/shared/socket-events.model';
import { appActions } from '../app.actions';
import { catchAndHandleError, handleError, throwIfErrorExists } from '../app.effects';
import { chatActions } from './chat.actions';

@Injectable()
export class FriendshipEffects {
    constructor(
        private actions$: Actions,
        private friendshipService: FriendshipService,
        private toastService: HotToastService,
        private socket: SocketService,
    ) {}

    loadNewInvitation = createEffect(() => {
        return this.socket.fromEvent(SocketEvents.SERVER__NEW_FRIEND_INVITE).pipe(
            mergeMap(({ invitationId }) =>
                this.friendshipService.getInvitation(invitationId).pipe(
                    map(invitationOrError => {
                        return handleError(invitationOrError, invitation => {
                            this.toastService.info(`${invitation.inviter.username} invited you to a friendship.`);
                            return chatActions.newInvitationReceived({ invitation });
                        });
                    }),
                ),
            ),
        );
    });

    loadNewChatPreview = createEffect(() => {
        return this.socket.fromEvent(SocketEvents.SERVER__ACCEPT_FRIEND_INVITE).pipe(
            mergeMap(({ friendshipId }) =>
                this.friendshipService.getFriendshipChatPreview(friendshipId).pipe(
                    map(chatPreviewOrError => {
                        return handleError(chatPreviewOrError, chatPreview => {
                            this.toastService.info(`${chatPreview.title} accepted your invitation`);
                            return chatActions.friendAcceptedInvitation({ chatPreview });
                        });
                    }),
                ),
            ),
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
            mergeMap(({ statusFilter }) => {
                return this.friendshipService.getInvitationsReceived(statusFilter).pipe(
                    map(invitationsOrError => {
                        return handleError(invitationsOrError, invitations =>
                            chatActions.loadReceivedInvitationsSuccess({
                                invitations,
                                statusFilter,
                            }),
                        );
                    }),
                );
            }),
        );
    });

    respondtoInvitation = createEffect(() => {
        return this.actions$.pipe(
            ofType(chatActions.respondToInvitation),
            mergeMap(({ invitationId, response }) => {
                return this.friendshipService.respondToInvitation(invitationId, response).pipe(
                    map(resOrError => {
                        return handleError(resOrError, res => {
                            this.toastService.success(res.successMessage);
                            return chatActions.respondToInvitationSuccess({
                                chatPreview: res.chatPreview,
                                invitationId,
                                invitationResponse: response,
                            });
                        });
                    }),
                );
            }),
        );
    });

    loadInvitationsSent = createEffect(() => {
        return this.actions$.pipe(
            ofType(chatActions.loadSentInvitations),
            mergeMap(() => {
                return this.friendshipService.getInvitationsSent().pipe(
                    map(invitationsOrError => {
                        return handleError(invitationsOrError, invitations =>
                            chatActions.loadSentInvitationsSuccess({ invitations }),
                        );
                    }),
                );
            }),
        );
    });

    sendInvitation = createEffect(() => {
        return this.actions$.pipe(
            ofType(chatActions.sendInvitation),
            mergeMap(({ userId }) => {
                return this.friendshipService.sendInvitation(userId).pipe(
                    throwIfErrorExists(),
                    this.toastService.observe({
                        loading: `Creating invitation...`,
                        success: res => res.successMessage,
                        error: res => res.error.message,
                    }),
                    map(res => chatActions.sendInvitationSuccess(res)),
                    catchAndHandleError(),
                );
            }),
        );
    });

    deleteInvitation = createEffect(() => {
        return this.actions$.pipe(
            ofType(chatActions.deleteInvitation),
            mergeMap(({ invitationId }) => {
                return this.friendshipService.deleteInvitation(invitationId).pipe(
                    throwIfErrorExists(),
                    this.toastService.observe({
                        loading: `Deleting invitation...`,
                        success: res => res.successMessage,
                        error: res => res.error.message,
                    }),
                    map(() => chatActions.deleteInvitationSuccess({ invitationId })),
                    catchAndHandleError(),
                );
            }),
        );
    });
}
