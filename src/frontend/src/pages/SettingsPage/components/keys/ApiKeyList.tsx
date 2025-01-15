import { Checkbox, Flex, Loading, ScrollArea, Table } from "@/components/base";
import InfiniteScroller from "@/components/InfiniteScroller";
import useInfiniteScrollPager from "@/core/hooks/useInfiniteScrollPager";
import { AppSettingModel } from "@/core/models";
import { ESettingType } from "@/core/models/AppSettingModel";
import { cn } from "@/core/utils/ComponentUtils";
import { createShortUUID } from "@/core/utils/StringUtils";
import ApiKeyRow from "@/pages/SettingsPage/components/keys/ApiKeyRow";
import { useReducer } from "react";
import { useTranslation } from "react-i18next";

export interface IApiKeysListProps {
    selectedKeys: string[];
    setSelectedKeys: React.Dispatch<React.SetStateAction<string[]>>;
}

function ApiKeysList({ selectedKeys, setSelectedKeys }: IApiKeysListProps) {
    const [t] = useTranslation();
    const updater = useReducer((x) => x + 1, 0);
    const apiKeys = AppSettingModel.Model.useModels((model) => model.setting_type === ESettingType.ApiKey);
    const PAGE_SIZE = 30;
    const { items: keys, nextPage, hasMore } = useInfiniteScrollPager({ allItems: apiKeys, size: PAGE_SIZE, updater });
    const listId = "settings-api-keys-list";

    const selectAll = () => {
        setSelectedKeys((prev) => {
            if (prev.length === keys.length) {
                return [];
            } else {
                return keys.map((key) => key.uid);
            }
        });
    };

    return (
        <>
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        <Table.Head className="w-12 px-0 text-center">
                            <Checkbox checked={!!keys.length && keys.length === selectedKeys.length} onClick={selectAll} />
                        </Table.Head>
                        <Table.Head className="text-center" title={t("settings.Name")}>
                            {t("settings.Name")}
                        </Table.Head>
                        <Table.Head className="w-1/6 text-center" title={t("settings.Key")}>
                            {t("settings.Key")}
                        </Table.Head>
                        <Table.Head className="w-1/6 text-center" title={t("settings.Created")}>
                            {t("settings.Created")}
                        </Table.Head>
                        <Table.Head className="w-1/6 text-center" title={t("settings.Last Used")}>
                            {t("settings.Last Used")}
                        </Table.Head>
                        <Table.Head className="w-1/6 text-center" title={t("settings.Total Uses")}>
                            {t("settings.Total Uses")}
                        </Table.Head>
                    </Table.Row>
                </Table.Header>
            </Table.Root>
            <ScrollArea.Root viewportId={listId} mutable={keys}>
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
                            {keys.map((key) => (
                                <ApiKeyRow key={key.uid} apiKey={key} selectedKeys={selectedKeys} setSelectedKeys={setSelectedKeys} />
                            ))}
                        </Table.Body>
                    </Table.Root>
                </InfiniteScroller>
            </ScrollArea.Root>
        </>
    );
}

export default ApiKeysList;
