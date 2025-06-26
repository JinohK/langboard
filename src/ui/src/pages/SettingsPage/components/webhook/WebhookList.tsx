import { Checkbox, Flex, Loading, ScrollArea, Table } from "@/components/base";
import InfiniteScroller from "@/components/InfiniteScroller";
import useInfiniteScrollPager from "@/core/hooks/useInfiniteScrollPager";
import { AppSettingModel } from "@/core/models";
import { ESettingType } from "@/core/models/AppSettingModel";
import { cn } from "@/core/utils/ComponentUtils";
import { createShortUUID } from "@/core/utils/StringUtils";
import WebhookRow from "@/pages/SettingsPage/components/webhook/WebhookRow";
import { useReducer } from "react";
import { useTranslation } from "react-i18next";

export interface IWebhookListProps {
    selectedWebhooks: string[];
    setSelectedWebhooks: React.Dispatch<React.SetStateAction<string[]>>;
}

function WebhookList({ selectedWebhooks, setSelectedWebhooks }: IWebhookListProps) {
    const [t] = useTranslation();
    const updater = useReducer((x) => x + 1, 0);
    const webhooks = AppSettingModel.Model.useModels((model) => model.setting_type === ESettingType.WebhookUrl);
    const PAGE_SIZE = 30;
    const { items: urls, nextPage, hasMore } = useInfiniteScrollPager({ allItems: webhooks, size: PAGE_SIZE, updater });
    const listId = "settings-webhook-url-list";

    const selectAll = () => {
        setSelectedWebhooks((prev) => {
            if (prev.length === urls.length) {
                return [];
            } else {
                return urls.map((url) => url.uid);
            }
        });
    };

    return (
        <>
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        <Table.Head className="w-12 text-center">
                            <Checkbox checked={!!urls.length && urls.length === selectedWebhooks.length} onClick={selectAll} />
                        </Table.Head>
                        <Table.Head className="w-1/6 text-center" title={t("settings.Name")}>
                            {t("settings.Name")}
                        </Table.Head>
                        <Table.Head className="text-center" title={t("settings.URL")}>
                            {t("settings.URL")}
                        </Table.Head>
                        <Table.Head className="w-1/6 text-center" title={t("settings.Created")}>
                            {t("settings.Created")}
                        </Table.Head>
                        <Table.Head className="w-1/6 text-center" title={t("settings.Last Used")}>
                            {t("settings.Last Used")}
                        </Table.Head>
                    </Table.Row>
                </Table.Header>
            </Table.Root>
            <ScrollArea.Root viewportId={listId} mutable={urls}>
                <InfiniteScroller.NoVirtual
                    scrollable={() => document.getElementById(listId)}
                    loadMore={nextPage}
                    hasMore={hasMore}
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
                            {urls.map((url) => (
                                <WebhookRow key={url.uid} url={url} selectedWebhooks={selectedWebhooks} setSelectedWebhooks={setSelectedWebhooks} />
                            ))}
                        </Table.Body>
                    </Table.Root>
                </InfiniteScroller.NoVirtual>
            </ScrollArea.Root>
        </>
    );
}

export default WebhookList;
