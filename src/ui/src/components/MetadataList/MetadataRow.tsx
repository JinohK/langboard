import { Box, Button, Flex, IconComponent, Input, Toast } from "@/components/base";
import MetadataRowJsonViewer from "@/components/MetadataList/MetadataRowJsonViewer";
import { TMetadataForm } from "@/controllers/api/metadata/types";
import useDeleteMetadata from "@/controllers/api/metadata/useDeleteMetadata";
import useSaveMetadata from "@/controllers/api/metadata/useSaveMetadata";
import setupApiErrorHandler, { IApiErrorHandlerMap } from "@/core/helpers/setupApiErrorHandler";
import { Utils } from "@langboard/core/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IMetadataRowProps {
    form: TMetadataForm;
    keyName: string;
    value: string;
    errorsMap: (messageRef: { message: string }) => IApiErrorHandlerMap;
    canEdit: () => bool;
}

function MetadataRow({ form, keyName, value, errorsMap, canEdit }: IMetadataRowProps): JSX.Element {
    const [t] = useTranslation();
    const { mutateAsync: saveMetadataMutateAsync } = useSaveMetadata(form, { interceptToast: true });
    const { mutateAsync: deleteMetadataMutateAsync } = useDeleteMetadata(form, { interceptToast: true });
    const [isValidating, setIsValidating] = useState(false);
    const keyInputRef = useRef<HTMLInputElement>(null);
    const valueInputRef = useRef<HTMLInputElement>(null);
    const [currentValue, setCurrentValue] = useState(value);
    const [canSave, setCanSave] = useState(false);
    const saveMetadata = useCallback(() => {
        if (isValidating || !keyInputRef.current || !valueInputRef.current) {
            return;
        }

        if (!keyInputRef.current.value.length) {
            Toast.Add.error(t("metadata.errors.Key is required."));
            return;
        }

        if (keyName === keyInputRef.current.value && value === valueInputRef.current.value) {
            return;
        }

        setIsValidating(true);

        const promise = saveMetadataMutateAsync({
            key: keyInputRef.current.value,
            value: valueInputRef.current.value,
            old_key: keyName,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Saving..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler(errorsMap(messageRef));

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("successes.Metadata saved successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    }, [isValidating, setIsValidating, keyName]);
    const deleteMetadata = useCallback(() => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = deleteMetadataMutateAsync({
            keys: [keyName],
        });

        Toast.Add.promise(promise, {
            loading: t("common.Deleting..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler(errorsMap(messageRef));

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("successes.Metadata deleted successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    }, [isValidating, setIsValidating]);
    const handleInput = useCallback(() => {
        if (!canEdit() || isValidating) {
            return;
        }

        const newKey = keyInputRef.current?.value ?? "";
        const newValue = valueInputRef.current?.value ?? "";
        if (!newKey.length || (keyName === newKey && value === newValue)) {
            setCanSave(false);
            return;
        }

        setCanSave(true);
    }, [keyName, value, canSave, setCanSave, isValidating, setIsValidating]);
    const handleValueInput = useCallback(() => {
        if (!canEdit() || isValidating || !valueInputRef.current) {
            return;
        }

        handleInput();

        const curValue = valueInputRef.current.value;
        const isJson = Utils.String.isJsonString(curValue);
        const newValue = isJson ? JSON.stringify(JSON.parse(curValue)) : curValue;
        valueInputRef.current.value = newValue;
        setCurrentValue(newValue);
    }, [handleInput, setCurrentValue, isValidating, setIsValidating]);

    useEffect(() => {
        if (keyInputRef.current) {
            keyInputRef.current.value = keyName;
        }

        const isJson = Utils.String.isJsonString(value);
        const newValue = isJson ? JSON.stringify(JSON.parse(value)) : value;
        if (valueInputRef.current) {
            valueInputRef.current.value = newValue;
        }
        setCurrentValue(newValue);
    }, [keyName, value, setCurrentValue]);

    return (
        <Flex items="center" gap="2">
            <Flex items="center" gap="2" className={canEdit() ? "w-[calc(100%_-_theme(spacing.14))]" : "w-full"}>
                <Input
                    wrapperProps={{ className: "w-2/5" }}
                    placeholder={t("metadata.Key")}
                    defaultValue={keyName}
                    disabled={!canEdit() || isValidating}
                    onInput={handleInput}
                    className="h-8 py-1"
                    ref={keyInputRef}
                />
                <Box position="relative" className="w-3/5">
                    <Input
                        wrapperProps={{ className: "w-full" }}
                        placeholder={t("metadata.Value")}
                        defaultValue={value}
                        disabled={!canEdit() || isValidating}
                        onInput={handleValueInput}
                        className={"h-8 py-1 pr-7"}
                        ref={valueInputRef}
                    />
                    <MetadataRowJsonViewer
                        valueInputRef={valueInputRef}
                        handleValueInput={handleValueInput}
                        currentValue={currentValue}
                        canEdit={canEdit}
                    />
                </Box>
            </Flex>
            {canEdit() && (
                <Flex items="center" gap="1">
                    <Button
                        size="icon-sm"
                        title={t("common.Save")}
                        titleAlign="end"
                        titleSide="bottom"
                        className="size-7"
                        onClick={saveMetadata}
                        disabled={!canSave || isValidating}
                    >
                        <IconComponent icon="check" size="4" />
                    </Button>
                    <Button
                        variant="destructive"
                        size="icon-sm"
                        title={t("common.Delete")}
                        titleAlign="end"
                        titleSide="bottom"
                        className="size-7"
                        onClick={deleteMetadata}
                        disabled={isValidating}
                    >
                        <IconComponent icon="trash-2" size="4" />
                    </Button>
                </Flex>
            )}
        </Flex>
    );
}

export default MetadataRow;
