import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpServerErrorResponse } from './store/app.model';

export function debounce(callback: (...args: any[]) => unknown, delay = 250) {
    let timeout: any;

    return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => callback(...args), delay);
    };
}

export const getCopyOf = <T extends Record<string, any> | any[]>(obj: T): T => JSON.parse(JSON.stringify(obj));

export const escapeHTML = (unsafe: string) =>
    unsafe == '' || unsafe == null
        ? ''
        : unsafe.replace(/[&<"']/g, match => {
              switch (match) {
                  case '&':
                      return '&amp;';
                  case '<':
                      return '&lt;';
                  case '"':
                      return '&quot;';
                  case "'":
                      return '&apos;';
                  default:
                      return match;
              }
          });

export const moveToMacroQueue = (callback: () => void) => setTimeout(callback, 0);

type promisifyObservable = {
    <T>(
        observable: Observable<T | HttpServerErrorResponse>,
        rejectOnError: 'if error property exists' | 'with catchError() operator',
    ): Promise<T>;
    <T>(observable: Observable<T | HttpServerErrorResponse>, rejectOnError: 'dont reject'): Promise<
        T | HttpServerErrorResponse
    >;
};
export const promisifyObservable: promisifyObservable = <T>(
    observable: Observable<T>,
    rejectOnError: string,
): Promise<T> =>
    new Promise((resolve, reject) => {
        switch (rejectOnError) {
            case 'if error property exists':
                observable.subscribe(data => {
                    if ('error' in data) reject(data);
                    else resolve(data);
                });
                break;

            case 'with catchError() operator':
                observable
					.pipe(catchError((err, caught) => {
                        reject(err);
                        return caught;
					}))
					.subscribe(data => resolve(data)); //prettier-ignore
                break;

            default:
                observable.subscribe(data => resolve(data));
        }
    });
