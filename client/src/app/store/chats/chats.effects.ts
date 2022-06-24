import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { ChatService } from 'src/app/services/chat.service';
import { handleError } from '../index.effects';
import { chatsActions } from './chats.actions';
import { ChatRoomDetails, ChatsState } from './chats.model';
import { AppState } from '../index.reducer';

@Injectable()
export class ChatsEffects {
    constructor(private actions$: Actions, private chatService: ChatService, private store: Store<AppState>) {}

    chatsSubscription = this.store
        .select(state => state.chats)
        .subscribe(chatsState => {
            this.chatsDetails = chatsState.chatsDetails;
            this.chatMessages = chatsState.messagesByChat;
        });
    chatsDetails: ChatRoomDetails[];
    chatMessages: ChatsState['messagesByChat'];

    loadActiveChat = createEffect(() => {
        return this.actions$.pipe(
            ofType(chatsActions.setActiveChat),
            mergeMap(({ chatId }) => {
                const alreadyLoadedMessages = this.chatMessages[chatId];
                if (alreadyLoadedMessages)
                    return of(
                        chatsActions.loadActiveChatMessagesSuccess({
                            alreadyStored: true,
                            chatId,
                            messages: alreadyLoadedMessages,
                        }),
                    );

                return this.chatService.getChatMessages(chatId).pipe(
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
                    map(createdChatOrError => {
                        return handleError(createdChatOrError, createdChat =>
                            chatsActions.createChatSuccess({ createdChat: createdChat }),
                        );
                    }),
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
                    map(joinedChatsOrError => {
                        return handleError(joinedChatsOrError, joinedChats =>
                            chatsActions.loadChatPreviewsSuccess({ chatPreviews: joinedChats }),
                        );
                    }),
                );
            }),
        );
    });
}
