import * as got from 'got';

import { AIResponseQuery } from './types';

const client = got.extend({
    headers: { 'x-api-key': process.env.X_API_KEY }, // eslint-disable-line no-process-env
    json: true,
    retry: { retries: 5 }
});

/**
 * Make a request to an endpoint. If it fails, it retries up to 3 times.
 * @param {string} endpoint - Endpoint to request.
 */
export const get = async (endpoint: string): Promise<AIResponseQuery> => {
    const response = await client.get(endpoint);

    return response.body as AIResponseQuery;
};
