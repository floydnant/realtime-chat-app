import { Action, createAction, props } from '@ngrx/store';
import { HttpServerErrorResponse } from './app.model';

export const appActions = {
    nothing: createAction('[ APP ] nothing'),
    error: createAction(
        '[ APP ] error',
        props<
            (HttpServerErrorResponse | { errorMessage: string }) & {
                showToast?: boolean;
                actionToRetry?: Action & Record<string, any>;
            }
        >(),
    ),

    // @TODO: integrate into state
    setInternetStatusOffline: createAction(
        '[ APP ] set internet offline',
        props<{ actionToRetry?: Action & Record<string, any> }>(),
    ),
    setInternetStatusOnline: createAction(
        '[ APP ] set internet online',
        props<{ actionToRetry?: Action & Record<string, any> }>(),
    ),

    retryAction: createAction('[ APP ] retry action', props<{ actionToRetry: Action & Record<string, any> }>()),
};
