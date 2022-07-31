import { createSelector } from '@ngrx/store';
import { AppState } from '../app.reducer';

export const chatsSelectors = {
    selectActiveChat: createSelector(
        (state: AppState) => state.chats.activeChatId,
        (state: AppState) => state.chats.chatPreviews,
        (activeChatId, chatPreviews) => {
            if (!activeChatId) return null;

            return chatPreviews.find(chat => chat.friendshipOrChatGroupId == activeChatId);
        },
    ),

    selectChatPreviews: createSelector(
        (state: AppState) => state.chats,
        chatsState => chatsState.chatPreviews,
    ),
};
