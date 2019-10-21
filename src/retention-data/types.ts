type AICustomEvent = {
    name: string;
}

export type RetentionData = {
    date: string | Date;
    oneDay: number;
    twoDays: number;
}

export type ActivityData = {
    'extension-version': string;
    lastUpdated: Date;
    last28Days: string;
    redundant?: boolean;
}

export type AIValue = {
    count: number;
    customDimensions: ActivityData;
    customEvent: AICustomEvent;
    id: string;
    timestamp: string;
    type: string;
}

type AIResponseColumn = {
    name: string;
    type: string;
}

type AIResponseRow = (string | null)[];

type AIResponseTable = {
    columns: AIResponseColumn[];
    name: string;
    rows: AIResponseRow[];
}

export type AIResponseQuery = {
    tables: AIResponseTable[];
}
