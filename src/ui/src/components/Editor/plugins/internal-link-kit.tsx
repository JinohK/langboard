"use client";

import { InternalLinkInputPlugin, InternalLinkPlugin } from "@/components/Editor/plugins/customs/internal-link/InternalLinkPlugin";
import { InternalLinkElement, InternalLinkInputElement } from "@/components/plate-ui/internal-link-node";

export const InternalLinkKit = [
    InternalLinkPlugin.configure({
        options: { triggerPreviousCharPattern: /^$|^[\s"']$/ },
    }).withComponent(InternalLinkElement),
    InternalLinkInputPlugin.withComponent(InternalLinkInputElement),
];
