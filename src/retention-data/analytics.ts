import * as applicationinsights from 'applicationinsights';

const instrumentationKey = process.env.RESULT_INSTRUMENTATION_KEY!; // eslint-disable-line no-process-env

applicationinsights.setup(instrumentationKey).start();

const appInisghtClient = applicationinsights.defaultClient;

export const trackEvent = (name: string, properties: any = {}) => {
    appInisghtClient.trackEvent({
        name,
        properties
    });
};

export const sendPendingData = () => {
    return new Promise((resolve) => {
        appInisghtClient.flush({
            callback: () => {
                return resolve();
            }
        });
    });
};
