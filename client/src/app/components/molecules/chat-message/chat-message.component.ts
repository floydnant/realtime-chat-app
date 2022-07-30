import { Component, Input } from '@angular/core';
import { UserOnlineStatusEventMessage } from 'src/app/pages/chat/chat.component';
import { StoredChatMessage } from 'src/app/store/chats/chats.model';
import { MessageTypes } from 'src/shared/index.model';

@Component({
    selector: 'chat-message',
    templateUrl: './chat-message.component.html',
    styleUrls: ['./chat-message.component.scss'],
})
export class ChatMessageComponent {
    @Input() variant: MessageTypes.CHAT_MESSAGE | MessageTypes.USER_EVENT;
    @Input() message?: StoredChatMessage | UserOnlineStatusEventMessage;
    @Input() isMe = false;
    @Input() sameUserAsPrevMsg = false;

    @Input() messageText?: string;

    MessageTypes = MessageTypes;
}
