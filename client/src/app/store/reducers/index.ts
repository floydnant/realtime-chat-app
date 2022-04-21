import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { environment } from 'src/environments/environment';
import { UserState } from '../models/user.model';
import { userReducer } from './user.reducer';

export interface AppState {
    user: UserState;
}

export const reducers: ActionReducerMap<AppState> = {
    user: userReducer,
};

export const metaReducers: MetaReducer<AppState>[] = !environment.production ? [] : [];
