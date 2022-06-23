import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { environment } from 'src/environments/environment';
import { ChatsState } from '../models/chats.model';
import { UserState } from '../models/user.model';
import { chatsReducer } from './chats.reducer';
import { userReducer } from './user.reducer';

export interface AppState {
    user: UserState;
    chats: ChatsState;
}

export const reducers: ActionReducerMap<AppState> = {
    user: userReducer,
    chats: chatsReducer,
};

export const metaReducers: MetaReducer<AppState>[] = !environment.production ? [] : [];
