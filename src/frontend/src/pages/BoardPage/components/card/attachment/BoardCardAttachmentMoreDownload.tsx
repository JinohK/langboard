import { DropdownMenu, Toast } from "@/components/base";
import useDownloadFile from "@/core/hooks/useDownloadFile";
import { IBaseBoardCardAttachmentMoreProps } from "@/pages/BoardPage/components/card/attachment/types";
import { useTranslation } from "react-i18next";

export interface IBoardCardAttachmentMoreDownloadProps extends Pick<IBaseBoardCardAttachmentMoreProps, "attachment" | "setIsMoreMenuOpened"> {}

function BoardCardAttachmentMoreDownload({ attachment, setIsMoreMenuOpened }: IBoardCardAttachmentMoreDownloadProps): JSX.Element {
    const [t] = useTranslation();
    const name = attachment.useField("name");
    const url = attachment.useField("url");
    const { download, isDownloading } = useDownloadFile({
        url: url,
        filename: name,
        onError: () => {
            Toast.Add.error(t("errors.Download failed."));
        },
        onFinally: () => {
            setIsMoreMenuOpened(false);
        },
    });

    return (
        <DropdownMenu.Item
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                download();
            }}
            disabled={isDownloading}
        >
            {t("card.Download")}
        </DropdownMenu.Item>
    );
}

export default BoardCardAttachmentMoreDownload;
