import { createSelector } from '@ngrx/store';
import { AppState } from '../app.reducer';
import { ChatPreview } from './chat.model';

export const chatsSelectors = {
    selectActiveChat: createSelector(
        (state: AppState) => state.chats.activeChatId,
        ({ chats }: AppState) => ({
            chatPreviews: chats.chatPreviews,
            chatGroups: chats.chatGroups,
            friendships: chats.friendships,
        }),
        (state: AppState) => state.chats.usersStatus,
        (activeChatId, { chatPreviews, chatGroups, friendships }, usersStatus) => {
            if (!activeChatId) return null;

            const activeChat = chatPreviews.find(chat => chat.friendshipOrChatGroupId == activeChatId)!;
            const activeChatGroup = chatGroups[activeChatId];
            const activeFriendship = friendships[activeChatId];

            // @TODO: make this a bit cleaner
            const data =
                activeChat.chatType == 'private'
                    ? { isOnline: usersStatus[activeFriendship?.friend.id] || false }
                    : {
                          members: !activeChatGroup
                              ? []
                              : activeChatGroup.members.map(m => {
                                    return { ...m, isOnline: usersStatus[m.id] || false };
                                }),
                      };

            return { ...activeChat, ...data };
        },
    ),

    selectChatPreviews: createSelector(
        (state: AppState) => state.chats.chatPreviews,
        (state: AppState) => state.chats.messagesByChat,
        (chatPreviews, messagesByChat) => {
            return chatPreviews
                .map(chat => {
                    const messages = messagesByChat[chat.friendshipOrChatGroupId];
                    const lastStoredMessage = messages?.[messages?.length - 1];

                    return {
                        ...chat,
                        lastMessage: lastStoredMessage || chat.lastMessage,
                    } as ChatPreview;
                })
                .sort((chatA, chatB) => {
                    const a = chatA.lastMessage ? new Date(chatA.lastMessage.timestamp).valueOf() : 0;
                    const b = chatB.lastMessage ? new Date(chatB.lastMessage.timestamp).valueOf() : 0;

                    return b - a;
                });
        },
    ),
};
