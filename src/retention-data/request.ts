import * as r from 'request';

import { delay } from './utils';
import { AIResponseQuery } from './types';

const request = r.defaults({
    headers: { 'x-api-key': process.env['X-API-KEY'] }, // eslint-disable-line no-process-env
    json: true
});

export const getWithRetry = (endpoint: string, delayInMS: number = 5000): Promise<AIResponseQuery> => {
    let retries = 3;

    return new Promise((resolve, rejects) => {
        const get = () => {
            request.get(endpoint, async (error, res) => {
                if (error || typeof res.body === 'string') {
                    if (retries === 0) {
                        return rejects(error ? error : new Error(`Error getting data from: ${endpoint}`));
                    }

                    retries--;

                    await delay(delayInMS);

                    return get();
                }

                return resolve(res.body);
            });
        };

        return get();
    });
};
