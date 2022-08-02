import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { ChatService } from 'src/app/services/chat.service';
import { appActions } from '../app.actions';
import { handleError } from '../app.effects';
import { AppState } from '../app.reducer';
import { chatsActions } from './chats.actions';
import { ChatsState } from './chats.model';

@Injectable()
export class ChatsEffects {
    constructor(private actions$: Actions, private chatService: ChatService, private store: Store<AppState>) {}

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
}
