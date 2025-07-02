import { ColorUtils, TColorUtils } from "@/utils/Color";
export type { TColorUtils } from "@/utils/Color";
import { ObjectUtils, TObjectUtils } from "@/utils/Object";
export type { TObjectUtils } from "@/utils/Object";
import { StringUtils, TStringUtils } from "@/utils/StringUtils";
export type { TStringUtils } from "@/utils/StringUtils";
import { JsonUtils, TJsonUtils } from "@/utils/JsonUtils";
export type { TJsonUtils } from "@/utils/JsonUtils";
import { TypeUtils, TTypeUtils } from "@/utils/TypeUtils";
export type { TTypeUtils } from "@/utils/TypeUtils";

export interface IUtils {
    readonly Color: TColorUtils;
    readonly Object: TObjectUtils;
    readonly String: TStringUtils;
    readonly Json: TJsonUtils;
    readonly Type: TTypeUtils;
}

export const Utils: IUtils = {
    Color: ColorUtils,
    Object: ObjectUtils,
    String: StringUtils,
    Json: JsonUtils,
    Type: TypeUtils,
};
