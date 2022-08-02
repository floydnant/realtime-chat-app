import { Injectable } from '@angular/core';
import { HotToastService } from '@ngneat/hot-toast';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { mergeMap, map } from 'rxjs';
import { ChatGroupService } from 'src/app/services/chat-group.service';
import { throwIfErrorExists, catchAndHandleError, handleError } from '../app.effects';
import { chatsActions } from './chats.actions';

@Injectable()
export class ChatGroupEffects {
    constructor(
        private actions$: Actions,
        private chatGroupService: ChatGroupService,
        private toastService: HotToastService,
    ) {}

    createChat = createEffect(() => {
        return this.actions$.pipe(
            ofType(chatsActions.createChat),
            mergeMap(({ title }) => {
                return this.chatGroupService.createChat(title).pipe(
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
                return this.chatGroupService.getJoinedChats().pipe(
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
