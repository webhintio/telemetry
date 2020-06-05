import * as applicationinsights from 'applicationinsights';
import * as got from 'got';

const apiEndpointHostname = process.env.API_ENDPOINT_HOSTNAME!; // eslint-disable-line no-process-env
const instrumentationKey = process.env.RESULT_INSTRUMENTATION_KEY!; // eslint-disable-line no-process-env

applicationinsights.setup(instrumentationKey).start();

const appInsightsClient = applicationinsights.defaultClient;
const options = {
    batchDelay: 15000,
    defaultProperties: {}
};
let sendTimeout: any = null;
const telemetryQueue: any = [];

const post = async (data: any) => {
    try {
        const response = await got.post(apiEndpointHostname, { json: data });

        console.log(response.body);
    } catch (error) {
        console.warn(error.response.body);
    }
};

const sendTelemetry = async () => {
    if (sendTimeout) {
        clearTimeout(sendTimeout);
        sendTimeout = null;
    }

    try {
        const data = telemetryQueue.splice(0);

        await post(data);
    } catch (err) {
        console.warn('Failed to send telemetry: ', err);
    }
};

const pushToQueue = async (type: string, data: any) => {
    telemetryQueue.push(
        {
            name: data.name,
            properties: Object.assign(Object.assign({}, options.defaultProperties), data.properties),
            type: `${type}Data`,
            ver: 2
        }
    );
    if (!options.batchDelay) {
        await sendTelemetry();
    } else if (!sendTimeout) {
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
