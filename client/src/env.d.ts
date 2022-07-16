declare var process: {
    env: {
        NG_APP_ENV: string;

        /** PRODUCTION ONLY */
        NG_APP_PULL_REQUEST?: string;
        /** PRODUCTION ONLY */
        NG_APP_REVIEW_ID?: string;
        /** PRODUCTION ONLY */
        NG_APP_SERVER_PROVIDER?: 'heroku' | 'railway';

        SERVER_BASE_URL?: string;

        [key: string]: string | undefined;
    };
};
