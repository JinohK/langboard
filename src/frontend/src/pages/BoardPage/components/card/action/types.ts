export interface ISharedBoardCardActionProps {
    buttonClassName: string;
}

export interface IAttachedFile {
    uid: string;
    file: File;
    order: number;
    upload?: () => Promise<void>;
}
