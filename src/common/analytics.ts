import * as applicationinsights from 'applicationinsights';
import * as http from 'https';

const apiEndpointHostname = process.env.API_ENDPOINT_HOSTNAME!; // eslint-disable-line no-process-env
const instrumentationKey = process.env.RESULT_INSTRUMENTATION_KEY!; // eslint-disable-line no-process-env

applicationinsights.setup(instrumentationKey).start();

const appInsightsClient = applicationinsights.defaultClient;

let options = {
    batchDelay: 15000,
    defaultProperties: {},
};
let sendTimeout: any = null;
let telemetryQueue: any = [];

const post = async (data: any) => {
    const reqOptions = {
        hostname: apiEndpointHostname,
        port: 80,
        path: '/api/log',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
    };

    const req = http.request(reqOptions, (res) => {
        console.log(`statusCode: ${res.statusCode}`)

        res.on('data', (d) => {
            console.log(`BODY: ${d}`)
        });

        res.on('end', () => {
            console.log('No more data in response.');
        });
    });

    req.on('error', (error) => {
        console.error(error)
    });

    req.write(data);
    req.end();
};

const sendTelemetry = async () => {
    if (sendTimeout) {
        clearTimeout(sendTimeout);
        sendTimeout = null;
    }
    const data = JSON.stringify({
        data: telemetryQueue
    });

    telemetryQueue = [];
    try {
        await post(data);
    }
    catch (err) {
        console.warn('Failed to send telemetry: ', err);
    }
};

const pushToQueue = async (type: string, data: any) => {
    telemetryQueue.push(
        {
            name: data.name,
            properties: Object.assign(Object.assign({}, options.defaultProperties), data.properties),
            ver: 2,
            type: `${type}Data`
        }
    );
    if (!options.batchDelay) {
        await sendTelemetry();
    }
    else if (!sendTimeout) {
        sendTimeout = setTimeout(sendTelemetry, options.batchDelay);
    }
};

/**
 * Send an event to webhint telemetry API.
 * @param name - Event name.
 * @param properties - Properties to track.
 */
export const trackEvent = async (name: string, properties: any) => {
    await pushToQueue('Event', { name, properties });
};

/**
 * Send an event to Application Insights.
 * @param name - Event name.
 * @param properties - Properties to track.
 */
export const addToAppInsights = (name: string, properties: any = {}) => {
    appInsightsClient.trackEvent({
        name,
        properties
    });
};

/**
 * Send the remaining data to Application Insights.
 */
export const sendPendingData = (): Promise<void> => {
    return new Promise((resolve) => {
        appInsightsClient.flush({
            callback: () => {
                return resolve();
            }
        });
    });
};
