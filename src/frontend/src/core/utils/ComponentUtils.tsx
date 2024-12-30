import { StringCase } from "@/core/utils/StringUtils";
import clsx, { ClassValue } from "clsx";
import { cloneElement } from "react";
import { createRoot } from "react-dom/client";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs.filter(Boolean).join(" ")));
}

export const measureComponentHeight = (element: React.ReactElement): Promise<number> =>
    new Promise((resolve) => {
        const rootElem = document.createElement("div");
        const styles = {
            position: "absolute",
            visibility: "hidden",
            zIndex: "-1",
            height: "auto",
            width: "auto",
            top: "0",
        };
        rootElem.style.cssText = Object.entries(styles)
            .map(([key, value]) => {
                return `${new StringCase(key).toKebab()}: ${value} !important`;
            })
            .join(";");
        document.body.appendChild(rootElem);
        const root = createRoot(rootElem);
        root.render(cloneElement(element));
        setTimeout(() => {
            const height = rootElem.clientHeight;
            document.body.removeChild(rootElem);
            resolve(height);
        });
    });

export const measureTextAreaHeight = (textarea: HTMLTextAreaElement): number => {
    const cloned = textarea.cloneNode(true) as HTMLTextAreaElement;
    cloned.style.width = `${textarea.offsetWidth}px`;
    cloned.style.height = "0px";
    document.body.appendChild(cloned);
    const height = cloned.scrollHeight;
    document.body.removeChild(cloned);
    cloned.remove();
    return height;
};
