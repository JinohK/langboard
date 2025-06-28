"use client";

import type { TAudioElement } from "platejs";
import type { PlateElementProps } from "platejs/react";
import { useMediaState } from "@platejs/media/react";
import { ResizableProvider } from "@platejs/resizable";
import { PlateElement, withHOC } from "platejs/react";
import { Caption, CaptionTextarea } from "@/components/plate-ui/caption";
import { useTranslation } from "react-i18next";

export const AudioElement = withHOC(ResizableProvider, function AudioElement(props: PlateElementProps<TAudioElement>) {
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
