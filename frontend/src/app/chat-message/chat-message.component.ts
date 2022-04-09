import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'chat-message',
    templateUrl: './chat-message.component.html',
    styleUrls: ['./chat-message.component.scss'],
})
export class ChatMessageComponent /* implements OnInit */ {
    // constructor() {}
    // ngOnInit(): void {}

    @Input() variant: 'chat message' | 'user' | 'typing';
    @Input() message: string;
    @Input() username?: string;
    @Input() isMe = false;
}
