import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { userActions } from '../store/user/user.actions';
import { HttpServerErrorResponse } from '../store/app.model';
import { ChatRoomApiResponse } from '../store/chats/chats.model';
import { AuthSuccessResponse, LoginCredentialsDTO, SignupCredentialsDTO } from '../store/user/user.model';
import { moveToMacroQueue } from '../utils';
import { BaseHttpClient } from './base-http-client.service';
import { LocalStorageService } from './local-storage.service';
import { SocketService } from './socket.service';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    constructor(
        private http: BaseHttpClient,
        private localStorageService: LocalStorageService,
        private store: Store,
        private socket: SocketService,
    ) {}

    // TODO: this should be implemented with effects
    async login(credentials: LoginCredentialsDTO): Promise<AuthSuccessResponse | HttpServerErrorResponse> {
        return this.http
            .postAsync<AuthSuccessResponse>('/auth/login', credentials)
            .then(data => {
                this.localStorageService.setUser(data.user);
                this.store.dispatch(userActions.loginOrSignupSuccess(data.user));
                this.socket.loginSocket(false);
                return data;
            })
            .catch(err => err);
    }
    
    // TODO: and also this should be implemented with effects
    async signup(credentials: SignupCredentialsDTO): Promise<AuthSuccessResponse | HttpServerErrorResponse> {
        return this.http
            .postAsync<AuthSuccessResponse>('/auth/signup', credentials)
            .then(data => {
                this.localStorageService.setUser(data.user);
                this.store.dispatch(userActions.loginOrSignupSuccess(data.user));

                return data;
            })
            .catch(err => err);
    }
    logout() {
        console.log('logging out...');
        this.localStorageService.deleteUser();
        this.socket.logoutSocket();
    }
    loadUser() {
        return this.localStorageService.getUser();
    }
}
