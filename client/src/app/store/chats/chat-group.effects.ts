import { Injectable } from '@angular/core';
import { HotToastService } from '@ngneat/hot-toast';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { mergeMap, map } from 'rxjs';
import { ChatGroupService } from 'src/app/services/chat-group.service';
import { throwIfErrorExists, catchAndHandleError, handleError } from '../app.effects';
import { chatActions } from './chats.actions';

@Injectable()
export class ChatGroupEffects {
    constructor(
        private actions$: Actions,
        private chatGroupService: ChatGroupService,
        private toastService: HotToastService,
    ) {}

    createChat = createEffect(() => {
        return this.actions$.pipe(
            ofType(chatActions.createChat),
            mergeMap(({ title }) => {
                return this.chatGroupService.createChat(title).pipe(
                    // error is needed for toastService to register it and show the respective toast
                    throwIfErrorExists(),
                    this.toastService.observe({
                        loading: `Creating chat '${title}'...`,
                        success: `Created chat '${title}'.`,
                        error: `Could not create chat.`,
                    }),
                    map(createdChat => chatActions.createChatSuccess({ createdChat })),
                    catchAndHandleError(),
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
            mergeMap(() => {
                return this.chatGroupService.getJoinedChats().pipe(
                    map(chatPreviewsOrError => {
                        return handleError(chatPreviewsOrError, chatPreviews =>
                            chatActions.loadChatPreviewsSuccess({ chatPreviews }),
                        );
                    }),
                );
            }),
        );
    });
}
