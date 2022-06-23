import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY, of, throwError } from 'rxjs';
import { map, mergeMap, catchError, exhaustMap } from 'rxjs/operators';

import { Injectable } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { userActions } from '../actions/user.actions';
import { globalActions } from '../actions';
import { Router } from '@angular/router';

@Injectable()
export class UserEffects {
    constructor(private actions$: Actions, private authService: AuthService, private router: Router) {}

    loginSuccess = createEffect(
        () =>
            this.actions$.pipe(
                ofType(userActions.loginOrSignupSuccess),
                mergeMap(() => of(setTimeout(() => this.router.navigate(['/chat']), 2000))),
            ),
        { dispatch: false },
    );

    logout = createEffect(
        () =>
            this.actions$.pipe(
                ofType(userActions.logout),
                mergeMap(() => {
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
