import { UserPreview } from 'src/shared/index.model';
import { MessageTypes } from 'src/shared/message-types.model';

export class ChatsState {
    activeChatId: string | null = null;

    chatPreviews: ChatRoomPreview[] = [];
    chatsDetails: ChatRoomDetails[] = [];
    messagesByChat: { [chatId: string]: StoredChatMessage[] } = {};
    loadingActiveChatMessages = false;
}

export interface StoredChatMessage {
    id: string;
    text: string;
    timestamp: string;
    messageType: MessageTypes.CHAT_MESSAGE;
    user: UserPreview;
}

export interface ChatRoomPreview {
    id: string;
    title: string;
}
export class ChatRoomDetails {
    id: string;
    createdAt: string;
    createdBy: UserPreview;
    title: string;
    users: UserPreview[];
}
export class ChatRoomApiResponse extends ChatRoomDetails {
    messages: StoredChatMessage[];
}
