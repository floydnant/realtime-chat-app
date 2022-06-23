export enum MessageTypes {
    CHAT_MESSAGE = 'chat message',
    USER_EVENT = 'user event',
}

export interface UserPreview {
    id: string;
    username: string;
}

export interface ChatRoomPreview {
    id: string;
    title: string;
}
