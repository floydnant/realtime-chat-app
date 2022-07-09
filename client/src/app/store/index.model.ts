import { HttpErrorResponse } from '@angular/common/http';

export interface HttpServerErrorResponse extends Omit<HttpErrorResponse, 'type'> {
    error: {
        message: string | string[];
        error?: string;
        statusCode: number;
    };
}
