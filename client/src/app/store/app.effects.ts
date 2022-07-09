import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, mergeMap, tap } from 'rxjs/operators';
import { appActions } from './app.actions';
import { HttpServerErrorResponse } from './app.model';
import { ChatsEffects } from './chats/chats.effects';
import { UserEffects } from './user/user.effects';
import { HotToastService } from '@ngneat/hot-toast';
import { Action } from '@ngrx/store';
import { throwError, of, Observable } from 'rxjs';

@Injectable()
class AppEffects {
    constructor(private actions$: Actions, private toastService: HotToastService) {}

    logErrors = createEffect(
        () =>
            this.actions$.pipe(
                ofType(appActions.error),
                tap(({ type, showToast, ...action }) => {
                    console.log('%csome error occurred:', 'color: red;', action);

                    if (showToast === undefined) showToast = true;
                    if (showToast === false) return;

                    if ('errorMessage' in action) this.toastService.error(action.errorMessage);
                    else if (typeof action.error?.message == 'string') this.toastService.error(action.error.message);
                    else action.error?.message.forEach(msg => this.toastService.error(msg));
                }),
            ),
        { dispatch: false },
    );
}

export const effects = [AppEffects, UserEffects, ChatsEffects];

export const handleError = <T, R>(dataOrError: T | HttpServerErrorResponse, actionCallback: (data: T) => R) => {
    if ('error' in dataOrError) return appActions.error(dataOrError);

    return actionCallback(dataOrError);
};

export const throwIfErrorExists = () => {
    return mergeMap(<T>(dataOrError: T | HttpServerErrorResponse) =>
        'error' in dataOrError ? throwError(() => dataOrError) : of(dataOrError),
    );
}

type ErrorAction = ReturnType<typeof appActions.error>;
export const catchAndHandleError = (showToast = false) => {
    return catchError<Action, Observable<ErrorAction>>((err: HttpServerErrorResponse) => of(appActions.error({...err, showToast })));
}
