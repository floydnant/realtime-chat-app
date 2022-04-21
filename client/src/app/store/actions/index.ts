import { createAction } from '@ngrx/store';

const nothing = createAction('[ GLOBAL ] nothing');

export const globalActions = {
    nothing,
};
