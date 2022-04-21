export interface HttpServerErrorResponse {
    error: {
        message: string;
        error: string;
        statusCode: number;
    };
}
