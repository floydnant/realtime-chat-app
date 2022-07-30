export enum MessageTypes {
    CHAT_MESSAGE = 'text',
    USER_EVENT = 'event',
}

export interface UserPreview {
    id: string;
    username: string;
}

export interface ChatRoomPreview {
    id: string;
    title: string;
}
