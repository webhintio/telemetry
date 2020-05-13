import { AzureFunction, Context, HttpRequest } from '@azure/functions';

export const run: AzureFunction = async (context: Context, req: HttpRequest): Promise<void> => {
    context.log('Processing telemetry log request');

    context.done();
};