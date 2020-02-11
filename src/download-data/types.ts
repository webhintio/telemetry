export const f12DownloadEvent = 'f12-downloads';

export type Browser = 'Chrome' | 'Edge' | 'Firefox';

export type DownloadData = {
    browser: Browser;
    count: number;
    date: Date;
}

export type FirefoxDownloads = {
    count: number;
    date: string;
};

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
