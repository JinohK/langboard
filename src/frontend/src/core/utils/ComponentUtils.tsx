import { StringCase } from "@/core/utils/StringUtils";
import TypeUtils from "@/core/utils/TypeUtils";
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
        setElementStyles(rootElem, {
            position: "absolute !important",
            visibility: "hidden !important",
            zIndex: "-1 !important",
            height: "auto !important",
            width: "auto !important",
            top: "0 !important",
        });
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
    setElementStyles(cloned, {
        width: `${textarea.offsetWidth}px`,
        height: "0px",
    });
    document.body.appendChild(cloned);
    const height = cloned.scrollHeight;
    document.body.removeChild(cloned);
    cloned.remove();
    return height;
};

export const setElementStyles = (elements: HTMLElement | HTMLElement[], styles: Record<string, string>): void => {
    if (!TypeUtils.isArray(elements)) {
        elements = [elements];
    }

    Object.entries(styles).forEach(([key, value]) => {
        elements.forEach((element) => {
            element.style.setProperty(new StringCase(key).toKebab(), value);
        });
    });
};

export const selectAllText = (element: HTMLInputElement | HTMLTextAreaElement): void => {
    element.selectionStart = 0;
    element.selectionEnd = element.value.length;
};

export const copyToClipboard = (text: string): void => {
    if (!navigator?.clipboard) {
        document.execCommand("copy");
    } else {
        navigator.clipboard.writeText(text);
    }
};
