import { Button, DropdownMenu, IconComponent } from "@/components/base";
import { useBoardCardChecklist } from "@/core/providers/BoardCardChecklistProvider";
import BoardCardChecklistMoreDelete from "@/pages/BoardPage/components/card/checklist/BoardCardChecklistMoreDelete";
import BoardCardChecklistMoreEdit from "@/pages/BoardPage/components/card/checklist/BoardCardChecklistMoreEdit";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function BoardCardChecklistMore(): JSX.Element {
    const { isValidating } = useBoardCardChecklist();
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);

    const changeOpenedState = (opened: bool) => {
        if (isValidating) {
            return;
        }
        setIsOpened(opened);
    };

    return (
        <DropdownMenu.Root modal={false} open={isOpened} onOpenChange={changeOpenedState}>
            <DropdownMenu.Trigger asChild>
                <Button type="button" variant="ghost" size="icon-sm" className="h-8 w-5 sm:size-8" title={t("common.More")}>
                    <IconComponent icon="ellipsis-vertical" size="4" />
                </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
                <BoardCardChecklistMoreEdit setIsMoreMenuOpened={setIsOpened} />
                <BoardCardChecklistMoreDelete setIsMoreMenuOpened={setIsOpened} />
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}

export default BoardCardChecklistMore;
