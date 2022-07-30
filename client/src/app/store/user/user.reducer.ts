import { createReducer, on } from '@ngrx/store';
import { userActions } from './user.actions';
import { UserState } from './user.model';

const initialState = new UserState();
export const userReducer = createReducer(
    initialState,

    // login or signup success
    on(userActions.loginOrSignupSuccess, (state, { type, ...user }) => ({
        ...state,
        loggedInUser: user,
        loading: false,
    })),
    on(userActions.loadUserSuccess, (state, { type, ...user }) => ({
        ...state,
        loggedInUser: user,
    })),

    // logout
    on(userActions.logout, _state => initialState),
);
