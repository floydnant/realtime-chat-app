import { Component, OnDestroy, OnInit } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

enum SocketEvents {
    CHAT_MESSAGE = 'chat message',
    USER = 'user',
    CHOOSE_USERNAME = 'choose username',
}

interface Message {
    type: SocketEvents.CHAT_MESSAGE | SocketEvents.USER;
    text: string;
    username?: string;
    isMe?: boolean;
}

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
    constructor(private socket: Socket) {}

    async ngOnInit() {
        this.chooseUsername();
        this.chatMessagesSubscription = this.subscribeToChatMessages();
        this.userMessagesSubscription = this.subscribeToUserMessages();
    }
    ngOnDestroy() {
        this.chatMessagesSubscription.unsubscribe();
        this.userMessagesSubscription.unsubscribe();
    }

    newMessage: string;
    messages: Message[] = [
        {
            text: 'Welcome to Floyds Messenger!',
            type: SocketEvents.CHAT_MESSAGE,
            username: 'Floyd',
        },
    ];
    username: string;

    sendMessage() {
        if (!this.username)
            if (confirm('You need a username in order to chat.'))
                this.chooseUsername();

        if (!this.newMessage) return;
        console.log("sending '" + this.newMessage + "'...");

        this.socket.emit(SocketEvents.CHAT_MESSAGE, this.newMessage);
        this.addMessageToChat({
            text: this.newMessage,
            username: 'me',
            isMe: true,
            type: SocketEvents.CHAT_MESSAGE,
        });

        this.newMessage = '';
    }
    addMessageToChat(message: Message) {
        this.messages.push(message);
    }
    chatMessagesSubscription: Subscription;
    subscribeToChatMessages() {
        return (
            this.socket
                .fromEvent<Message>(SocketEvents.CHAT_MESSAGE)
                // .pipe(map((data) => data))
                .subscribe(({ text, username }) => {
                    console.log(text);
                    return this.addMessageToChat({
                        text,
                        username,
                        type: SocketEvents.CHAT_MESSAGE,
                    });
                })
        );
    }
    userMessagesSubscription: Subscription;
    subscribeToUserMessages() {
        return (
            this.socket
                .fromEvent<string>(SocketEvents.USER)
                // .pipe(map((data) => data))
                .subscribe((text) =>
                    this.addMessageToChat({
                        text,
                        type: SocketEvents.USER,
                    })
                )
        );
    }

    async chooseUsername(promptMsg = 'Chose a username') {
        const username = localStorage.username || prompt(promptMsg);
        if (username) {
            const res = await this.requestResponse(
                SocketEvents.CHOOSE_USERNAME,
                username
            );
            console.log(res);
            if (res == 'success') {
                this.username = username;
                localStorage.username = username;
            } else this.chooseUsername('Username already taken. Try Again.');
        } else alert('You cannot chat without a username.');
    }

    private requestResponse<T = string>(eventName: string, payload: any) {
        return new Promise<T>((res) => {
            this.socket.emit(eventName, payload);
            this.socket.once(eventName, (answer: T) => res(answer));
        });
    }
}
