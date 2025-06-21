import * as BorderMap from "@/core/utils/classnames/BorderMap";
import * as CursorMap from "@/core/utils/classnames/CursorMap";
import * as DimensionMap from "@/core/utils/classnames/DimensionMap";
import * as DisplayMap from "@/core/utils/classnames/DisplayMap";
import * as FlexMap from "@/core/utils/classnames/FlexMap";
import * as GapMap from "@/core/utils/classnames/GapMap";
import * as MarginMap from "@/core/utils/classnames/MarginMap";
import * as PaddingMap from "@/core/utils/classnames/PaddingMap";
import * as PositionMap from "@/core/utils/classnames/PositionMap";
import * as TextMap from "@/core/utils/classnames/TextMap";
import { TVVariants } from "tailwind-variants";

export { type TSize, type TDimensionSize, type TScreenSize } from "@/core/utils/classnames/types";
export * as ScreenMap from "@/core/utils/classnames/ScreenMap";

export { BorderMap, CursorMap, DimensionMap, DisplayMap, FlexMap, GapMap, MarginMap, PaddingMap, PositionMap, TextMap };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const extractVariantProps = (variants: TVVariants<any>, props: Record<string, unknown>): Record<string, unknown> => {
    const extracted: Record<string, unknown> = {};
    (variants as Record<string, string[]>).variantKeys.forEach((key) => {
        if (props[key]) {
            extracted[key] = props[key];
            delete props[key];
        }
    });
    return extracted;
};
