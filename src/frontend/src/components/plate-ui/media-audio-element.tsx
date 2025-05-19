"use client";

import { useMediaState } from "@udecode/plate-media/react";
import { ResizableProvider } from "@udecode/plate-resizable";
import { PlateElement, PlateElementProps, withHOC } from "@udecode/plate/react";
import { Caption, CaptionTextarea } from "@/components/plate-ui/caption";
import { useTranslation } from "react-i18next";
import { TAudioElement } from "@udecode/plate-media";

export const MediaAudioElement = withHOC(ResizableProvider, function MediaAudioElement(props: PlateElementProps<TAudioElement>) {
    const [t] = useTranslation();
    const { align = "center", readOnly, unsafeUrl } = useMediaState();

    return (
        <PlateElement {...props} className="mb-1">
            <figure className="group relative cursor-default" contentEditable={false}>
                <div className="h-16">
                    <audio className="size-full" src={unsafeUrl} controls />
                </div>

                <Caption style={{ width: "100%" }} align={align}>
                    <CaptionTextarea className="h-20" readOnly={readOnly} placeholder={t("editor.Write a caption...")} />
                </Caption>
            </figure>
            {props.children}
        </PlateElement>
    );
});
