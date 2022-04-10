import { Component, ElementRef, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Subscription } from 'rxjs';
import { debounce, escapeHTML, moveToMacroQueue } from './utils';
import { SocketEvents } from '../../../shared/socket-events.model';

interface Message {
    type: SocketEvents.CHAT_MESSAGE | SocketEvents.USER_EVENT;
    text: string;
    username?: string;
    isMe?: boolean;
}

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnDestroy, OnChanges {
    constructor(private socket: Socket) {
        this.socket.on(SocketEvents.CHOOSE_USERNAME, (payload: string) => {
            if (payload == SocketEvents.CHOOSE_USERNAME) {
                this.chooseUsername();
            }
        });
    }

    ngOnDestroy() {
        this.chatMessagesSubscription.unsubscribe();
        this.userMessagesSubscription.unsubscribe();
        this.usersTypingSubscription.unsubscribe();
    }
    ngOnChanges(changes: SimpleChanges): void {
        console.log('changes:', changes);
        if ('username' in changes) console.log('this.username:', this.username);
    }

    @ViewChild('chatRef') chatRef: ElementRef<HTMLDivElement>;

    username: string;
    newMessage: string;
    messages: Message[] = [
        {
            text: 'Welcome to Floyds Messenger!',
            type: SocketEvents.USER_EVENT,
        },
    ];

    isTyping = false;
    emitStopTypingDebounced = debounce(() => this.emitTyping(false), 1500);
    inputHandler() {
        if (!this.username) return;
        if (!this.isTyping) this.emitTyping(true);
        this.emitStopTypingDebounced();
    }
    emitTyping(isTyping: boolean) {
        this.socket.emit(SocketEvents.TYPING_EVENT, isTyping);
        this.isTyping = isTyping;
    }

    usersTypingText: string;
    usersTyping: string[] = [];
    usersTypingSubscription: Subscription = this.socket
        .fromEvent<{ username: string; isTyping: boolean }>(SocketEvents.TYPING_EVENT)
        // .pipe(map((data) => data))
        .subscribe(({ username, isTyping }) => {
            if (isTyping) this.usersTyping.push(username);
            else this.usersTyping = this.usersTyping.filter(u => u != username);

            this.usersTypingText = `${this.usersTyping
                .map(u => `<span class="secondary-100">${escapeHTML(u)}</span>`)
                .join(', ')} ${this.usersTyping.length > 1 ? 'are' : 'is'} typing`;
            this.scrollToBottom();
        });

    usersOnline$ = this.socket.fromEvent<string[]>(SocketEvents.USERS_ONLINE);
    getOnlineUsersText(users: string[] | null) {
        return (users || [])
            .filter(u => u != this.username)
            .map(u => `<span class="secondary-100">${escapeHTML(u)}</span>`)
            .join(', ');
    }

    chatMessagesSubscription: Subscription = this.socket
        .fromEvent<Message>(SocketEvents.CHAT_MESSAGE)
        // .pipe(map((data) => data))
        .subscribe(({ text, username }) =>
            this.addMessageToChat({
                text,
                username,
                type: SocketEvents.CHAT_MESSAGE,
            }),
        );
    async sendMessage() {
        if (!this.newMessage) return;

        if (!this.username) if (!(await this.chooseUsername())) return;

        this.emitTyping(false);
        this.socket.emit(SocketEvents.CHAT_MESSAGE, this.newMessage);
        this.addMessageToChat({
            text: this.newMessage,
            username: 'me',
            isMe: true,
            type: SocketEvents.CHAT_MESSAGE,
        });

        this.newMessage = '';
    }
    addMessageToChat({ text, ...message }: Message) {
        text = escapeHTML(text);

        if (message.type == SocketEvents.USER_EVENT) {
            const matchBeforeQuotes = text.match(/[\w\d\s]+(?=&apos;|')/g);
            const secondUsername = (matchBeforeQuotes || ['', ''])[1];

            text = text
                .replace(/.+(?=\s+went|changed)/, m => `<span class="secondary-100">${m}</span>`)
                .replace(/online/, `<span class="primary-100">online</span>`);
            if (secondUsername)
                text = text.replace(new RegExp(secondUsername, 'g'), m => `<span class="secondary-100">${m}</span>`);
        } else
            text = text.replace(
                /https?:\/\/([^\s"/,;:]+\.)+[^\s",;:]+/g,
                match => `<a href="${match}" target="_blank">${match}</a>`,
            );

        this.messages.push({ ...message, text });
        this.scrollToBottom();
    }
    scrollToBottom() {
        moveToMacroQueue(() => (this.chatRef.nativeElement.scrollTop = this.chatRef.nativeElement.scrollHeight));
    }

    userMessagesSubscription: Subscription = this.socket
        .fromEvent<string>(SocketEvents.USER_EVENT)
        // .pipe(map((data) => data))
        .subscribe(text =>
            this.addMessageToChat({
                text,
                type: SocketEvents.USER_EVENT,
            }),
        );

    async chooseUsername(
        promptMsg = 'Choose a username',
        promptUser = false,
        changeUsername = false,
    ): Promise<boolean> {
        const username = (
            promptUser ? prompt(promptMsg, this.username || '') : localStorage.username || prompt(promptMsg)
        )?.trim();

        if (!username)
            if (changeUsername) return false;
            else if (confirm('You need to choose a username in order to chat.')) return await this.chooseUsername();
            else {
                this.username = '';
                localStorage.username = '';
                return false;
            }

        const res = await this.requestResponse(SocketEvents.CHOOSE_USERNAME, username);
        if (res == 'already taken') return await this.chooseUsername('Username already taken. Try Again.', true);

        this.username = username;
        localStorage.username = username;
        return true;
    }
    changeUsername() {
        this.chooseUsername('Change username', true, true);
    }

    private requestResponse<T = string>(eventName: string, payload: any) {
        return new Promise<T>(res => {
            this.socket.emit(eventName, payload);
            this.socket.once(eventName, (answer: T) => res(answer));
        });
    }
    SocketEvents = SocketEvents;
}
