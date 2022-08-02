import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { Injectable } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { userActions } from './user.actions';
import { appActions } from '../app.actions';
import { Router } from '@angular/router';
import { HotToastService } from '@ngneat/hot-toast';

@Injectable()
export class UserEffects {
    constructor(
        private actions$: Actions,
        private authService: AuthService,
        private router: Router,
        private toastService: HotToastService,
    ) {}

    loginSuccess = createEffect(
        () =>
            this.actions$.pipe(
                ofType(userActions.loginOrSignupSuccess),
                tap(({ username }) => {
                    this.toastService.success(`Logged in with '${username}'`);
                    this.router.navigate(['/chat']);
                }),
            ),
        { dispatch: false },
    );

    logout = createEffect(
        () =>
            this.actions$.pipe(
                ofType(userActions.logout),
                tap(() => {
                    this.toastService.info('You logged out.');
                    this.router.navigate(['/auth/login']);
                    this.authService.logout();
                }),
            ),
        { dispatch: false },
    );

    loadUser = createEffect(() => {
        return this.actions$.pipe(
            ofType('@ngrx/effects/init'),
            map(() => {
                console.log('loading user...');
                const user = this.authService.loadUser();

                if (user) return userActions.loadUserSuccess(user);
                return appActions.nothing();
            }),
        );
    });
}
