import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { tap } from 'rxjs/operators';
import { globalActions } from './index.actions';
import { HttpServerErrorResponse } from './index.model';
import { ChatsEffects } from './chats/chats.effects';
import { UserEffects } from './user/user.effects';
import { HotToastService } from '@ngneat/hot-toast';

@Injectable()
class GlobalEffects {
    constructor(private actions$: Actions, private toastService: HotToastService) {}

    logErrors = createEffect(
        () =>
            this.actions$.pipe(
                ofType(globalActions.error),
                tap(({ type, ...action }) => {
                    console.log('%csome error occurred:', 'color: red;', action);

                    if ('errorMessage' in action) this.toastService.error(action.errorMessage);
                    else if (typeof action.error.message == 'string') this.toastService.error(action.error.message);
                    else action.error.message.forEach(msg => this.toastService.error(msg));
                }),
            ),
        { dispatch: false },
    );
}

export const effects = [GlobalEffects, UserEffects, ChatsEffects];

export const handleError = <T, R>(dataOrError: T | HttpServerErrorResponse, actionCallback: (data: T) => R) => {
    if ('error' in dataOrError) return globalActions.error(dataOrError);

    return actionCallback(dataOrError);
};
