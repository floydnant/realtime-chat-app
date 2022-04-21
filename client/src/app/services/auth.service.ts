import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { userActions } from '../store/actions/user.actions';
import {
    AuthResponse,
    AuthSuccessResponse,
    LoginCredentialsDTO,
    SignupCredentialsDTO,
} from '../store/models/user.model';
import { BaseHttpClient } from './base-http-client.service';
import { LocalStorageService } from './local-storage.service';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    constructor(private http: BaseHttpClient, private localStorageService: LocalStorageService, private store: Store) {}

    login(credentials: LoginCredentialsDTO) {
        return this.http
            .postAsync<AuthSuccessResponse>('/auth/login', credentials)
            .then(data => {
                data = data as AuthSuccessResponse;
                this.localStorageService.setUser(data.user!);
                this.store.dispatch(userActions.loginOrSignupSuccess(data.user!));
                return data;
            })
            .catch(err => err) as Promise<AuthResponse>;
    }
    signup(credentials: SignupCredentialsDTO) {
        return this.http
            .postAsync<AuthSuccessResponse>('/auth/signup', credentials)
            .then(data => {
                data = data as AuthSuccessResponse;
                this.localStorageService.setUser(data.user!);
                this.store.dispatch(userActions.loginOrSignupSuccess(data.user!));
                return data;
            })
            .catch(err => err) as Promise<AuthResponse>;
    }
    meQuery() {}
    logout() {}
    loadUser() {}
}
