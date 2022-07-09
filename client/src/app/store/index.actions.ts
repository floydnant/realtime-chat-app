import { createAction, props } from '@ngrx/store';
import { HttpServerErrorResponse } from './index.model';

export const globalActions = {
    nothing: createAction('[ GLOBAL ] nothing'),
    error: createAction(
        '[ GLOBAL ] error',
        props<(HttpServerErrorResponse | { errorMessage: string }) & { showToast?: boolean }>(),
    ),
};
