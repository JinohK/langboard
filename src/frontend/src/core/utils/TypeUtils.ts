type THTMLTags = keyof HTMLElementTagNameMap;

enum ENodeTypeMap {
    UNKNOWN = 0,
    ELEMENT = 1,
    ATTRIBUTE = 2,
    TEXT = 3,
    CDATA_SECTION = 4,
    ENTITY_REFERENCE = 5,
    ENTITY = 6,
    PROCESSING_INSTRUCTION = 7,
    COMMENT = 8,
    DOCUMENT = 9,
    DOCUMENT_TYPE = 10,
    DOCUMENT_FRAGMENT = 11,
    NOTATION = 12,
}

const getType = (value: unknown = undefined): string => {
    const type: string = typeof value;
    switch (true) {
        case value === null:
            return "null";
        case type === "object" && Array.isArray(value):
            return "array";
        default:
            return type;
    }
};

const isType =
    <T>(type: string) =>
    (value: unknown): value is T =>
        getType(value) === type;

const isArray: <T>(value: unknown) => value is T[] = isType("array");
const isNumber: (value: unknown) => value is number = isType("number");
const isObject: <T = object>(value: unknown) => value is T = isType("object");
const isString: (value: unknown) => value is string = isType("string");
const isBool: (value: unknown) => value is bool = isType(typeof true);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isFunction: <TFunc extends (...args: any) => any>(value: unknown | TFunc) => value is (...params: Parameters<TFunc>) => ReturnType<TFunc> =
    isType("function");
const isNull: (value: unknown) => value is null = isType("null");
const isUndefined: (value: unknown) => value is undefined = isType("undefined");
const isNullOrUndefined = (value: unknown): value is null | undefined => isNull(value) || isUndefined(value);

const getProperty = <T>(obj: unknown, key: string): T | undefined => Object.assign(obj ?? {})?.[key];
const hasProperty = <T>(obj: unknown, key: string): obj is T => {
    const assigned = Object.assign(obj ?? {})?.[key];
    if (isUndefined(assigned) || isNull(assigned)) return false;
    return true;
};

const getNodeType = (value: unknown): number => getProperty(value, "nodeType") ?? ENodeTypeMap.UNKNOWN;

const isDomType =
    <T>(type: ENodeTypeMap) =>
    (value: unknown): value is T =>
        getNodeType(value) === type;
const isWindow = (value: unknown): value is Window & typeof globalThis => hasProperty(value, "Window");
const isNode = (value: unknown): value is Node => getNodeType(value) !== ENodeTypeMap.UNKNOWN;
const isElement = <TName extends THTMLTags | undefined>(
    value: unknown,
    tag?: TName
): value is TName extends THTMLTags ? HTMLElementTagNameMap[TName] : Element =>
    isDomType(ENodeTypeMap.ELEMENT)(value) && (!tag || getProperty<string>(value, "nodeName")?.toLowerCase() === tag.toLowerCase());
const isAttribute: (value: unknown) => value is Attr = isDomType(ENodeTypeMap.ATTRIBUTE);
const isText: (value: unknown) => value is Text = isDomType(ENodeTypeMap.TEXT);
const isCDATASection: (value: unknown) => value is CDATASection = isDomType(ENodeTypeMap.CDATA_SECTION);
const isEntityReference: (value: unknown) => value is Node = isDomType(ENodeTypeMap.ENTITY_REFERENCE);
const isEntity: (value: unknown) => value is Node = isDomType(ENodeTypeMap.ENTITY);
const isProcessingInstruction: (value: unknown) => value is ProcessingInstruction = isDomType(ENodeTypeMap.PROCESSING_INSTRUCTION);
const isComment: (value: unknown) => value is Comment = isDomType(ENodeTypeMap.COMMENT);
const isDocument: (value: unknown) => value is Document = isDomType(ENodeTypeMap.DOCUMENT);
const isDocumentType: (value: unknown) => value is DocumentType = isDomType(ENodeTypeMap.DOCUMENT_TYPE);
const isDocumentFragment: (value: unknown) => value is DocumentFragment = isDomType(ENodeTypeMap.DOCUMENT_FRAGMENT);
const isNotation: (value: unknown) => value is Node = isDomType(ENodeTypeMap.NOTATION);

const TypeUtils = {
    isArray,
    isNumber,
    isObject,
    isString,
    isBool,
    isFunction,
    isNull,
    isUndefined,
    isNullOrUndefined,
    isWindow,
    isNode,
    isElement,
    isAttribute,
    isText,
    isCDATASection,
    isEntityReference,
    isEntity,
    isProcessingInstruction,
    isComment,
    isDocument,
    isDocumentType,
    isDocumentFragment,
    isNotation,
};

export default TypeUtils;
