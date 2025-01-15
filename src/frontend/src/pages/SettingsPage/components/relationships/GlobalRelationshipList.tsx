import { Checkbox, Flex, Loading, ScrollArea, Table } from "@/components/base";
import InfiniteScroller from "@/components/InfiniteScroller";
import useInfiniteScrollPager from "@/core/hooks/useInfiniteScrollPager";
import { GlobalRelationshipType } from "@/core/models";
import { cn } from "@/core/utils/ComponentUtils";
import { createShortUUID } from "@/core/utils/StringUtils";
import GlobalRelationshipRow from "@/pages/SettingsPage/components/relationships/GlobalRelationshipRow";
import { useReducer } from "react";
import { useTranslation } from "react-i18next";

export interface IGlobalRelationshipListProps {
    selectedGlobalRelationships: string[];
    setSelectedGlobalRelationships: React.Dispatch<React.SetStateAction<string[]>>;
}

function GlobalRelationshipList({ selectedGlobalRelationships, setSelectedGlobalRelationships }: IGlobalRelationshipListProps) {
    const [t] = useTranslation();
    const updater = useReducer((x) => x + 1, 0);
    const globalRelationships = GlobalRelationshipType.Model.useModels(() => true);
    const PAGE_SIZE = 30;
    const { items: relationships, nextPage, hasMore } = useInfiniteScrollPager({ allItems: globalRelationships, size: PAGE_SIZE, updater });
    const listId = "settings-global-relationships-list";

    const selectAll = () => {
        setSelectedGlobalRelationships((prev) => {
            if (prev.length === relationships.length) {
                return [];
            } else {
                return relationships.map((relationship) => relationship.uid);
            }
        });
    };

    return (
        <>
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        <Table.Head className="w-12 px-0 text-center">
                            <Checkbox
                                checked={!!relationships.length && relationships.length === selectedGlobalRelationships.length}
                                onClick={selectAll}
                            />
                        </Table.Head>
                        <Table.Head className="w-1/6 text-center" title={t("settings.Parent name")}>
                            {t("settings.Parent name")}
                        </Table.Head>
                        <Table.Head className="w-1/6 text-center" title={t("settings.Child name")}>
                            {t("settings.Child name")}
                        </Table.Head>
                        <Table.Head className="text-center" title={t("settings.Description")}>
                            {t("settings.Description")}
                        </Table.Head>
                    </Table.Row>
                </Table.Header>
            </Table.Root>
            <ScrollArea.Root viewportId={listId} mutable={relationships}>
                <InfiniteScroller
                    scrollable={() => document.getElementById(listId)}
                    loadMore={nextPage}
                    hasMore={hasMore}
                    threshold={30}
                    loader={
                        <Flex justify="center" py="6" key={createShortUUID()}>
                            <Loading variant="secondary" />
                        </Flex>
                    }
                    className={cn(
                        "max-h-[calc(100vh_-_theme(spacing.52))]",
                        "md:max-h-[calc(100vh_-_theme(spacing.56))]",
                        "lg:max-h-[calc(100vh_-_theme(spacing.60))]"
                    )}
                >
                    <Table.Root>
                        <Table.Body>
                            {relationships.map((relationship) => (
                                <GlobalRelationshipRow
                                    key={relationship.uid}
                                    globalRelationship={relationship}
                                    selectedGlobalRelationships={selectedGlobalRelationships}
                                    setSelectedGlobalRelationships={setSelectedGlobalRelationships}
                                />
                            ))}
                        </Table.Body>
                    </Table.Root>
                </InfiniteScroller>
            </ScrollArea.Root>
        </>
    );
}

export default GlobalRelationshipList;
