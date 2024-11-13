import { Button, Checkbox, DropdownMenu, Flex, IconComponent, Input, Label, Popover, ScrollArea } from "@/components/base";
import UserAvatar from "@/components/UserAvatar";
import { IBoardTask } from "@/controllers/board/useGetTasks";
import { IBoardProject } from "@/controllers/board/useProjectAvailable";
import { cn } from "@/core/utils/ComponentUtils";
import { createShortUUID } from "@/core/utils/StringUtils";
import { filterMember, filterTask, IFilterMap, navigateFilters } from "@/pages/BoardPage/components/boardFilterUtils";
import { CheckedState } from "@radix-ui/react-checkbox";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export interface IBoardFilterProps {
    members: IBoardProject["members"];
    tasks: IBoardTask[];
    filters: IFilterMap;
}

function BoardFilter({ members, tasks, filters }: IBoardFilterProps) {
    const [t] = useTranslation();
    const navigate = useNavigate();

    const setFilterKeyword = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (!filters.keyword) {
            filters.keyword = [];
        }

        const keyword = event.currentTarget.value;

        if (filters.keyword.includes(keyword)) {
            return;
        }

        filters.keyword = keyword.split(",");

        navigateFilters(navigate, filters);
    };

    const countAppliedFilters =
        Number((filters.keyword?.length ?? 0) > 0) +
        Object.keys(filters)
            .filter((v) => v !== "keyword")
            .reduce((acc, filterName) => acc + filters[filterName as keyof IFilterMap]!.length, 0);

    const clearFilters = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        navigateFilters(navigate, {});
    };

    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <Flex items="center">
                    <Button variant="ghost" className={cn("gap-1", countAppliedFilters > 0 ? "rounded-e-none bg-accent/75 pr-2" : "")}>
                        <IconComponent icon="filter" size="4" />
                        <span>
                            {t("board.Filters")}
                            {countAppliedFilters > 0 && ` (${countAppliedFilters})`}
                        </span>
                    </Button>
                    {countAppliedFilters > 0 && (
                        <Button variant="ghost" className="rounded-s-none bg-accent/75 p-1 pl-2 pr-4" onClick={clearFilters}>
                            {t("board.filters.Clear")}
                        </Button>
                    )}
                </Flex>
            </Popover.Trigger>
            <Popover.Content
                align="end"
                className="max-xs:sticky max-xs:left-0 max-xs:top-0 max-xs:h-[calc(100vh_-_theme(spacing.32))] max-xs:w-screen"
            >
                <ScrollArea.Root>
                    <Flex direction="col" gap="4" className="max-h-[calc(100vh_-_theme(spacing.40))]">
                        <Label className="block">
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
                                <BoardFilterItem filters={filters} name="members" value="none">
                                    <span>{t("board.filters.No members assigned")}</span>
                                </BoardFilterItem>
                                <BoardFilterItem filters={filters} name="members" value="me">
                                    <span>{t("board.filters.Assigned to me")}</span>
                                </BoardFilterItem>
                                <BoardExtendedFilter
                                    filterLangLabel="Select members"
                                    uncountableItems={["none", "me"]}
                                    filterName="members"
                                    filters={filters}
                                    createFilterItems={() =>
                                        members
                                            .filter((member) => filterMember(filters, member))
                                            .map((member) => (
                                                <BoardFilterItem key={createShortUUID()} filters={filters} name="members" value={member.email}>
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
                                    filterLangLabel="Select tasks"
                                    filterName={relationship}
                                    filters={filters}
                                    createFilterItems={() =>
                                        tasks
                                            .filter((task) => task.relationships[relationship as keyof IBoardTask["relationships"]].length > 0)
                                            .filter((task) => filterTask(filters, task))
                                            .map((task) => (
                                                <BoardFilterItem key={createShortUUID()} filters={filters} name={relationship} value={task.uid}>
                                                    <span>{task.title}</span>
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
    filters: IFilterMap;
    createFilterItems: () => React.ReactNode;
}

const BoardExtendedFilter = memo(({ filterLangLabel, uncountableItems, filterName, filters, createFilterItems }: IBoardFilterExtendedProps) => {
    const [t] = useTranslation();
    const navigate = useNavigate();

    const countSelections = filters[filterName]?.filter((v) => !(uncountableItems ?? []).includes(v)).length ?? 0;

    const clearSelection = () => {
        filters[filterName] = [];

        navigateFilters(navigate, filters);
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
                    <Flex direction="col" pr="2.5" className="relative max-h-64 min-w-56">
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
    filters: IFilterMap;
    name: keyof IFilterMap;
    value: string;
    children: React.ReactNode;
}

const BoardFilterItem = memo(({ filters, name, value, children }: IBoardFilterItemProps) => {
    const navigate = useNavigate();
    const defaultChecked = filters[name] && filters[name].includes(value);

    const setFilterTasks = (checked: CheckedState) => {
        if (!filters[name]) {
            filters[name] = [];
        }

        if (checked) {
            filters[name].push(value);
        } else {
            filters[name] = filters[name].filter((filter) => filter !== value);
        }

        navigateFilters(navigate, filters);
    };

    return (
        <Label className="flex cursor-pointer items-center gap-2 p-3 hover:bg-accent">
            <Checkbox name={name} defaultChecked={defaultChecked} onCheckedChange={setFilterTasks} />
            {children}
        </Label>
    );
});

export default BoardFilter;
