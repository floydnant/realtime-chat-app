import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { tap } from 'rxjs/operators';
import { globalActions } from './index.actions';
import { HttpServerErrorResponse } from './index.model';
import { ChatsEffects } from './chats/chats.effects';
import { UserEffects } from './user/user.effects';

@Injectable()
class GlobalEffects {
    constructor(private actions$: Actions) {}

    logErrors = createEffect(
        () =>
            this.actions$.pipe(
                ofType(globalActions.error),
                tap(({ type, ...action }) => console.log('%csome error occurred:', 'color: red;', action)),
            ),
        { dispatch: false },
    );
}

export const effects = [GlobalEffects, UserEffects, ChatsEffects];

export const handleError = <T, R>(dataOrError: T | HttpServerErrorResponse, actionCallback: (data: T) => R) => {
    if ('error' in dataOrError) return globalActions.error(dataOrError);

    return actionCallback(dataOrError);
};
