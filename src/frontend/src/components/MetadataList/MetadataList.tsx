import { Flex, Toast } from "@/components/base";
import MetadataRow from "@/components/MetadataList/MetadataRow";
import { TMetadataForm } from "@/controllers/api/metadata/types";
import useGetMetadata from "@/controllers/api/metadata/useGetMetadata";
import setupApiErrorHandler, { IApiErrorHandlerMap } from "@/core/helpers/setupApiErrorHandler";
import { MetadataModel } from "@/core/models";
import { createShortUUID } from "@/core/utils/StringUtils";
import { useEffect, useState } from "react";

export interface IMetadataListProps {
    form: TMetadataForm;
    errorsMap: () => IApiErrorHandlerMap;
    canEdit: () => bool;
}

function MetadataList({ form, errorsMap, canEdit }: IMetadataListProps) {
    const { data, error } = useGetMetadata(form);
    const metadataList = MetadataModel.Model.useModels((model) => model.type === form.type && model.uid === form.uid);
    const [metadata, setMetadata] = useState(metadataList[0]);

    useEffect(() => {
        if (!error) {
            return;
        }

        const messageRef = { message: "" };
        const { handle } = setupApiErrorHandler(errorsMap(), messageRef);

        handle(error);
        Toast.Add.error(messageRef.message);
    }, [error]);

    useEffect(() => {
        setMetadata(metadataList[0]);
    }, [metadataList, setMetadata]);

    return (
        <>
            {!data || !metadata ? (
                <SkeletonMetadataList />
            ) : (
                <MetadataListInner form={form} metadata={metadata} errorsMap={errorsMap} canEdit={canEdit} />
            )}
        </>
    );
}

function SkeletonMetadataList(): JSX.Element {
    return <></>;
}

interface IMetadataListInnerProps {
    form: TMetadataForm;
    metadata: MetadataModel.TModel;
    errorsMap: (messageRef: { message: string }) => IApiErrorHandlerMap;
    canEdit: () => bool;
}

function MetadataListInner({ form, metadata: record, errorsMap, canEdit }: IMetadataListInnerProps): JSX.Element | null {
    const metadata = record.useField("metadata");

    return (
        <Flex direction="col" gap="2" mt="2" mb="2">
            {Object.entries(metadata).map(([key, value]) => (
                <MetadataRow key={createShortUUID()} form={form} keyName={key} value={value} errorsMap={errorsMap} canEdit={canEdit} />
            ))}
        </Flex>
    );
}

export default MetadataList;
