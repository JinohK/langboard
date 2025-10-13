import { Button, IconComponent, Input } from "@/components/base";
import { useBoardChat } from "@/core/providers/BoardChatProvider";
import { useTranslation } from "react-i18next";
import { useChatInput } from "@/pages/BoardPage/components/chat/ChatInputProvider";

function ChatInputFileUpload() {
    const { isSending } = useBoardChat();
    const { chatAttachmentRef, setFile } = useChatInput();
    const [t] = useTranslation();

    const onAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            setFile(null);
            return;
        }

        const file = e.target.files[0];
        setFile(() => file);
    };

    return (
        <>
            <Input
                type="file"
                hidden
                accept="image/*, .txt, .xls, .xlsx"
                disabled={isSending}
                onChange={onAttachmentChange}
                ref={chatAttachmentRef}
                wrapperProps={{ className: "hidden" }}
            />
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title={t("common.Upload")}
                disabled={isSending}
                titleSide="top"
                titleAlign="start"
                onClick={() => chatAttachmentRef.current?.click()}
            >
                <IconComponent icon="paperclip" size="4" />
            </Button>
        </>
    );
}

export default ChatInputFileUpload;
