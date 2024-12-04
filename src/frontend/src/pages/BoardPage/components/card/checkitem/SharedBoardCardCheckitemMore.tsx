import { Button, DropdownMenu, IconComponent } from "@/components/base";
import { useBoardCardCheckitem } from "@/core/providers/BoardCardCheckitemProvider";
import SharedBoardCardCheckitemAddSub from "@/pages/BoardPage/components/card/checkitem/SharedBoardCardCheckitemAddSub";
import SharedBoardCardCheckitemMoreCardify from "@/pages/BoardPage/components/card/checkitem/SharedBoardCardCheckitemMoreCardify";
import SharedBoardCardCheckitemMoreDelete from "@/pages/BoardPage/components/card/checkitem/SharedBoardCardCheckitemMoreDelete";
import SharedBoardCardCheckitemMoreEdit from "@/pages/BoardPage/components/card/checkitem/SharedBoardCardCheckitemMoreEdit";
import SharedBoardCardCheckitemMoreTimer from "@/pages/BoardPage/components/card/checkitem/SharedBoardCardCheckitemMoreTimer";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function SharedBoardCardCheckitemMore(): JSX.Element {
    const { checkitem, isValidating } = useBoardCardCheckitem();
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
                <SharedBoardCardCheckitemAddSub fromDropdown setIsMoreMenuOpened={setIsOpened} />
                <SharedBoardCardCheckitemMoreEdit setIsMoreMenuOpened={setIsOpened} />
                <SharedBoardCardCheckitemMoreTimer setIsMoreMenuOpened={setIsOpened} />
                {!checkitem.cardified_uid && <SharedBoardCardCheckitemMoreCardify setIsMoreMenuOpened={setIsOpened} />}
                <SharedBoardCardCheckitemMoreDelete setIsMoreMenuOpened={setIsOpened} />
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}

export default SharedBoardCardCheckitemMore;
