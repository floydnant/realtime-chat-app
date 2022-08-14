import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { ChatService } from 'src/app/services/chat.service';
import { appActions } from '../app.actions';
import { handleResponse } from '../app.effects';
import { AppState } from '../app.reducer';
import { chatActions } from './chat.actions';
import { ChatsState } from './chat.model';

@Injectable()
export class ChatsEffects {
    constructor(private actions$: Actions, private chatService: ChatService, private store: Store<AppState>) {}

    chatsSubscription = this.store
        .select(state => state.chats)
        .subscribe(chatsState => {
            this.activeChatId = chatsState.activeChatId;
            this.chatsState = chatsState;
            this.chatMessages = chatsState.messagesByChat;
        });
    activeChatId: string | null;
    chatsState: ChatsState;
    chatMessages: ChatsState['messagesByChat'];

    setActiveChat = createEffect(() => {
        return this.actions$.pipe(
            ofType(chatActions.setActiveChat),
            map(({ chatId }) => {
                if (chatId == this.activeChatId) return appActions.nothing();
                return chatActions.setActiveChatSuccess({ chatId });
            }),
        );
    });

    forwardSetActiveChat = createEffect(() => {
        return this.actions$.pipe(
            ofType(chatActions.setActiveChatSuccess),
            map(({ chatId }) => {
                const chatType = this.chatsState.chatPreviews.find(
                    chat => chat.friendshipOrChatGroupId == chatId,
                )!.chatType;
                return chatActions.loadActiveChatMessages({ chatId, chatType });
            }),
        );
    });

    loadActiveChat = createEffect(() => {
        return this.actions$.pipe(
            ofType(chatActions.loadActiveChatMessages),
            mergeMap(action => {
                const { chatId, chatType } = action;
                const alreadyLoadedMessages = this.chatMessages[chatId];
                if (alreadyLoadedMessages)
                    return of(
                        chatActions.loadActiveChatMessagesSuccess({
                            alreadyStored: true,
                            chatId,
                            messages: alreadyLoadedMessages,
                        }),
                    );

                return this.chatService.getChatMessages(chatId, chatType).pipe(
                    handleResponse({
                        onSuccess: messages => chatActions.loadActiveChatMessagesSuccess({ messages, chatId }),
                        actionToRetry: action,
                    }),
                );
            }),
        );
    });
}
