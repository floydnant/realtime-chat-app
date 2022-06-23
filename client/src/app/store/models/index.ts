export interface HttpServerErrorResponse {
    error: {
        message: string | string[];
        error?: string;
        statusCode: number;
    };
}

