import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY, of, throwError } from 'rxjs';
import { map, mergeMap, catchError, exhaustMap } from 'rxjs/operators';

import { Injectable } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { userActions } from './user.actions';
import { globalActions } from '../index.actions';
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
                mergeMap(({ username }) => {
                    this.toastService.success(`Succesfully logged in with '${username}'`);
                    return of(setTimeout(() => this.router.navigate(['/chat']), 2000));
                }),
            ),
        { dispatch: false },
    );

    logout = createEffect(
        () =>
            this.actions$.pipe(
                ofType(userActions.logout),
                mergeMap(() => {
                    this.toastService.info('You logged out.');
                    this.router.navigate(['/auth/login']);
                    return of(this.authService.logout());
                }),
            ),
        { dispatch: false },
    );

    loadUser = createEffect(() =>
        this.actions$.pipe(
            ofType('@ngrx/effects/init'),
            mergeMap(() => {
                console.log('loading user...');

                return of(this.authService.loadUser()).pipe(
                    map(user => {
                        if (user) return userActions.loginOrSignupSuccess(user);
                        else return globalActions.nothing();
                    }),
                    catchError(() => EMPTY),
                );
            }),
        ),
    );
}
