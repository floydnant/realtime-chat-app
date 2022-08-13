import { Component, Input } from '@angular/core';
import { UserOnlineStatusEventMessage } from 'src/app/pages/chat/chat.component';
import { StoredMessage } from 'src/app/store/chat/chat.model';
import { MessageTypes } from 'src/shared/index.model';

@Component({
    selector: 'chat-message',
    templateUrl: './chat-message.component.html',
    styleUrls: ['./chat-message.component.scss'],
})
export class ChatMessageComponent {
    @Input() variant: MessageTypes.CHAT_MESSAGE | MessageTypes.USER_EVENT = MessageTypes.CHAT_MESSAGE;
    @Input() message?: StoredMessage | UserOnlineStatusEventMessage;
    @Input() isMe = false;
    @Input() sameUserAsPrevMsg = false;
    @Input() hideUsername? = false;

    @Input() messageText?: string;
    @Input() isLoading? = false;

    MessageTypes = MessageTypes;
}
