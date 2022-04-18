import {
    AfterViewInit,
    Component,
    ElementRef,
    HostListener,
    OnChanges,
    OnDestroy,
    OnInit,
    SimpleChanges,
    ViewChild,
} from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Subscription } from 'rxjs';
import { moveToMacroQueue, debounce, escapeHTML } from 'src/app/utils';
import { SocketEvents } from 'src/shared/socket-events.model';

interface Message {
    type: SocketEvents.CHAT_MESSAGE | SocketEvents.USER_EVENT;
    text: string;
    username?: string;
    isMe?: boolean;
}

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnDestroy, OnChanges, AfterViewInit {
    constructor(private socket: Socket) {
        this.socket.on(SocketEvents.CHOOSE_USERNAME, (payload: string) => {
            if (payload == SocketEvents.CHOOSE_USERNAME) this.chooseUsername();
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
    @ViewChild('messageInput') messageInput: ElementRef<HTMLDivElement>;
    ngAfterViewInit() {
        this.messageInput.nativeElement.addEventListener('DOMCharacterDataModified', () =>
            this.pullMessageInputChanges('DOMCharacterDataModified'),
        );
        // this.messageInput.nativeElement.addEventListener('DOMNodeRemoved', () =>
        //     this.pullMessageInputChanges('DOMNodeRemoved'),
        // );

        const observer = new MutationObserver(() => {
            // console.log('mutation list:', list);
            this.pullMessageInputChanges('MutationObserver');
        });

        observer.observe(this.messageInput.nativeElement, {
            attributes: true,
            childList: true,
            subtree: true,
        });
    }
    @HostListener('document:keydown', ['$event'])
    focusMessageInput(e: KeyboardEvent) {
        if (e.key == 'm') moveToMacroQueue(() => this.messageInput.nativeElement.focus());
    }

    username: string;
    _newMessage: string;
    pullMessageInputChanges(ctx: string): void {
        // console.log(`[ ${ctx} ] updated`);
        if (this.messageInput.nativeElement.innerText.trim()) {
            this.inputHandler();
            this._newMessage = this.messageInput.nativeElement.innerHTML.trim();
        } else this._newMessage = '';
    }
    get newMessage() {
        return this._newMessage;
    }
    set newMessage(value) {
        this._newMessage = value;
        // this.messageInput.nativeElement.innerHTML = value;
        moveToMacroQueue(() => (this.messageInput.nativeElement.innerHTML = value));
    }

    isTyping = false;
    emitStopTypingDebounced = debounce(() => this.emitTyping(false), 1500);
    inputHandler() {
        // console.log('input fired');
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
    messageSubmitHandler(e: Event) {
        if (!(e as KeyboardEvent).shiftKey) {
            e.stopPropagation();
            this.sendMessage();
        }
    }
    async sendMessage() {
        moveToMacroQueue(() => this.emitTyping(false));

        if (!this.newMessage) return;

        if (!this.username) if (!(await this.chooseUsername())) return;

        this.socket.emit(SocketEvents.CHAT_MESSAGE, this.newMessage);
        this.addMessageToChat({
            text: this.newMessage,
            username: 'me',
            isMe: true,
            type: SocketEvents.CHAT_MESSAGE,
        });

        this.newMessage = '';
    }

    messages: Message[] = [
        {
            text: 'Welcome to Floyds Messenger!',
            type: SocketEvents.USER_EVENT,
        },
        {
            text: 'Test Message!',
            type: SocketEvents.CHAT_MESSAGE,
            isMe: false,
            username: 'testuser',
        },
        {
            text: 'Oh really??!',
            type: SocketEvents.CHAT_MESSAGE,
            isMe: true,
            username: 'me',
        },
        {
            text: 'I wouldnt have thought of that!',
            type: SocketEvents.CHAT_MESSAGE,
            isMe: true,
            username: 'me',
        },
        {
            text: 'Test Message!',
            type: SocketEvents.CHAT_MESSAGE,
            isMe: false,
            username: 'testuser',
        },
        {
            text: 'Okay now ur getting uncreative',
            type: SocketEvents.CHAT_MESSAGE,
            isMe: true,
            username: 'me',
        },
        {
            text: 'Test Message!',
            type: SocketEvents.CHAT_MESSAGE,
            isMe: false,
            username: 'testuser',
        },
        {
            text: 'Oh really??!',
            type: SocketEvents.CHAT_MESSAGE,
            isMe: true,
            username: 'me',
        },
        {
            text: 'I wouldnt have thought of that!',
            type: SocketEvents.CHAT_MESSAGE,
            isMe: true,
            username: 'me',
        },
        {
            text: 'Test Message!',
            type: SocketEvents.CHAT_MESSAGE,
            isMe: false,
            username: 'testuser',
        },
        {
            text: 'Okay now ur getting uncreative',
            type: SocketEvents.CHAT_MESSAGE,
            isMe: true,
            username: 'me',
        },
        {
            text: 'Test Message!',
            type: SocketEvents.CHAT_MESSAGE,
            isMe: false,
            username: 'testuser',
        },
        {
            text: 'Oh really??!',
            type: SocketEvents.CHAT_MESSAGE,
            isMe: true,
            username: 'me',
        },
        {
            text: 'I wouldnt have thought of that!',
            type: SocketEvents.CHAT_MESSAGE,
            isMe: true,
            username: 'me',
        },
        {
            text: 'Test Message!',
            type: SocketEvents.CHAT_MESSAGE,
            isMe: false,
            username: 'testuser',
        },
        {
            text: 'Okay now ur getting uncreative',
            type: SocketEvents.CHAT_MESSAGE,
            isMe: true,
            username: 'me',
        },
        {
            text: 'Test Message!',
            type: SocketEvents.CHAT_MESSAGE,
            isMe: false,
            username: 'testuser',
        },
        {
            text: 'Oh really??!',
            type: SocketEvents.CHAT_MESSAGE,
            isMe: true,
            username: 'me',
        },
        {
            text: 'I wouldnt have thought of that!',
            type: SocketEvents.CHAT_MESSAGE,
            isMe: true,
            username: 'me',
        },
        {
            text: 'Test Message!',
            type: SocketEvents.CHAT_MESSAGE,
            isMe: false,
            username: 'testuser',
        },
        {
            text: 'Okay now ur getting uncreative',
            type: SocketEvents.CHAT_MESSAGE,
            isMe: true,
            username: 'me',
        },
    ];
    addMessageToChat({ text, ...message }: Message) {
        // text = escapeHTML(text);

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
    onNewMessageChange() {
        console.log();
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
