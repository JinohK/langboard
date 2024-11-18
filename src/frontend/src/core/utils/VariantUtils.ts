import * as DimensionMap from "@/core/utils/classnames/DimensionMap";
import * as FlexMap from "@/core/utils/classnames/FlexMap";
import * as GapMap from "@/core/utils/classnames/GapMap";
import * as MarginMap from "@/core/utils/classnames/MarginMap";
import * as PaddingMap from "@/core/utils/classnames/PaddingMap";
import * as TextMap from "@/core/utils/classnames/TextMap";
import { TVVariants } from "tailwind-variants";

export { type TSize, type TDimensionSize, type TScreenSize } from "@/core/utils/classnames/types";
export * as ScreenMap from "@/core/utils/classnames/ScreenMap";

export { DimensionMap, FlexMap, GapMap, MarginMap, PaddingMap, TextMap };

export const shardTailwindVariants = {
    w: { ...DimensionMap.width },
    h: { ...DimensionMap.height },
    size: { ...DimensionMap.all },
    p: { ...PaddingMap.all },
    pl: { ...PaddingMap.left },
    pr: { ...PaddingMap.right },
    pt: { ...PaddingMap.top },
    pb: { ...PaddingMap.bottom },
    px: { ...PaddingMap.x },
    py: { ...PaddingMap.y },
    m: { ...MarginMap.all },
    ml: { ...MarginMap.left },
    mr: { ...MarginMap.right },
    mt: { ...MarginMap.top },
    mb: { ...MarginMap.bottom },
    mx: { ...MarginMap.x },
    my: { ...MarginMap.y },
    textSize: { ...TextMap.size },
};

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
