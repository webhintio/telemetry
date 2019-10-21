import * as applicationinsights from 'applicationinsights';

const instrumentationKey = process.env.RESULT_INSTRUMENTATION_KEY!; // eslint-disable-line no-process-env

applicationinsights.setup(instrumentationKey).start();

const appInsightsClient = applicationinsights.defaultClient;

/**
 * Send an event to Application Insights.
 * @param name - Event name.
 * @param properties - Properties to track.
 */
export const trackEvent = (name: string, properties: any = {}) => {
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
