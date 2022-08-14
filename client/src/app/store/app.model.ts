import { HttpErrorResponse } from '@angular/common/http';

export interface HttpServerErrorResponse extends Omit<HttpErrorResponse, 'type'> {
    error: {
        message: string | string[];
        error?: string;
        statusCode: number | '0 - SERVER DOWN' | '0 - OFFLINE';
    };
}

export type HttpSuccessResponse<T extends Record<string, any> = {}> = T & { successMessage: string }