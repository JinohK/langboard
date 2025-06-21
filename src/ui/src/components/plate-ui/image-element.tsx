/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { cn } from "@udecode/cn";
import { useDraggable } from "@udecode/plate-dnd";
import { TImageElement } from "@udecode/plate-media";
import { Image, ImagePlugin, useMediaState } from "@udecode/plate-media/react";
import { ResizableProvider, useResizableValue } from "@udecode/plate-resizable";
import { PlateElement, PlateElementProps, withHOC } from "@udecode/plate/react";
import { Caption, CaptionTextarea } from "@/components/plate-ui/caption";
import { MediaPopover } from "@/components/plate-ui/media-popover";
import { Resizable, ResizeHandle, mediaResizeHandleVariants } from "@/components/plate-ui/resizable";
import { useTranslation } from "react-i18next";

export const ImageElement = withHOC(ResizableProvider, function ImageElement(props: PlateElementProps<TImageElement>) {
    const [t] = useTranslation();
    const { align = "center", focused, readOnly, selected } = useMediaState();
    const width = useResizableValue("width");

    const { isDragging, handleRef } = useDraggable({
        element: props.element,
    });

    return (
        <MediaPopover plugin={ImagePlugin}>
            <PlateElement {...props} className="py-2.5">
                <figure className="group relative m-0" contentEditable={false}>
                    <Resizable
                        align={align}
                        options={{
                            align,
                            readOnly,
                        }}
                    >
                        <ResizeHandle className={mediaResizeHandleVariants({ direction: "left" })} options={{ direction: "left" }} />
                        <Image
                            ref={handleRef}
                            className={cn(
                                "block w-full max-w-full cursor-pointer object-cover px-0",
                                "rounded-sm",
                                focused && selected && "ring-2 ring-ring ring-offset-2",
                                isDragging && "opacity-50"
                            )}
                            alt={(props.attributes as any).alt}
                        />
                        <ResizeHandle
                            className={mediaResizeHandleVariants({
                                direction: "right",
                            })}
                            options={{ direction: "right" }}
                        />
                    </Resizable>

                    <Caption style={{ width }} align={align}>
                        <CaptionTextarea
                            readOnly={readOnly}
                            onFocus={(e) => {
                                e.preventDefault();
                            }}
                            placeholder={t("editor.Write a caption...")}
                        />
                    </Caption>
                </figure>

                {props.children}
            </PlateElement>
        </MediaPopover>
    );
});
