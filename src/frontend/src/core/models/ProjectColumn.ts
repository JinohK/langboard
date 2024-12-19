export interface Interface {
    uid: string;
    name: string;
    order: number;
}

export interface IDashboard extends Interface {
    count: number;
}

export const TYPES = ["SI", "SW"];
