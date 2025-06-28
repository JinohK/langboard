"use client";

import { BasicBlocksKit } from "@/components/Editor/plugins/basic-blocks-kit";
import { BasicMarksKit } from "@/components/Editor/plugins/basic-marks-kit";

export const BasicNodesKit = [...BasicBlocksKit, ...BasicMarksKit];
