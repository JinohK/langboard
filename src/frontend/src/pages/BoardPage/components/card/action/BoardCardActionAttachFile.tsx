import { Box, Button, Flex, IconComponent, Input, Popover, ScrollArea, Toast } from "@/components/base";
import SubmitButton from "@/components/SubmitButton";
import { Project } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { createUUID } from "@/core/utils/StringUtils";
import BoardCardActionAttachedFileList from "@/pages/BoardPage/components/card/action/BoardCardActionAttachedFileList";
import { IAttachedFile, ISharedBoardCardActionProps } from "@/pages/BoardPage/components/card/action/types";
import { memo, useMemo, useReducer, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";

export interface BoardCardActionAttachFileProps extends ISharedBoardCardActionProps {}

const BoardCardActionAttachFile = memo(({ buttonClassName }: BoardCardActionAttachFileProps) => {
    const { hasRoleAction } = useBoardCard();
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [updated, forceUpdate] = useReducer((x) => x + 1, 0);
    const attachedFileMap = useRef<Record<string, IAttachedFile>>({});
    const attachedFiles = useMemo(() => {
        return Object.values(attachedFileMap.current).sort((a, b) => a.order - b.order);
    }, [updated, forceUpdate, attachedFileMap.current]);
    const inputRef = useRef<HTMLInputElement>(null);
    const handleAttach = (files: File[]) => {
        if (isValidating) {
            return;
        }

        const count = Object.keys(attachedFileMap.current).length;
        for (let i = 0; i < files.length; ++i) {
            const key = createUUID();
            attachedFileMap.current[key] = { key, file: files[i], order: count + i };
        }

        if (inputRef.current) {
            inputRef.current.value = "";
        }

        forceUpdate();
    };
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: handleAttach,
        disabled: isValidating,
    });

    const upload = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        Promise.all([...attachedFiles.map((attachedFile) => attachedFile.upload?.())]).finally(() => {
            Toast.Add.success(t("card.successes.Files have been uploaded successfully."));
            setIsValidating(false);
            changeOpenedState(false);
            forceUpdate();
        });
    };

    const deleteFile = (key: string) => {
        delete attachedFileMap.current[key];
        forceUpdate();
    };

    const changeOpenedState = (opened: bool) => {
        if (!opened) {
            Object.keys(attachedFileMap.current).forEach((key) => {
                delete attachedFileMap.current[key];
            });
        }
        setIsOpened(opened);
    };

    if (!hasRoleAction(Project.ERoleAction.CARD_UPDATE)) {
        return null;
    }

    return (
        <Popover.Root
            modal
            open={isOpened}
            onOpenChange={(opened) => {
                if (isValidating) {
                    return;
                }
                changeOpenedState(opened);
            }}
        >
            <Popover.Trigger asChild>
                <Button variant="secondary" className={buttonClassName}>
                    <IconComponent icon="file-up" size="4" />
                    {t("card.Attach a file")}
                </Button>
            </Popover.Trigger>
            <Popover.Content align="end" className="w-[min(theme(spacing.96),80vw)]">
                <Input className="hidden" disabled={isValidating} {...getInputProps()} ref={inputRef} />
                <Box mb="2" textSize="sm" weight="semibold">
                    {t("card.Attach a file")}
                </Box>
                <ScrollArea.Root className="border border-dashed p-2">
                    <Box position="relative" className="h-[min(theme(spacing.36),35vh)] select-none" {...getRootProps()}>
                        {isDragActive && (
                            <Flex
                                items="center"
                                justify="center"
                                size="full"
                                position="absolute"
                                left="0"
                                top="0"
                                z="50"
                                border="2"
                                className="border-dashed border-primary bg-background"
                            >
                                {t("card.Drop a file here")}
                            </Flex>
                        )}
                        {!attachedFiles.length ? (
                            <Flex items="center" justify="center" size="full" position="absolute" left="0" top="0">
                                {t("card.Drag and drop a file here")}
                            </Flex>
                        ) : (
                            <BoardCardActionAttachedFileList attachedFiles={attachedFiles} deleteFile={deleteFile} update={forceUpdate} />
                        )}
                    </Box>
                </ScrollArea.Root>
                <Flex items="center" justify="center" direction="col" gap="1" mt="2" className="select-none">
                    <Box ml="2" textSize="sm" className="text-center text-muted-foreground/70">
                        {t("common.Or")}
                    </Box>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 py-0"
                        onClick={() => {
                            if (isValidating) {
                                return;
                            }

                            inputRef.current?.click();
                        }}
                    >
                        {t("card.Upload a file")}
                    </Button>
                </Flex>
                <Flex items="center" justify="end" gap="1" mt="2">
                    <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => changeOpenedState(false)}>
                        {t("common.Cancel")}
                    </Button>
                    <SubmitButton type="button" size="sm" onClick={upload} isValidating={isValidating}>
                        {t("common.Save")}
                    </SubmitButton>
                </Flex>
            </Popover.Content>
        </Popover.Root>
    );
});

export default BoardCardActionAttachFile;
