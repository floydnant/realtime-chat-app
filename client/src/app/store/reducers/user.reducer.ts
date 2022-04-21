import { createReducer, on } from '@ngrx/store';
import { userActions } from '../actions/user.actions';
import { UserState } from '../models/user.model';

const initialState = null as UserState;
export const userReducer = createReducer(
    initialState,

    // login or signup success
    on(userActions.loginOrSignupSuccess, (state, { username, id, accessToken }) => ({ username, id, accessToken })),

    // logout
    on(userActions.logout, _state => initialState),
);
