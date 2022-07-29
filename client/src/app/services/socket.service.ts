import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HotToastService } from '@ngneat/hot-toast';
import { Store } from '@ngrx/store';
import { Socket } from 'ngx-socket-io';
import { EventName, SocketEventPayloadAsFnMap, EventPayload } from 'src/shared/event-payload-map.model';
import { SocketEvents } from 'src/shared/socket-events.model';
import { AppState } from '../store/app.reducer';
import { LoggedInUser } from '../store/user/user.model';

@Injectable({
    providedIn: 'root',
})
export class SocketService {
    constructor(
        private socket: Socket,
        private router: Router,
        private toastService: HotToastService,
        private store: Store<AppState>,
    ) {
        store.subscribe(state => {
            this.user = state.user.loggedInUser;
        });
        this.socket.on(SocketEvents.SERVER__AUTHENTICATE_PROMPT, () => this.loginSocket());
    }
    private user: LoggedInUser | null;

    async loginSocket(showToast = true) {
        if (this.user) {
            const { authenticated } = await this.requestOneTimeResponse({
                reqEvent: SocketEvents.CLIENT__AUTHENTICATE,
                payload: { accessToken: this.user.accessToken },
                resEvent: SocketEvents.SERVER__AUTHENTICATE,
            });
            if (authenticated) {
                if (showToast) this.toastService.success(`Still logged in with '${this.user.username}'.`);
            } else {
                this.router.navigate(['/auth/login']);
                this.toastService.info('Please login again.');
            }
        } else this.router.navigate(['/auth/login']);
    }
    logoutSocket() {
        this.emit(SocketEvents.CLIENT__LOGOUT, null);
    }

    on<K extends EventName>(eventName: K, cb: SocketEventPayloadAsFnMap[K]) {
        return this.socket.on(eventName, cb);
    }
    once<K extends EventName>(eventName: K, cb: /* (answer: any) => void */ SocketEventPayloadAsFnMap[K]) {
        return this.socket.once(eventName, cb);
    }
    emit<K extends EventName>(eventName: K, payload: EventPayload<K>) {
        return this.socket.emit(eventName, payload);
    }
    fromEvent<K extends EventName, T = EventPayload<K>>(eventName: K) {
        return this.socket.fromEvent<T>(eventName);
    }

    requestOneTimeResponse<K extends EventName, R extends EventName = K>({
        reqEvent,
        payload,
        resEvent = reqEvent,
    }: {
        reqEvent: K;
        payload: EventPayload<K>;
        resEvent?: R | K;
    }) {
        return new Promise<EventPayload<R>>(res => {
            this.socket.emit(reqEvent, payload);
            this.socket.once(resEvent, (answer: EventPayload<R>) => res(answer));
        });
    }
}
