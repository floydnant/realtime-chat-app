import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { promisifyObservable } from '../utils';
import { HttpServerErrorResponse } from '../store/index.model';
import { AppState } from '../store/index.reducer';

type HttpMethods = 'get' | 'put' | 'post' | 'delete' | 'patch' | 'options';
type HttpMethodsWithoutBodyParam = 'get' | 'delete' | 'options';
type OriginalHttpClientOptions<K extends keyof HttpClient & HttpMethods> = Parameters<
    HttpClient[K]
>[K extends HttpMethodsWithoutBodyParam ? 1 : 2];

type HttpClientOptionsMap = {
    [method in HttpMethods]: OriginalHttpClientOptions<method> & {
        // more options...
    };
};
export type HttpClientOptions<K extends HttpMethods | null = null> = K extends HttpMethods
    ? HttpClientOptionsMap[K]
    : HttpClientOptionsMap[HttpMethods];

@Injectable({
    providedIn: 'root',
})
export class BaseHttpClient {
    constructor(public http: HttpClient, private store: Store<AppState>) {
        this.store.subscribe(state => (this.bearerToken = state.user.loggedInUser?.accessToken));
    }

    bearerToken?: string = undefined;

    private _baseUrl = environment.SERVER_BASE_URL;
    get baseUrl() {
        return this._baseUrl;
    }

    /**
     * @param endpoint Note: needs to start with a slash
     * @param options The HTTP options to send with the request. */
    getAsync<T>(...args: Parameters<BaseHttpClient['get']>) {
        const res = this.get<T>(...args);
        return promisifyObservable(res, 'if error property exists');
    }
    /**
     * @param endpoint Note: needs to start with a slash
     * @param options The HTTP options to send with the request. */
    get<T>(endpoint: string, options?: HttpClientOptions<'get'>) {
        const url = this._baseUrl + endpoint;
        return this.http.get<T>(url, this.addBearerToken(options)).pipe(this.getErrorInterceptor());
    }

    /**
     * @param endpoint Note: needs to start with a slash
     * @param body
     * @param options The HTTP options to send with the request. */
    postAsync<T>(...args: Parameters<BaseHttpClient['post']>) {
        const res = this.post<T>(...args);
        return promisifyObservable(res, 'if error property exists');
    }
    /**
     * @param endpoint Note: needs to start with a slash
     * @param body
     * @param options The HTTP options to send with the request. */
    post<T>(endpoint: string, body?: Record<string, any>, options?: HttpClientOptions<'post'>) {
        const url = this._baseUrl + endpoint;

        return this.http.post<T>(url, body || {}, this.addBearerToken(options)).pipe(this.getErrorInterceptor());
    }

    /**
     * @param endpoint Note: needs to start with a slash
     * @param body
     * @param options The HTTP options to send with the request */
    patch<T>(endpoint: string, body: Record<string, any>, options?: HttpClientOptions<'patch'>) {
        const url = this._baseUrl + endpoint;

        return this.http.patch<T>(url, body, this.addBearerToken(options)).pipe(this.getErrorInterceptor());
    }

    delete<T>(endpoint: string, options?: HttpClientOptions<'delete'>) {
        const url = this._baseUrl + endpoint;

        return this.http.delete<T>(url, this.addBearerToken(options)).pipe(this.getErrorInterceptor());
    }

    /** adds bearer token inside the 'headers'*/
    private addBearerToken<T extends HttpClientOptions>(options: T | undefined): HttpClientOptions {
        if (!this.bearerToken) return options || {};

        return {
            ...(options || {}),
            headers: {
                ...(options?.headers || {}),
                Authorization: `Bearer ${this.bearerToken}`,
            },
        };
    }

    /** catches errors and returns an `HttpServerErrorResponse` */
    private getErrorInterceptor<T>() {
        return catchError<T, Observable<HttpServerErrorResponse>>(({ type, ...err }: HttpErrorResponse) => {
            console.warn('http error handler: An error occurred:', err.error, 'whole error res:', err);

            if (err.status === 0)
                return of({
                    ...err,
                    error: {
                        statusCode: 0,
                        message: 'A network error occurred. Please check your internet connection and try again.',
                        error: 'client-side or network error',
                    },
                });
            else return of(err);
        });
    }
}
