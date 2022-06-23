import { Injectable } from '@angular/core';
import { Actions, createEffect } from '@ngrx/effects';
import { of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { globalActions } from '../actions';
import { HttpServerErrorResponse } from '../models';
import { ChatsEffects } from './chats.effects';
import { UserEffects } from './user.effects';

@Injectable()
class GlobalEffects {
    constructor(private actions$: Actions) {}

    actionLogger = createEffect(() =>
		this.actions$.pipe(
			mergeMap(({ type }) => of(
				console.log(
					'%caction fired: %c' + type,
					'color: hsl(130, 0%, 50%);',
					'color: hsl(130, 100%, 50%);',
				),
			)),
		),
		{ dispatch: false },
	); //prettier-ignore
}

export const effects = [GlobalEffects, UserEffects, ChatsEffects];

export const handleError = <T, R>(dataOrError: T | HttpServerErrorResponse, actionCallback: (data: T) => R) => {
    if ('error' in dataOrError) return globalActions.error(dataOrError);

    return actionCallback(dataOrError);
};
