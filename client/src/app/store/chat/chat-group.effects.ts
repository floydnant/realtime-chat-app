import { Injectable } from '@angular/core';
import { HotToastService } from '@ngneat/hot-toast';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { mergeMap, map } from 'rxjs';
import { ChatGroupService } from 'src/app/services/chat-group.service';
import { FriendshipService } from 'src/app/services/friendship.service';
import { SocketService } from 'src/app/services/socket.service';
import { SocketEvents } from 'src/shared/socket-events.model';
import { throwIfErrorExists, catchAndHandleError, handleResponse } from '../app.effects';
import { chatActions } from './chat.actions';

@Injectable()
export class ChatGroupEffects {
    constructor(
        private actions$: Actions,
        private chatGroupService: ChatGroupService,
        private friendshipService: FriendshipService,
        private toastService: HotToastService,
        private socket: SocketService,
    ) {}

    createChat = createEffect(() => {
        return this.actions$.pipe(
            ofType(chatActions.createChat),
            mergeMap(({ title, ...action }) => {
                return this.chatGroupService.createChat(title).pipe(
                    // error is needed for toastService to register it and show the respective toast
                    throwIfErrorExists(),
                    this.toastService.observe({
                        loading: `Creating chat '${title}'...`,
                        success: `Created chat '${title}'.`,
                        error: `Could not create chat.`,
                    }),
                    map(createdChat => chatActions.createChatSuccess({ createdChat })),
                    catchAndHandleError({ title, ...action }),
                );
            }),
        );
    });

    setCreatedChatActive = createEffect(() => {
        return this.actions$.pipe(
            ofType(chatActions.createChatSuccess),
            map(({ createdChat }) => chatActions.setActiveChat({ chatId: createdChat.id })),
        );
    });

    loadJoinedChatPreviews = createEffect(() => {
        return this.actions$.pipe(
            ofType(chatActions.loadChatPreviews),
            mergeMap(action => {
                return this.chatGroupService.getJoinedChats().pipe(
                    handleResponse({
                        onSuccess: chatPreviews => chatActions.loadChatPreviewsSuccess({ chatPreviews }),
                        actionToRetry: action,
                    }),
                );
            }),
        );
    });

    loadNewChatPreview = createEffect(() => {
        return this.actions$.pipe(
            ofType(chatActions.loadChatPreview),
            mergeMap(({ chatId, ...action }) =>
                // @TODO: this should call the chat.service instead
                this.friendshipService.getFriendshipChatPreview(chatId).pipe(
                    handleResponse({
                        onSuccess: chatPreview => chatActions.loadChatPreviewSuccess({ chatPreview }),
                        actionToRetry: { chatId, ...action },
                    }),
                ),
            ),
        );
    });

    addJoinedMemberToGroup = createEffect(() =>
        this.socket
            .fromEvent(SocketEvents.SERVER__USER_JOINED_CHAT)
            .pipe(map(({ chatId, user }) => chatActions.addMemberToGroup({ chatId, newMember: user }))),
    );
}
