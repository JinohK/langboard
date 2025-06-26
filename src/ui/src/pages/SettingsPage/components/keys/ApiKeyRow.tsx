import { Checkbox, Table } from "@/components/base";
import useUpdateDateDistance from "@/core/hooks/useUpdateDateDistance";
import { AppSettingModel } from "@/core/models";
import ApiKeyName from "@/pages/SettingsPage/components/keys/ApiKeyName";
import { memo } from "react";

export interface IApiKeyRowProps {
    apiKey: AppSettingModel.TModel;
    selectedKeys: string[];
    setSelectedKeys: React.Dispatch<React.SetStateAction<string[]>>;
}

const ApiKeyRow = memo(({ apiKey, selectedKeys, setSelectedKeys }: IApiKeyRowProps) => {
    const key = apiKey.useField("setting_value");
    const rawCreatedAt = apiKey.useField("created_at");
    const rawLastUsedAt = apiKey.useField("last_used_at");
    const createdAt = useUpdateDateDistance(rawCreatedAt);
    const lastUsedAt = useUpdateDateDistance(rawLastUsedAt);
    const totalUsedCount = apiKey.useField("total_used_count");

    const toggleSelect = () => {
        setSelectedKeys((prev) => {
            if (prev.some((value) => value === apiKey.uid)) {
                return prev.filter((value) => value !== apiKey.uid);
            } else {
                return [...prev, apiKey.uid];
            }
        });
    };

    return (
        <Table.Row>
            <Table.Cell className="w-12 text-center">
                <Checkbox checked={selectedKeys.some((value) => value === apiKey.uid)} onClick={toggleSelect} />
            </Table.Cell>
            <ApiKeyName apiKey={apiKey} />
            <Table.Cell className="w-1/6 max-w-0 truncate text-center">{key}</Table.Cell>
            <Table.Cell className="w-1/6 max-w-0 truncate text-center">{createdAt}</Table.Cell>
            <Table.Cell className="w-1/6 max-w-0 truncate text-center">{lastUsedAt}</Table.Cell>
            <Table.Cell className="w-1/6 max-w-0 truncate text-center">{totalUsedCount}</Table.Cell>
        </Table.Row>
    );
});

export default ApiKeyRow;
