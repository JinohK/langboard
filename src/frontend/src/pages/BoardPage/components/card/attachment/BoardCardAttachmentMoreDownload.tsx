import { DropdownMenu } from "@/components/base";
import { IBaseBoardCardAttachmentMoreProps } from "@/pages/BoardPage/components/card/attachment/types";
import { useTranslation } from "react-i18next";

export interface IBoardCardAttachmentMoreDownloadProps extends Pick<IBaseBoardCardAttachmentMoreProps, "attachment" | "setIsMoreMenuOpened"> {}

function BoardCardAttachmentMoreDownload({ attachment, setIsMoreMenuOpened }: IBoardCardAttachmentMoreDownloadProps): JSX.Element {
    const [t] = useTranslation();
    const url = attachment.useField("url");

    const download = () => {
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.download = attachment.name;
        link.click();
        setIsMoreMenuOpened(false);
    };

    return (
        <DropdownMenu.Item
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                download();
            }}
        >
            {t("card.Download")}
        </DropdownMenu.Item>
    );
}

export default BoardCardAttachmentMoreDownload;
