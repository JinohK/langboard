import { Checkbox, Table } from "@/components/base";
import useUpdateDateDistance from "@/core/hooks/useUpdateDateDistance";
import { AppSettingModel } from "@/core/models";
import WebhookName from "@/pages/SettingsPage/components/webhook/WebhookName";
import WebhookURL from "@/pages/SettingsPage/components/webhook/WebhookURL";
import { memo } from "react";

export interface IWebhookRowProps {
    url: AppSettingModel.TModel;
    selectedWebhooks: string[];
    setSelectedWebhooks: React.Dispatch<React.SetStateAction<string[]>>;
}

const WebhookRow = memo(({ url, selectedWebhooks, setSelectedWebhooks }: IWebhookRowProps) => {
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
        <Table.Row>
            <Table.Cell className="w-12 p-0 text-center">
                <Checkbox checked={selectedWebhooks.some((value) => value === url.uid)} onClick={toggleSelect} />
            </Table.Cell>
            <WebhookName />
            <WebhookURL />
            <Table.Cell className="w-1/6 max-w-0 truncate text-center">{createdAt}</Table.Cell>
            <Table.Cell className="w-1/6 max-w-0 truncate text-center">{lastUsedAt}</Table.Cell>
        </Table.Row>
    );
});

export default WebhookRow;
