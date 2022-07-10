export enum SocketEvents {
    CLIENT__AUTHENTICATE = 'client authenticate',
    SERVER__AUTHENTICATE = 'server authenticate',
    SERVER__AUTHENTICATE_PROMPT = 'server authenticate prompt',
    CLIENT__LOGOUT = 'client logout',

    CLIENT__TYPING_EVENT = 'client typing event',
    SERVER__TYPING_EVENT = 'server typing event',

    CLIENT__CHAT_MESSAGE = 'client chat message',
    SERVER__CHAT_MESSAGE = 'server chat message',

    SERVER__USER_ONLINE_STATUS_EVENT = 'user event',

    SERVER__USERS_ONLINE = 'users online',
}
