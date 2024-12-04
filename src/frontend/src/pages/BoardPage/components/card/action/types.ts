export interface ISharedBoardCardActionProps {
    buttonClassName: string;
}

export interface IAttachedFile {
    key: string;
    file: File;
    order: number;
    upload?: () => Promise<void>;
}
