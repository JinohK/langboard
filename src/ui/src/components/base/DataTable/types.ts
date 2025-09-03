/* eslint-disable @typescript-eslint/no-explicit-any */

export type TDataTableColumn<T> = {
    key: keyof T;
    header: string | React.ReactNode | ((allRows: T[]) => React.ReactNode);
    sortable?: bool;
    filterable?: bool;
    render?: (props: { value: any; row: T; allRows: T[] }) => React.ReactNode;
    width?: string;
    align?: "left" | "center" | "right";
};
