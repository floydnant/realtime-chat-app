import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { environment } from 'src/environments/environment';
import { ChatsState } from './chat/chat.model';
import { UserState } from './user/user.model';
import { chatsReducer } from './chat/chat.reducer';
import { userReducer } from './user/user.reducer';

export interface AppState {
    user: UserState;
    chats: ChatsState;
}

export const reducers: ActionReducerMap<AppState> = {
    user: userReducer,
    chats: chatsReducer,
};

const actionLogger: MetaReducer<AppState> = reducer => (state, action) => {
    console.log('%caction fired: %c' + action.type, 'color: hsl(130, 0%, 50%);', 'color: hsl(130, 100%, 50%);');
    return reducer(state, action);
};

export const metaReducers: MetaReducer<AppState>[] = !environment.production ? [actionLogger] : [];
