const isReviewEnv = process.env.NG_APP_PULL_REQUEST == 'true';
const reviewId = process.env.NG_APP_REVIEW_ID;
const provider = process.env.NG_APP_SERVER_PROVIDER;

// @TODO: add staging env

const urls = {
    heroku: {
        prod: 'https://floyds-messenger-prod.herokuapp.com',
        staging: 'https://floyds-messenger-staging.herokuapp.com',
        review: `https://floyds-messenger-pr-${reviewId}.herokuapp.com`,
    },
    railway: {
        prod: 'https://realtime-chat-app.up.railway.app',
        staging: 'https://realtime-chat-app-staging.up.railway.app',
        review: `https://realtime-chat-app-realtime-chat-app-pr-${reviewId}.up.railway.app`,
    },
};

const url = {
    prod: urls[provider || 'heroku'].prod,
    staging: urls[provider || 'heroku'].staging,
    review: urls[provider || 'heroku'].review,
};

export const environment = {
    production: true,
    SERVER_BASE_URL: process.env.NG_APP_SERVER_BASE_URL || (isReviewEnv ? url.review : url.prod),
    STAGE: isReviewEnv ? 'review' : 'production',
};
