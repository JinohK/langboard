import { Button, Checkbox, DropdownMenu, Flex, IconComponent, Input, Label, Popover, ScrollArea, Skeleton } from "@/components/base";
import UserAvatar from "@/components/UserAvatar";
import { ProjectCard } from "@/core/models";
import { IFilterMap, useBoard } from "@/core/providers/BoardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { createShortUUID } from "@/core/utils/StringUtils";
import { CheckedState } from "@radix-ui/react-checkbox";
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";

export function SkeletonBoardFilter() {
    return <Skeleton h="9" w={{ initial: "7", xs: "14" }} px={{ xs: "4" }} />;
}

function BoardFilter() {
    const { project, cards, filters, filterCard, filterMember, navigateWithFilters } = useBoard();
    const [t] = useTranslation();

    const setFilterKeyword = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (!filters.keyword) {
            filters.keyword = [];
        }

        const keyword = event.currentTarget.value;

        if (filters.keyword.includes(keyword)) {
            return;
        }

        filters.keyword = keyword.split(",");

        navigateWithFilters();
    };

    const countAppliedFilters =
        Number((filters.keyword?.length ?? 0) > 0) +
        Object.keys(filters)
            .filter((v) => v !== "keyword")
            .reduce((acc, filterName) => acc + filters[filterName as keyof IFilterMap]!.length, 0);

    const clearFilters = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        Object.keys(filters).forEach((filterName) => {
            delete filters[filterName as keyof IFilterMap];
        });
        navigateWithFilters();
    };

    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <Flex items="center">
                    <Button
                        variant="ghost"
                        className={cn("gap-1 px-2 text-xs xs:px-4 xs:text-sm", countAppliedFilters > 0 ? "rounded-e-none bg-accent/75 xs:pr-2" : "")}
                    >
                        <IconComponent icon="filter" size={{ initial: "3", xs: "4" }} />
                        <span className="hidden xs:inline-block">{t("board.Filters")}</span>
                        {countAppliedFilters > 0 && <span className="pb-1 xs:pb-0.5">{` (${countAppliedFilters})`}</span>}
                    </Button>
                    {countAppliedFilters > 0 && (
                        <Button variant="ghost" className="rounded-s-none bg-accent/75 px-2 py-1 text-xs xs:pr-4 xs:text-sm" onClick={clearFilters}>
                            <span className="pb-0.5 xs:pb-0">{t("board.filters.Clear")}</span>
                        </Button>
                    )}
                </Flex>
            </Popover.Trigger>
            <Popover.Content align="end" className="max-w-[calc(var(--radix-popper-available-width)_-_theme(spacing.4))]">
                <ScrollArea.Root>
                    <Flex direction="col" gap="4" className="max-h-[calc(100vh_-_theme(spacing.40))]">
                        <Label display="block">
                            <span>{t("board.filters.Keyword")}</span>
                            <Input
                                className="mx-1 mt-2 w-[calc(100%_-_theme(spacing.2))]"
                                defaultValue={filters.keyword?.join(",")}
                                onKeyUp={setFilterKeyword}
                            />
                        </Label>
                        <Flex direction="col">
                            <Label>{t("board.filters.Members")}</Label>
                            <Flex direction="col" pt="1">
                                <BoardFilterItem name="members" value="none">
                                    <span>{t("board.filters.No members assigned")}</span>
                                </BoardFilterItem>
                                <BoardFilterItem name="members" value="me">
                                    <span>{t("board.filters.Assigned to me")}</span>
                                </BoardFilterItem>
                                <BoardExtendedFilter
                                    filterLangLabel="Select members"
                                    uncountableItems={["none", "me"]}
                                    filterName="members"
                                    createFilterItems={() =>
                                        project.members
                                            .filter((member) => filterMember(member))
                                            .map((member) => (
                                                <BoardFilterItem key={createShortUUID()} name="members" value={member.email}>
                                                    <UserAvatar.Root user={member} withName avatarSize="xs" labelClassName="gap-1" />
                                                </BoardFilterItem>
                                            ))
                                    }
                                />
                            </Flex>
                        </Flex>
                        {(["parents", "children"] as (keyof IFilterMap)[]).map((relationship) => (
                            <Flex direction="col" key={`board-filter-${relationship}`}>
                                <Label>{t(`board.filters.labels.${relationship}`)}</Label>
                                <BoardExtendedFilter
                                    filterLangLabel="Select cards"
                                    filterName={relationship}
                                    createFilterItems={() =>
                                        cards
                                            .filter(
                                                (card) => card.relationships[relationship as keyof ProjectCard.IBoard["relationships"]].length > 0
                                            )
                                            .filter((card) => filterCard(card))
                                            .map((card) => (
                                                <BoardFilterItem key={createShortUUID()} name={relationship} value={card.uid}>
                                                    <span>{card.title}</span>
                                                </BoardFilterItem>
                                            ))
                                    }
                                />
                            </Flex>
                        ))}
                    </Flex>
                </ScrollArea.Root>
            </Popover.Content>
        </Popover.Root>
    );
}

