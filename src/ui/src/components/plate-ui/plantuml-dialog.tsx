import { Box, Flex, Floating } from "@/components/base";
import { TPlantUmlElement, usePlantUmlElement } from "@/components/Editor/plugins/plantuml-plugin";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/plate-ui/alert-dialog";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IPlantUmlDialogProps {
    element: TPlantUmlElement;
    isDialogOpened: bool;
    setIsDialogOpened: React.Dispatch<React.SetStateAction<bool>>;
    changeUmlCode: (value: string) => void;
}

function PlantUmlDialog({ element, isDialogOpened, setIsDialogOpened, changeUmlCode }: IPlantUmlDialogProps) {
    const [t] = useTranslation();
    const [umlCode, setUmlCode] = useState(element.umlCode?.trim());
    const { src } = usePlantUmlElement({ umlCode });
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setUmlCode(element.umlCode?.trim());
    }, [isDialogOpened]);

    return (
        <AlertDialog open={isDialogOpened} onOpenChange={setIsDialogOpened}>
            <AlertDialogContent className="w-3/5 max-w-[auto] gap-6">
                <AlertDialogHeader>
                    <AlertDialogTitle>{t("editor.Plant UML Editor")}</AlertDialogTitle>
                </AlertDialogHeader>

                <AlertDialogDescription asChild>
                    <Flex justify="center" className="w-full" gap="2">
                        <Box position="relative" w="full" textSize="sm" className="group text-muted-foreground">
                            <Floating.LabelTextarea
                                id="url"
                                className="size-full max-h-[60vh] min-h-[60vh]"
                                resize="none"
                                value={umlCode}
                                onChange={(e) => setUmlCode(e.target.value)}
                                label={t("editor.UML code")}
                                placeholder=""
                                ref={textareaRef}
                            />
                        </Box>
                        <Flex position="relative" w="full" items="baseline" justify="center" className="group text-muted-foreground">
                            {src ? (
                                <img src={src} alt="PlantUML" className="max-h-[60vh] max-w-full" />
                            ) : (
                                <Box textSize="sm" className="whitespace-nowrap text-center text-muted-foreground">
                                    {t("editor.No preview available.")}
                                </Box>
                            )}
                        </Flex>
                    </Flex>
                </AlertDialogDescription>

                <AlertDialogFooter>
                    <AlertDialogCancel>{t("editor.Cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            changeUmlCode(umlCode);
                            setIsDialogOpened(() => false);
                        }}
                    >
                        {t("editor.Accept")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default PlantUmlDialog;
