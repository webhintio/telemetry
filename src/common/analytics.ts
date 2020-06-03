import * as applicationinsights from 'applicationinsights';

const instrumentationKey = process.env.RESULT_INSTRUMENTATION_KEY!; // eslint-disable-line no-process-env

applicationinsights.setup(instrumentationKey).start();

const appInsightsClient = applicationinsights.defaultClient;

const telemetryApiEndpoint = 'https://webhint-telemetry.azurewebsites.net/api/log';
    let sendTimeout: any = null;
    let telemetryQueue: any = [];
    let options = {
        batchDelay: 15000,
        defaultProperties: {},
    };

const post = async (url: string, data: any) => {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: data
    });
    return response;
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
        post(telemetryApiEndpoint, data)
            .then(response => {
                if (response.status !== 200) {
                    console.warn('Failed to send telemetry: ', status);
                }
            });
    }
    catch (err) {
        console.warn('Failed to send telemetry: ', err);
    }
};

const addToQueue = async (type: string, data: any) => {
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
    await addToQueue('Event', { name, properties });
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
