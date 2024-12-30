import { Button, DropdownMenu, IconComponent } from "@/components/base";
import { useBoardSettingsLabel } from "@/core/providers/BoardSettingsLabelProvider";
import BoardSettingsLabelMoreChangeDescription from "@/pages/BoardPage/components/settings/label/BoardSettingsLabelMoreChangeDescription";
import BoardSettingsLabelMoreDelete from "@/pages/BoardPage/components/settings/label/BoardSettingsLabelMoreDelete";
import BoardSettingsLabelMoreRename from "@/pages/BoardPage/components/settings/label/BoardSettingsLabelMoreRename";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function BoardSettingsLabelMore(): JSX.Element {
    const { isValidating } = useBoardSettingsLabel();
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);

    return (
        <DropdownMenu.Root
            modal={false}
            open={isOpened}
            onOpenChange={(opened) => {
                if (isValidating) {
                    return;
                }
                setIsOpened(opened);
            }}
        >
            <DropdownMenu.Trigger asChild>
                <Button type="button" variant="ghost" size="icon-sm" className="h-8 w-5 sm:size-8" title={t("common.More")}>
                    <IconComponent icon="ellipsis-vertical" size="4" />
                </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
                <DropdownMenu.Group>
                    <BoardSettingsLabelMoreRename setIsMoreMenuOpened={setIsOpened} />
                    <BoardSettingsLabelMoreChangeDescription setIsMoreMenuOpened={setIsOpened} />
                    <BoardSettingsLabelMoreDelete setIsMoreMenuOpened={setIsOpened} />
                </DropdownMenu.Group>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}

export default BoardSettingsLabelMore;
