export interface ISharedBoardCardActionProps {
    buttonClassName: string;
}

export interface IAttachedFile {
    uid: string;
    file: File;
    upload?: () => Promise<string | undefined>;
}
