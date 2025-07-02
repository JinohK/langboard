import { Utils } from "@langboard/core/utils";

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

const getNodeType = (value: unknown): number => Utils.Type.getProperty(value, "nodeType") ?? ENodeTypeMap.UNKNOWN;

const isDomType =
    <T>(type: ENodeTypeMap) =>
    (value: unknown): value is T =>
        getNodeType(value) === type;

Utils.Type.isWindow = (value: unknown): value is Window & typeof globalThis => Utils.Type.hasProperty(value, "Window");
Utils.Type.isNode = (value: unknown): value is Node => getNodeType(value) !== ENodeTypeMap.UNKNOWN;
Utils.Type.isElement = <TName extends THTMLTags | undefined>(
    value: unknown,
    tag?: TName
): value is TName extends THTMLTags ? HTMLElementTagNameMap[TName] : Element =>
    isDomType(ENodeTypeMap.ELEMENT)(value) && (!tag || Utils.Type.getProperty<string>(value, "nodeName")?.toLowerCase() === tag.toLowerCase());
Utils.Type.isAttribute = isDomType(ENodeTypeMap.ATTRIBUTE);
Utils.Type.isText = isDomType(ENodeTypeMap.TEXT);
Utils.Type.isCDATASection = isDomType(ENodeTypeMap.CDATA_SECTION);
Utils.Type.isEntityReference = isDomType(ENodeTypeMap.ENTITY_REFERENCE);
Utils.Type.isEntity = isDomType(ENodeTypeMap.ENTITY);
Utils.Type.isProcessingInstruction = isDomType(ENodeTypeMap.PROCESSING_INSTRUCTION);
Utils.Type.isComment = isDomType(ENodeTypeMap.COMMENT);
Utils.Type.isDocument = isDomType(ENodeTypeMap.DOCUMENT);
Utils.Type.isDocumentType = isDomType(ENodeTypeMap.DOCUMENT_TYPE);
Utils.Type.isDocumentFragment = isDomType(ENodeTypeMap.DOCUMENT_FRAGMENT);
Utils.Type.isNotation = isDomType(ENodeTypeMap.NOTATION);
