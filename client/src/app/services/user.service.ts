import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { userActions } from '../store/user/user.actions';
import { HttpServerErrorResponse } from '../store/app.model';
import { AuthSuccessResponse, LoginCredentialsDTO, SignupCredentialsDTO } from '../store/user/user.model';
import { BaseHttpClient } from './base-http-client.service';
import { LocalStorageService } from './local-storage.service';
import { SocketService } from './socket.service';
import { HotToastService } from '@ngneat/hot-toast';
import { UserSearchResult } from 'src/shared/index.model';

@Injectable({
    providedIn: 'root',
})
export class UserService {
    constructor(
        private http: BaseHttpClient,
        private localStorageService: LocalStorageService,
        private store: Store,
        private socket: SocketService,
        private toastService: HotToastService,
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
                this.socket.loginSocket(false);

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

    searchUsers(query: string) {
        if (!query) {
            this.toastService.warning('You cannot search for an empty username.');
            return;
        }
        return this.http.getAsync<UserSearchResult[]>(`/user/search?q=${query}`);
    }
}
