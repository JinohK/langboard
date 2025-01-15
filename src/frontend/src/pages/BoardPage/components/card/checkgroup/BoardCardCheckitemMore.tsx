import { Button, DropdownMenu, IconComponent } from "@/components/base";
import { useBoardCardCheckitem } from "@/core/providers/BoardCardCheckitemProvider";
import BoardCardCheckitemMoreCardify from "@/pages/BoardPage/components/card/checkgroup/BoardCardCheckitemMoreCardify";
import BoardCardCheckitemMoreDelete from "@/pages/BoardPage/components/card/checkgroup/BoardCardCheckitemMoreDelete";
import BoardCardCheckitemMoreEdit from "@/pages/BoardPage/components/card/checkgroup/BoardCardCheckitemMoreEdit";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ProjectCard } from "@/core/models";

function BoardCardCheckitemMore(): JSX.Element {
    const { checkitem, isValidating } = useBoardCardCheckitem();
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const cardifieidCards = checkitem.useForeignField<ProjectCard.TModel>("cardified_card");

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
                <BoardCardCheckitemMoreEdit setIsMoreMenuOpened={setIsOpened} />
                {!cardifieidCards.length && <BoardCardCheckitemMoreCardify setIsMoreMenuOpened={setIsOpened} />}
                <BoardCardCheckitemMoreDelete setIsMoreMenuOpened={setIsOpened} />
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}

export default BoardCardCheckitemMore;
