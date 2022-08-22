import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, filter, map, mergeMap, take, takeUntil, tap } from 'rxjs/operators';
import { appActions } from './app.actions';
import { HttpServerErrorResponse } from './app.model';
import { ChatsEffects } from './chat/chat.effects';
import { UserEffects } from './user/user.effects';
import { HotToastService } from '@ngneat/hot-toast';
import { Action } from '@ngrx/store';
import { throwError, of, Observable, interval, OperatorFunction } from 'rxjs';
import { ChatGroupEffects } from './chat/chat-group.effects';
import { FriendshipEffects } from './chat/friendship.effects';

@Injectable()
class AppEffects {
    constructor(private actions$: Actions, private toastService: HotToastService) {}

    logErrors = createEffect(() =>
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
            map(({ actionToRetry, ...err }) => {
                if ('error' in err && err.error.statusCode == '0 - OFFLINE')
                    return appActions.setInternetStatusOffline({ actionToRetry });
                return appActions.nothing();
            }),
        ),
    );

    checking = false;
    checkInternetConnection = createEffect(() => {
        return this.actions$.pipe(
            ofType(appActions.setInternetStatusOffline),
            mergeMap(({ actionToRetry }) => {
                if (this.checking) return of(appActions.nothing());

                this.checking = true;
                const maxAttempts = 25;
                return interval(1000).pipe(
                    takeUntil(this.actions$.pipe(ofType(appActions.setInternetStatusOnline))),
                    take(maxAttempts),
                    map(count => {
                        if (count == maxAttempts - 1 && !navigator.onLine) throw new Error();
                        return navigator.onLine;
                    }),
                    filter(isOnline => isOnline),
                    this.toastService.observe({
                        loading: 'Waiting for internet connection...',
                        success: "You're back online.",
                        error: 'Timeout - Could not get back online.',
                    }),
                    map(() => {
                        this.checking = false;
                        return appActions.setInternetStatusOnline({ actionToRetry });
                    }),
                    catchError(() => {
                        this.checking = false;
                        return of(appActions.nothing());
                    }),
                );
            }),
        );
    });

    forwardRetryAction = createEffect(() =>
        this.actions$.pipe(
            ofType(appActions.setInternetStatusOnline),
            map(({ actionToRetry }) => {
                if (actionToRetry) return appActions.retryAction({ actionToRetry });
                return appActions.nothing();
            }),
        ),
    );
    retryAction = createEffect(() =>
        this.actions$.pipe(
            ofType(appActions.retryAction),
            map(({ actionToRetry }) => {
                this.toastService.info('Retrying...');
                return actionToRetry;
            }),
        ),
    );
}

export const effects = [AppEffects, UserEffects, ChatsEffects, ChatGroupEffects, FriendshipEffects];

export const handleError = <T, R>(
    dataOrError: T | HttpServerErrorResponse,
    actionCallback: (data: T) => R,
    actionToRetry: Action & Record<string, any>,
) => {
    if ('error' in dataOrError) return appActions.error({ ...dataOrError, actionToRetry });

    return actionCallback(dataOrError);
};

type handleResponse = {
    /** Checks for errors and mappes the response to an error action or the result of `onSuccess`. */
    <T, SuccessA extends Action & Record<string, any>>(options: {
        onSuccess: (data: T) => SuccessA;
        actionToRetry: Action & Record<string, any>;
        showToast?: boolean;
    }): OperatorFunction<T | HttpServerErrorResponse, SuccessA | ReturnType<typeof appActions['error']>>;

    /** Checks for errors and mappes the response to result of `onError` or `onSuccess` */
    <T, ErrorA extends Action & Record<string, any>, SuccessA extends Action & Record<string, any>>(options: {
        onError: (error: HttpServerErrorResponse) => ErrorA;
        onSuccess: (data: T) => SuccessA;
    }): OperatorFunction<T | HttpServerErrorResponse, ErrorA | SuccessA>;
};

/** Checks for errors and mappes the response to the result of either `onError`, `onSuccess` or error action, if `onError` is not given. */
export const handleResponse: handleResponse = <
    T,
    ErrorA extends Action & Record<string, any>,
    SuccessA extends Action & Record<string, any>,
>({
    onError,
    onSuccess,
    ...options
}: {
    onError?: (error: HttpServerErrorResponse) => ErrorA;
    onSuccess: (data: T) => SuccessA;
    actionToRetry?: Action & Record<string, any>;
    showToast?: boolean;
}) =>
    map<T | HttpServerErrorResponse, ErrorA | SuccessA | ReturnType<typeof appActions['error']>>(dataOrError => {
        if ('error' in dataOrError) {
            if (onError) return onError(dataOrError);
            return appActions.error({ ...dataOrError, ...options });
        }
        return onSuccess(dataOrError);
    });

export const throwIfErrorExists = () => {
    return mergeMap(<T>(dataOrError: T | HttpServerErrorResponse) =>
        'error' in dataOrError ? throwError(() => dataOrError) : of(dataOrError),
    );
};

type ErrorAction = ReturnType<typeof appActions.error>;
export const catchAndHandleError = (actionToRetry: Action & Record<string, any>, showToast = false) => {
    return catchError<Action, Observable<ErrorAction>>((err: HttpServerErrorResponse) =>
        of(appActions.error({ ...err, showToast, actionToRetry })),
    );
};
