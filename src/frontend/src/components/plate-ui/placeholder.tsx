/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { cn } from "@udecode/cn";
import { ParagraphPlugin } from "@udecode/plate/react";
import { type PlaceholderProps, createNodeHOC, createNodesHOC, usePlaceholderState } from "@udecode/plate/react";
import { HEADING_KEYS } from "@udecode/plate-heading";
import { useTranslation } from "react-i18next";

export const Placeholder = (props: PlaceholderProps) => {
    const [t] = useTranslation();
    const { children, nodeProps, placeholder } = props;

    const { enabled } = usePlaceholderState(props);

    return React.Children.map(children, (child) => {
        return React.cloneElement(child, {
            className: child.props.className,
            nodeProps: {
                ...nodeProps,
                className: cn(enabled && "before:absolute before:cursor-text before:opacity-30 before:content-[attr(placeholder)]"),
                placeholder: t(placeholder),
            },
        });
    });
};

export const withPlaceholder = createNodeHOC(Placeholder);

export const withPlaceholdersPrimitive = createNodesHOC(Placeholder);

export const withPlaceholders = (components: any) =>
    withPlaceholdersPrimitive(components, [
        {
            key: ParagraphPlugin.key,
            hideOnBlur: true,
            placeholder: "editor.Type a paragraph",
            query: {
                maxLevel: 1,
            },
        },
        {
            key: HEADING_KEYS.h1,
            hideOnBlur: false,
            placeholder: "editor.Untitled",
        },
    ]);
