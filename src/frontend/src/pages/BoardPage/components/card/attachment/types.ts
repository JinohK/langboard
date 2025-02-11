import { ProjectCardAttachment } from "@/core/models";

export interface IBaseBoardCardAttachmentMoreProps {
    attachment: ProjectCardAttachment.TModel;
    isValidating: bool;
    setIsValidating: (value: bool) => void;
    setIsMoreMenuOpened: (value: bool) => void;
}
