import { Checkbox, Table } from "@/components/base";
import { IFlexProps } from "@/components/base/Flex";
import useUpdateDateDistance from "@/core/hooks/useUpdateDateDistance";
import { AppSettingModel } from "@/core/models";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import WebhookName from "@/pages/SettingsPage/components/webhook/WebhookName";
import WebhookURL from "@/pages/SettingsPage/components/webhook/WebhookURL";
import { memo } from "react";

export interface IWebhookRowProps extends IFlexProps {
    url: AppSettingModel.TModel;
    selectedWebhooks: string[];
    setSelectedWebhooks: React.Dispatch<React.SetStateAction<string[]>>;
}

const WebhookRow = memo(({ url, selectedWebhooks, setSelectedWebhooks, ...props }: IWebhookRowProps) => {
    const rawCreatedAt = url.useField("created_at");
    const rawLastUsedAt = url.useField("last_used_at");
    const createdAt = useUpdateDateDistance(rawCreatedAt);
    const lastUsedAt = useUpdateDateDistance(rawLastUsedAt);

    const toggleSelect = () => {
        setSelectedWebhooks((prev) => {
            if (prev.some((value) => value === url.uid)) {
                return prev.filter((value) => value !== url.uid);
            } else {
                return [...prev, url.uid];
            }
        });
    };

    return (
        <Table.FlexRow {...props}>
            <ModelRegistry.AppSettingModel.Provider model={url}>
                <Table.FlexCell className="w-12 text-center">
                    <Checkbox checked={selectedWebhooks.some((value) => value === url.uid)} onClick={toggleSelect} />
                </Table.FlexCell>
                <WebhookName />
                <WebhookURL />
                <Table.FlexCell className="w-1/6 truncate text-center">{createdAt}</Table.FlexCell>
                <Table.FlexCell className="w-1/6 truncate text-center">{lastUsedAt}</Table.FlexCell>
            </ModelRegistry.AppSettingModel.Provider>
        </Table.FlexRow>
    );
});

export default WebhookRow;
