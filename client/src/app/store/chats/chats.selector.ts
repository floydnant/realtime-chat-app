import { createSelector } from '@ngrx/store';
import { AppState } from '../app.reducer';
import { ChatPreview } from './chats.model';

export const chatsSelectors = {
    selectActiveChat: createSelector(
        (state: AppState) => state.chats.activeChatId,
        (state: AppState) => state.chats.chatPreviews,
        (activeChatId, chatPreviews) => {
            if (!activeChatId) return null;
            
            const activeChat = chatPreviews.find(chat => chat.friendshipOrChatGroupId == activeChatId)!;
            return activeChat;
        },
    ),

    selectChatPreviews: createSelector(
        (state: AppState) => state.chats.chatPreviews,
        (state: AppState) => state.chats.messagesByChat,
        (chatPreviews, messagesByChat) => {
            return chatPreviews.map(chat => {
                const messages = messagesByChat[chat.friendshipOrChatGroupId];
                const lastStoredMessage = messages?.[messages?.length - 1];

                return {
                    ...chat,
                    lastMessage: lastStoredMessage || chat.lastMessage,
                } as ChatPreview
            }).sort((chatA, chatB) => {
                const a = chatA.lastMessage ? new Date(chatA.lastMessage.timestamp).valueOf() : 0;
                const b = chatB.lastMessage ? new Date(chatB.lastMessage.timestamp).valueOf() : 0;
    
                return b - a;
            });
        },
    ),
};
