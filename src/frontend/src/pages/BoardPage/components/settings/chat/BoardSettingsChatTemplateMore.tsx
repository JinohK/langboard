import { Button, DropdownMenu, IconComponent } from "@/components/base";
import { ChatTemplateModel } from "@/core/models";
import BoardSettingsChatTemplateMoreDelete from "@/pages/BoardPage/components/settings/chat/BoardSettingsChatTemplateMoreDelete";
import BoardSettingsChatTemplateMoreEditDialog from "@/pages/BoardPage/components/settings/chat/BoardSettingsChatTemplateMoreEditDialog";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardSettingsChatTemplateMoreProps {
    chatTemplate: ChatTemplateModel.TModel;
}

function BoardSettingsChatTemplateMore({ chatTemplate }: IBoardSettingsChatTemplateMoreProps): JSX.Element {
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);

    return (
        <DropdownMenu.Root modal={false} open={isOpened} onOpenChange={setIsOpened}>
            <DropdownMenu.Trigger asChild>
                <Button type="button" variant="ghost" size="icon-sm" className="h-8 w-5 sm:size-8" title={t("common.More")}>
                    <IconComponent icon="ellipsis-vertical" size="4" />
                </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
                <DropdownMenu.Group>
                    <BoardSettingsChatTemplateMoreEditDialog chatTemplate={chatTemplate} setIsMoreMenuOpened={setIsOpened} />
                    <BoardSettingsChatTemplateMoreDelete chatTemplate={chatTemplate} setIsMoreMenuOpened={setIsOpened} />
                </DropdownMenu.Group>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}

export default BoardSettingsChatTemplateMore;
