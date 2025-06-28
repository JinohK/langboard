"use client";

import { cn } from "@/core/utils/ComponentUtils";
import { PlateElement, PlateElementProps } from "platejs/react";
import { Flex, IconComponent } from "@/components/base";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { TPlantUmlElement, usePlantUmlElement } from "@/components/Editor/plugins/plantuml-plugin";
import PlantUmlDialog from "@/components/plate-ui/plantuml-dialog";

export function PlantUmlElement(props: PlateElementProps<TPlantUmlElement>) {
    const [t] = useTranslation();
    const { editor, element } = props;
    const [isDialogOpened, setIsDialogOpened] = useState(false);
    const { src } = usePlantUmlElement({ umlCode: element.umlCode });

    const changeUmlCode = (value: string) => {
        editor.tf.setNodes({ umlCode: value }, { at: element });
    };

    const triggerClassNames = cn(
        "cursor-pointer select-none transition-all hover:bg-primary/10",
        element.umlCode ? "px-2 py-1" : "bg-muted p-3 pr-9"
    );

    return (
        <>
            <PlateElement {...props} className="py-2.5">
                <figure className="group relative" contentEditable={false} onClick={() => setIsDialogOpened(true)}>
                    <Flex items="center" justify="center" rounded="sm" className={triggerClassNames}>
                        {src ? (
                            <img src={src} alt="PlantUML" />
                        ) : (
                            <div>
                                <Flex items="center" gap="2" h="7" w="full" textSize="sm" className="whitespace-nowrap text-muted-foreground">
                                    <IconComponent icon="git-compare" className="size-6 text-muted-foreground/80" />
                                    {t("editor.Add a uml code")}
                                </Flex>
                            </div>
                        )}
                    </Flex>
                </figure>
                {props.children}
            </PlateElement>
            <PlantUmlDialog element={element} isDialogOpened={isDialogOpened} setIsDialogOpened={setIsDialogOpened} changeUmlCode={changeUmlCode} />
        </>
    );
}
