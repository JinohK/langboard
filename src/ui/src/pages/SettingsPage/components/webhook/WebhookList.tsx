import { Box, Button, Checkbox, Flex, IconComponent, Loading } from "@/components/base";
import InfiniteScroller from "@/components/InfiniteScroller";
import useInfiniteScrollPager from "@/core/hooks/useInfiniteScrollPager";
import useScrollToTop from "@/core/hooks/useScrollToTop";
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
    const { scrollableRef, isAtTop, scrollToTop } = useScrollToTop({});
    const updater = useReducer((x) => x + 1, 0);
    const webhooks = AppSettingModel.Model.useModels((model) => model.setting_type === ESettingType.WebhookUrl);
    const PAGE_SIZE = 30;
    const { items: urls, nextPage, hasMore } = useInfiniteScrollPager({ allItems: webhooks, size: PAGE_SIZE, updater });

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
        <Box position="relative" h="full">
            <Box
                className={cn(
                    "max-h-[calc(100vh_-_theme(spacing.40))]",
                    "md:max-h-[calc(100vh_-_theme(spacing.44))]",
                    "lg:max-h-[calc(100vh_-_theme(spacing.48))]",
                    "overflow-y-auto"
                )}
                ref={scrollableRef}
            >
                <InfiniteScroller.Table.Default
                    columns={[
                        {
                            name: <Checkbox checked={!!urls.length && urls.length === selectedWebhooks.length} onClick={selectAll} />,
                            className: "w-12 text-center",
                        },
                        { name: t("settings.Name"), className: "w-1/6 text-center" },
                        { name: t("settings.URL"), className: "w-[calc(calc(100%_/_6_*_3)_-_theme(spacing.12))] text-center" },
                        { name: t("settings.Created"), className: "w-1/6 text-center" },
                        { name: t("settings.Last Used"), className: "w-1/6 text-center" },
                    ]}
                    headerClassName="sticky top-0 z-50 bg-background"
                    scrollable={() => scrollableRef.current}
                    loadMore={nextPage}
                    hasMore={hasMore}
                    totalCount={urls.length}
                    loader={
                        <Flex justify="center" py="6" key={createShortUUID()}>
                            <Loading variant="secondary" />
                        </Flex>
                    }
                >
                    {urls.map((url) => (
                        <WebhookRow key={url.uid} url={url} selectedWebhooks={selectedWebhooks} setSelectedWebhooks={setSelectedWebhooks} />
                    ))}
                </InfiniteScroller.Table.Default>
                {!urls.length && (
                    <Flex justify="center" items="center" h="full" mt="2">
                        {t("settings.No global relationships")}
                    </Flex>
                )}
                {!isAtTop && (
                    <Button
                        onClick={scrollToTop}
                        size="icon"
                        variant="outline"
                        className="absolute bottom-2 left-1/2 inline-flex -translate-x-1/2 transform rounded-full shadow-md"
                    >
                        <IconComponent icon="arrow-up" size="4" />
                    </Button>
                )}
            </Box>
        </Box>
    );
}

export default WebhookList;
