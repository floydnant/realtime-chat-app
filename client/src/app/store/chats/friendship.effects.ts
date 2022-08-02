import { Injectable } from '@angular/core';
import { HotToastService } from '@ngneat/hot-toast';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, mergeMap } from 'rxjs';
import { FriendshipService } from 'src/app/services/friendship.service';
import { catchAndHandleError, handleError, throwIfErrorExists } from '../app.effects';
import { chatsActions } from './chats.actions';

@Injectable()
export class FriendshipEffects {
    constructor(
        private actions$: Actions,
        private friendshipService: FriendshipService,
        private toastService: HotToastService,
    ) {}

    loadInvitationsReceived = createEffect(() => {
        return this.actions$.pipe(
            ofType(chatsActions.loadReceivedInvitations),
            mergeMap(({ statusFilter }) => {
                return this.friendshipService.getInvitationsReceived(statusFilter).pipe(
                    map(invitationsOrError => {
                        return handleError(invitationsOrError, invitations =>
                            chatsActions.loadReceivedInvitationsSuccess({
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
            ofType(chatsActions.respondToInvitation),
            mergeMap(({ invitationId, response }) => {
                return this.friendshipService.respondToInvitation(invitationId, response).pipe(
                    map(resOrError => {
                        return handleError(resOrError, res => {
                            this.toastService.success(res.successMessage);
                            return chatsActions.respondToInvitationSuccess({
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
            ofType(chatsActions.loadSentInvitations),
            mergeMap(() => {
                return this.friendshipService.getInvitationsSent().pipe(
                    map(invitationsOrError => {
                        return handleError(invitationsOrError, invitations =>
                            chatsActions.loadSentInvitationsSuccess({ invitations }),
                        );
                    }),
                );
            }),
        );
    });

    sendInvitation = createEffect(() => {
        return this.actions$.pipe(
            ofType(chatsActions.sendInvitation),
            mergeMap(({ userId }) => {
                return this.friendshipService.sendInvitation(userId).pipe(
                    throwIfErrorExists(),
                    this.toastService.observe({
                        loading: `Creating invitation...`,
                        success: res => res.successMessage,
                        error: res => res.error.message,
                    }),
                    map(res => chatsActions.sendInvitationSuccess(res)),
                    catchAndHandleError(),
                );
            }),
        );
    });

    deleteInvitation = createEffect(() => {
        return this.actions$.pipe(
            ofType(chatsActions.deleteInvitation),
            mergeMap(({ invitationId }) => {
                return this.friendshipService.deleteInvitation(invitationId).pipe(
                    throwIfErrorExists(),
                    this.toastService.observe({
                        loading: `Deleting invitation...`,
                        success: res => res.successMessage,
                        error: res => res.error.message,
                    }),
                    map(() => chatsActions.deleteInvitationSuccess({ invitationId })),
                    catchAndHandleError(),
                );
            }),
        );
    });
}
