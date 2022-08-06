import { ChatPreview_, MessagePreview_ } from 'src/shared/index.model';

export type MessagePreview = MessagePreview_<'server'>;
export type ChatPreview = ChatPreview_<'server'>;
export type StoredMessage = MessagePreview_<'server'>;
