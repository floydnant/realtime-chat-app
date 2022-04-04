import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'chat-message',
    templateUrl: './chat-message.component.html',
    styleUrls: ['./chat-message.component.scss'],
})
export class ChatMessageComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}

    @Input() variant: 'chat message' | 'user';
    @Input() message: string = 'test message here';
    @Input() username?: string;
    @Input() isMe: boolean;
}
