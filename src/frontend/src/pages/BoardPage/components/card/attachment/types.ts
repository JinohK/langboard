import { ProjectCardAttachment } from "@/core/models";

export interface IBaseBoardCardAttachmentMoreProps {
    attachment: ProjectCardAttachment.IBoard;
    isValidating: bool;
    setIsValidating: (value: bool) => void;
    setIsMoreMenuOpened: (value: bool) => void;
}
