import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { ChatService } from 'src/app/services/chat.service';
import { catchAndHandleError, handleError, throwIfErrorExists } from '../app.effects';
import { chatsActions } from './chats.actions';
import { ChatRoomDetails, ChatsState, ChatType } from './chats.model';
import { AppState } from '../app.reducer';
import { HotToastService } from '@ngneat/hot-toast';
import { appActions } from '../app.actions';

@Injectable()
export class ChatsEffects {
    constructor(
        private actions$: Actions,
        private chatService: ChatService,
        private store: Store<AppState>,
        private toastService: HotToastService,
    ) {}

    chatsSubscription = this.store
        .select(state => state.chats)
        .subscribe(chatsState => {
            this.activeChatId = chatsState.activeChatId;
            this.chatsState = chatsState;
            // this.chatsDetails = chatsState.chatsDetails;
            this.chatMessages = chatsState.messagesByChat;
        });
    activeChatId: string | null;
    chatsState: ChatsState;
    // chatsDetails: ChatRoomDetails[];
    chatMessages: ChatsState['messagesByChat'];

    setActiveChat = createEffect(() => {
        return this.actions$.pipe(
            ofType(chatsActions.setActiveChat),
            map(({ chatId }) => {
                if (chatId == this.activeChatId) return appActions.nothing();
                return chatsActions.setActiveChatSuccess({ chatId });
            }),
        );
    });

    forwardSetActiveChat = createEffect(() => {
        return this.actions$.pipe(
            ofType(chatsActions.setActiveChatSuccess),
            map(({ chatId }) => {
                const chatType = this.chatsState.chatPreviews.find(
                    chat => chat.friendshipOrChatGroupId == this.activeChatId,
                )!.chatType;
                return chatsActions.loadActiveChatMessages({ chatId, chatType });
            }),
        );
    });

    loadActiveChat = createEffect(() => {
        return this.actions$.pipe(
            ofType(chatsActions.loadActiveChatMessages),
            mergeMap(({ chatId, chatType }) => {
                const alreadyLoadedMessages = this.chatMessages[chatId];
                if (alreadyLoadedMessages)
                    return of(
                        chatsActions.loadActiveChatMessagesSuccess({
                            alreadyStored: true,
                            chatId,
                            messages: alreadyLoadedMessages,
                        }),
                    );

                return this.chatService.getChatMessages(chatId, chatType).pipe(
                    map(chatMessagesOrError => {
                        return handleError(chatMessagesOrError, messages =>
                            chatsActions.loadActiveChatMessagesSuccess({ messages, chatId }),
                        );
                    }),
                );
            }),
        );
    });

    createChat = createEffect(() => {
        return this.actions$.pipe(
            ofType(chatsActions.createChat),
            mergeMap(({ title }) => {
                return this.chatService.createChat(title).pipe(
                    // error is needed for toastService to register it and show the respective toast
                    throwIfErrorExists(),
                    this.toastService.observe({
                        loading: `Creating chat '${title}'...`,
                        success: `Created chat '${title}'.`,
                        error: `Could not create chat.`,
                    }),
                    map(createdChat => chatsActions.createChatSuccess({ createdChat })),
                    catchAndHandleError(),
                );
            }),
        );
    });
    setCreatedChatActive = createEffect(() => {
        return this.actions$.pipe(
            ofType(chatsActions.createChatSuccess),
            map(({ createdChat }) => chatsActions.setActiveChat({ chatId: createdChat.id })),
        );
    });

    loadJoinedChatPreviews = createEffect(() => {
        return this.actions$.pipe(
            ofType(chatsActions.loadChatPreviews),
            mergeMap(() => {
                return this.chatService.getJoinedChats().pipe(
                    map(chatPreviewsOrError => {
                        return handleError(chatPreviewsOrError, chatPreviews =>
                            chatsActions.loadChatPreviewsSuccess({ chatPreviews }),
                        );
                    }),
                );
            }),
        );
    });
}
