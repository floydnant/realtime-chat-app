import { Component, Input } from '@angular/core';
import { SocketEvents } from '../../shared/socket-events.model';

@Component({
    selector: 'chat-message',
    templateUrl: './chat-message.component.html',
    styleUrls: ['./chat-message.component.scss'],
})
export class ChatMessageComponent {
    @Input() variant: SocketEvents.CHAT_MESSAGE | SocketEvents.USER_EVENT | SocketEvents.TYPING_EVENT;
    @Input() message: string;
    @Input() username?: string;
    @Input() isMe = false;

    SocketEvents = SocketEvents;
}
