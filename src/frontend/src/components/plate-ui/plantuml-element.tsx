"use client";

import { cn, withRef } from "@udecode/cn";
import { PlateElement } from "@/components/plate-ui/plate-element";
import { Flex, IconComponent } from "@/components/base";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { TPlantUmlElement, usePlantUmlElement } from "@/components/Editor/plugins/plantuml-plugin";
import PlantUmlDialog from "@/components/plate-ui/plantuml-dialog";

export const PlantUmlElement = withRef<typeof PlateElement, { element: TPlantUmlElement }>(({ children, className, ...props }, ref) => {
    const [t] = useTranslation();
    const { element } = props;
    const [isDialogOpened, setIsDialogOpened] = useState(false);
    const [umlCode, setUmlCode] = useState(element.umlCode?.trim());
    const { src } = usePlantUmlElement({ umlCode: umlCode });

    const changeUmlCode = (value: string) => {
        element.umlCode = value;
        setUmlCode(value);
    };

    const triggerClassNames = cn("cursor-pointer select-none transition-all hover:bg-primary/10", umlCode ? "px-2 py-1" : "bg-muted p-3 pr-9");

    return (
        <>
            <PlateElement ref={ref} className={cn("py-2.5", className)} {...props}>
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
                {children}
            </PlateElement>
            <PlantUmlDialog element={element} isDialogOpened={isDialogOpened} setIsDialogOpened={setIsDialogOpened} changeUmlCode={changeUmlCode} />
        </>
    );
});
