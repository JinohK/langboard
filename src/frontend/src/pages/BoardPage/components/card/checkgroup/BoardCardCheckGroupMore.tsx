import { Button, DropdownMenu, IconComponent } from "@/components/base";
import { useBoardCardCheckGroup } from "@/core/providers/BoardCardCheckGroupProvider";
import BoardCardCheckGroupMoreDelete from "@/pages/BoardPage/components/card/checkgroup/BoardCardCheckGroupMoreDelete";
import BoardCardCheckGroupMoreEdit from "@/pages/BoardPage/components/card/checkgroup/BoardCardCheckGroupMoreEdit";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function BoardCardCheckGroupMore(): JSX.Element {
    const { isValidating } = useBoardCardCheckGroup();
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
                <BoardCardCheckGroupMoreEdit setIsMoreMenuOpened={setIsOpened} />
                <BoardCardCheckGroupMoreDelete setIsMoreMenuOpened={setIsOpened} />
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}

export default BoardCardCheckGroupMore;
