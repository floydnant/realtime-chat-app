import { createReducer, on } from '@ngrx/store';
import { userActions } from '../actions/user.actions';
import { UserState } from '../models/user.model';

const initialState = null as UserState;
export const userReducer = createReducer(
    initialState,

    // login or signup success
    on(userActions.loginOrSignupSuccess, (state, { type, ...user }) => user),

    // logout
    on(userActions.logout, _state => initialState),
);
