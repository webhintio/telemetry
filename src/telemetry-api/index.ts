import { AzureFunction, Context, HttpRequest } from '@azure/functions';

import { sendPendingData, addToAppInsights } from '../common/analytics';

export const run: AzureFunction = async (context: Context, req: HttpRequest): Promise<void> => {
    const telemetryQueue = req.body.data || req.body;

    context.log('Processing telemetry log request');

    if (!Array.isArray(telemetryQueue)) {
        context.res = {
            body: 'Invalid request',
            status: 400
        };
        context.done();

        return;
    }

    try {
        for (const telemetry of telemetryQueue) {
            addToAppInsights(telemetry.data.name, telemetry.data.properties, telemetry.data.measurements, new Date(telemetry.time));
        }

        await sendPendingData();

        context.res = {
            body: 'Request completed successfully',
            status: 200
        };
    } catch (err) {
        context.res = {
            body: 'Error logging telemetry',
            status: 500
        };
        throw err;
    }

    context.done();
};
