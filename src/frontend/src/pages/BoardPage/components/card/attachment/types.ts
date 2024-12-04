import { IBoardCardAttachment } from "@/controllers/api/card/useGetCardDetails";

export interface IBaseBoardCardAttachmentMoreProps {
    attachment: IBoardCardAttachment;
    isValidating: bool;
    setIsValidating: (value: bool) => void;
    setIsMoreMenuOpened: (value: bool) => void;
}
