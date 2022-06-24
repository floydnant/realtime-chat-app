import { createAction, props } from '@ngrx/store';
import { HttpServerErrorResponse } from '../index.model';
import { LoginCredentialsDTO, SignupCredentialsDTO, LoggedInUser } from './user.model';

export const userActions = {
    signup: createAction('[ USER ] signup', props<SignupCredentialsDTO>()),
    login: createAction('[ USER ] login', props<LoginCredentialsDTO>()),
    loginOrSignupSuccess: createAction('[ USER ] login or signup success', props<LoggedInUser>()),
    loginOrSignupError: createAction('[ USER ] login error', props<HttpServerErrorResponse>()),

    logout: createAction('[ USER ] logout'),

    loadUser: createAction('[ USER ] load user'),
};
