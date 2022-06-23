import { createAction, props } from '@ngrx/store';
import { HttpServerErrorResponse } from '../models';

export const globalActions = {
    nothing: createAction('[ GLOBAL ] nothing'),
    error: createAction('[ GLOBAL ] error', props<HttpServerErrorResponse | { errorMessage: string }>()),
};