interface IBoardFilterExtendedProps {
    filterLangLabel: string;
    uncountableItems?: string[];
    filterName: keyof IFilterMap;
    createFilterItems: () => React.ReactNode;
}

const BoardExtendedFilter = memo(({ filterLangLabel, uncountableItems, filterName, createFilterItems }: IBoardFilterExtendedProps) => {
    const { filters, navigateWithFilters } = useBoard();
    const [t] = useTranslation();

    const countSelections = filters[filterName]?.filter((v) => !(uncountableItems ?? []).includes(v)).length ?? 0;

    const clearSelection = () => {
        filters[filterName] = [];

        navigateWithFilters();
    };

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <Button
                    variant="ghost"
                    className={cn("group/extension mt-1 justify-between rounded-none p-3", countSelections > 0 ? "bg-accent/75" : "")}
                >
                    <span>
                        {t(`board.filters.${filterLangLabel}`)}
                        {countSelections > 0 && ` (${countSelections})`}
                    </span>
                    <IconComponent
                        icon="chevron-down"
                        size="4"
                        className="transition-transform duration-200 group-data-[state=open]/extension:rotate-180"
                    />
                </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="start" className="flex flex-col gap-2 p-0">
                <ScrollArea.Root>
                    <Flex direction="col" pr="2.5" position="relative" maxH="64" minW="56">
                        {createFilterItems()}
                        {countSelections > 0 && (
                            <Button
                                variant="ghost"
                                className="sticky bottom-0 left-0 z-10 w-[calc(100%_+_theme(spacing.2))] rounded-none bg-background p-3"
                                onClick={clearSelection}
                            >
                                {t("board.filters.Clear selections")}
                            </Button>
                        )}
                    </Flex>
                </ScrollArea.Root>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
});

interface IBoardFilterItemProps {
    name: keyof IFilterMap;
    value: string;
    children: React.ReactNode;
}

const BoardFilterItem = memo(({ name, value, children }: IBoardFilterItemProps) => {
    const { filters, navigateWithFilters } = useBoard();
    const checked = useMemo(() => !!filters[name] && filters[name].includes(value), [filters, filters[name]]);

    const setFilterCards = (checked: CheckedState) => {
        if (!filters[name]) {
            filters[name] = [];
        }

        if (checked) {
            filters[name].push(value);
        } else {
            filters[name] = filters[name].filter((filter) => filter !== value);
        }

        navigateWithFilters();
    };

    return (
        <Label display="flex" cursor="pointer" items="center" gap="2" p="3" className="hover:bg-accent">
            <Checkbox name={name} checked={checked} onCheckedChange={setFilterCards} />
            {children}
        </Label>
    );
});

export default BoardFilter;
