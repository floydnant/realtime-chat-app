import { createAction, props } from '@ngrx/store';
import { HttpServerErrorResponse } from './app.model';

export const appActions = {
    nothing: createAction('[ GLOBAL ] nothing'),
    error: createAction(
        '[ GLOBAL ] error',
        props<(HttpServerErrorResponse | { errorMessage: string }) & { showToast?: boolean }>(),
    ),
};
