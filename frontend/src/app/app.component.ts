import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { debounce } from './utils';

enum SocketEvents {
    CHAT_MESSAGE = 'chat message',
    USER = 'user',
    CHOOSE_USERNAME = 'choose username',
    CHANGE_USERNAME = 'change username',
    TYPING = 'typing',
    USERS_ONLINE = 'users online',
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

    @ViewChild('chatRef') chatRef: ElementRef<HTMLDivElement>;

    async ngOnInit() {
        this.socket.on(SocketEvents.CHOOSE_USERNAME, (payload: string) => {
            if (payload == SocketEvents.CHOOSE_USERNAME) this.chooseUsername();
        });
        this.chatMessagesSubscription = this.subscribeToChatMessages();
        this.userMessagesSubscription = this.subscribeToUserMessages();
        this.usersTypingSubscription = this.subscribeToUsersTyping();
    }
    ngOnDestroy() {
        this.chatMessagesSubscription.unsubscribe();
        this.userMessagesSubscription.unsubscribe();
        this.usersTypingSubscription.unsubscribe();
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

    async sendMessage() {
        if (!this.newMessage) return;

        if (!this.username) if (!(await this.chooseUsername())) return;

        this.emitStopTyping();
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
        // const allChatElems = this.chatRef.nativeElement.childNodes;
        // const lastChatElem = allChatElems[allChatElems.length - 2];
        // console.log(lastChatElem);
        // window.scrollTo(0, document.body.scrollHeight);
        this.scrollToBottom();
    }

    private isTyping = false;
    private emitStopTypingDebounced = debounce(() => this.emitStopTyping(), 1500);
    private scrollToBottom() {
        setTimeout(() => (this.chatRef.nativeElement.scrollTop = this.chatRef.nativeElement.scrollHeight), 0);
    }

    private emitStopTyping() {
        this.socket.emit(SocketEvents.TYPING, false);
        this.isTyping = false;
    }

    inputFired() {
        if (!this.username) return;
        if (!this.isTyping) {
            this.socket.emit(SocketEvents.TYPING, true);
            this.isTyping = true;
        }
        this.emitStopTypingDebounced();
    }

    usersTypingText: string;
    usersTyping: string[] = [];
    usersTypingSubscription: Subscription;
    subscribeToUsersTyping() {
        return (
            this.socket
                .fromEvent<{ username: string; isTyping: boolean }>(SocketEvents.TYPING)
                // .pipe(map((data) => data))
                .subscribe(({ username, isTyping }) => {
                    if (isTyping) this.usersTyping.push(username);
                    else this.usersTyping = this.usersTyping.filter(u => u != username);

                    this.usersTypingText = `${this.usersTyping.join(', ')} ${
                        this.usersTyping.length > 1 ? 'are' : 'is'
                    } typing`;
                    this.scrollToBottom();
                })
        );
    }

    usersOnline$ = this.socket.fromEvent<string[]>(SocketEvents.USERS_ONLINE).pipe(
        map((users: string[]) => {
            console.log(users);
            users = users.filter(u => u != this.username);
            return !users.length ? '' : 'online: ' + users.join(', ');
        }),
    );

    chatMessagesSubscription: Subscription;
    subscribeToChatMessages() {
        return (
            this.socket
                .fromEvent<Message>(SocketEvents.CHAT_MESSAGE)
                // .pipe(map((data) => data))
                .subscribe(({ text, username }) =>
                    this.addMessageToChat({
                        text,
                        username,
                        type: SocketEvents.CHAT_MESSAGE,
                    }),
                )
        );
    }
    userMessagesSubscription: Subscription;
    subscribeToUserMessages() {
        return (
            this.socket
                .fromEvent<string>(SocketEvents.USER)
                // .pipe(map((data) => data))
                .subscribe(text =>
                    this.addMessageToChat({
                        text,
                        type: SocketEvents.USER,
                    }),
                )
        );
    }

    async chooseUsername(promptMsg = 'Choose a username', promptUser = false): Promise<boolean> {
        const username = (
            promptUser ? prompt(promptMsg, this.username || '') : localStorage.username || prompt(promptMsg)
        )?.trim();

        if (!username)
            if (confirm('You need to choose a username in order to chat.')) return await this.chooseUsername();
            else {
                this.username = '';
                localStorage.username = '';
                return false;
            }

        const res = await this.requestResponse(SocketEvents.CHOOSE_USERNAME, username);
        console.log(res);

        if (res == 'already taken') return await this.chooseUsername('Username already taken. Try Again.', true);

        this.username = username;
        localStorage.username = username;
        return true;
    }
    changeUsername() {
        this.chooseUsername('Change username', true);
    }

    private requestResponse<T = string>(eventName: string, payload: any) {
        return new Promise<T>(res => {
            this.socket.emit(eventName, payload);
            this.socket.once(eventName, (answer: T) => res(answer));
        });
    }
}
