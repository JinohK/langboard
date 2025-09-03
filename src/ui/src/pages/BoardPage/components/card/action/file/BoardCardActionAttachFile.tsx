import { Box, Button, Flex, IconComponent, Input, Popover, ScrollArea, SubmitButton, Toast } from "@/components/base";
import { Project } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { Utils } from "@langboard/core/utils";
import BoardCardActionAttachedFileList from "@/pages/BoardPage/components/card/action/file/BoardCardActionAttachedFileList";
import { IAttachedFile, ISharedBoardCardActionProps } from "@/pages/BoardPage/components/card/action/types";
import { memo, useMemo, useReducer, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";
import { MAX_FILE_SIZE_MB } from "@/constants";

export interface IBoardCardActionAttachFileProps extends ISharedBoardCardActionProps {}

const BoardCardActionAttachFile = memo(({ buttonClassName }: IBoardCardActionAttachFileProps) => {
    const { hasRoleAction } = useBoardCard();
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [updated, forceUpdate] = useReducer((x) => x + 1, 0);
    const attachedFileMap = useRef<Record<string, IAttachedFile>>({});
    const attachedFiles = useMemo(() => {
        return Object.values(attachedFileMap.current);
    }, [updated, forceUpdate, attachedFileMap.current]);
    const inputRef = useRef<HTMLInputElement>(null);
    const handleAttach = (files: File[]) => {
        if (isValidating) {
            return;
        }

        for (let i = 0; i < files.length; ++i) {
            const key = Utils.String.Token.uuid();
            attachedFileMap.current[key] = { uid: key, file: files[i] };
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

    const deleteFile = (key: string) => {
        delete attachedFileMap.current[key];
        forceUpdate();
    };

    const upload = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        let errorCount = 0;
        const successFiles: string[] = [];
        Promise.all(
            attachedFiles
                .map((attachedFile) => attachedFile.upload?.())
                .map((promise) => {
                    promise?.then((result) => {
                        if (!result) {
                            ++errorCount;
                        } else {
                            successFiles.push(result);
                        }
                    });
                })
        ).finally(() => {
            if (errorCount > 0) {
                Toast.Add.error(
                    t("errors.{num} files could not be uploaded. File size may be too large (Max size is {size}MB).", {
                        num: errorCount,
                        size: MAX_FILE_SIZE_MB,
                    })
                );
                setIsValidating(false);
                for (let i = 0; i < successFiles.length; ++i) {
                    delete attachedFileMap.current[successFiles[i]];
                }
                forceUpdate();
                return;
            }

            Toast.Add.success(t("successes.Files have been uploaded successfully."));
            setIsValidating(false);
            changeOpenedState(false);
            forceUpdate();
        });
    };

    const changeOpenedState = (opened: bool) => {
        if (isValidating) {
            return;
        }

        if (!opened) {
            Object.keys(attachedFileMap.current).forEach((key) => {
                delete attachedFileMap.current[key];
            });
        }
        setIsOpened(opened);
    };

    if (!hasRoleAction(Project.ERoleAction.CardUpdate)) {
        return null;
    }

    return (
        <Popover.Root modal open={isOpened} onOpenChange={changeOpenedState}>
            <Popover.Trigger asChild>
                <Button variant="secondary" className={buttonClassName}>
                    <IconComponent icon="file-up" size="4" />
                    {t("card.Attach file")}
                </Button>
            </Popover.Trigger>
            <Popover.Content align="end" className="w-[min(theme(spacing.96),80vw)]">
                <Input wrapperProps={{ className: "hidden" }} disabled={isValidating} {...getInputProps()} ref={inputRef} />
                <Box mb="2" textSize="sm" weight="semibold">
                    {t("card.Attach file")}
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
                            <BoardCardActionAttachedFileList attachedFiles={attachedFiles} deleteFile={deleteFile} />
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
