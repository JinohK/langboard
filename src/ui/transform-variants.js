import fs from "fs";
import { parseImportsExports } from "parse-imports-exports";
import { withTV } from "tailwind-variants/transformer";

/**
 * Should be refactored this module to be more generic
 */

const tvRegExp = {
    tv: /tv\s*\(((\([^)]*?\)|\[[^\]]*?\]|.)*?)\)/gs,
    tvExtend: /extend:\s*\w+(,| )\s*/,
    comment: /\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm,
    blankLine: /^\s*$(?:\r\n?|\n)/gm,
    extension: /\.\w+/g,
};

/**
 * @param {string} content
 * @returns {string}
 */
export function transformVariants(content) {
    const parsedContent = parseImportsExports(content).namedImports;
    if (
        !content.includes("@/core/utils/VariantUtils") ||
        !parsedContent ||
        !parsedContent["tailwind-variants"] ||
        !parsedContent["@/core/utils/VariantUtils"]
    ) {
        return content;
    }

    const tvVariants = Array.from(
        content.replace(tvRegExp.comment, "$1").toString().replace(tvRegExp.blankLine, "").toString().matchAll(tvRegExp.tv),
        (match) => match[1].replace(tvRegExp.tvExtend, "").toString()
    )[0];

    if (!tvVariants) {
        return content;
    }

    const { content: strippedContent, imports } = removeImportBlock(content);
    const { content: appliedContent, namespaces } = applyVariantsUtils(strippedContent);
    content = restoreImportBlock(appliedContent, imports, namespaces);

    return content.replace(tvVariants, content);
}

/**
 * @param {string} content
 * @returns {{content: string, imports: {placeholder: string, original: string}[]}}
 */
function removeImportBlock(content) {
    const importRegex = /import[\s\S]+?from\s+['"][^'"]+['"];?/gm;
    const imports = [];
    let i = 0;

    content = content.replace(importRegex, (match) => {
        const placeholder = `__IMPORT_BLOCK_${i}__`;
        imports.push({ placeholder, original: match });
        i++;
        return placeholder;
    });

    return { content, imports };
}

/**
 * @param {string} content
 * @param {{placeholder: string, original: string}[]} imports
 * @param {string[]} namespaces
 * @returns {string}
 */
function restoreImportBlock(content, imports, namespaces) {
    imports.forEach(({ placeholder, original }) => {
        for (let i = 0; i < namespaces.length; ++i) {
            const namespace = namespaces[i];
            if (original.includes(namespace)) {
                original = original.replace(`${namespace},`, "").replace(namespace, "");
            }
        }

        const lines = original.split("\n").filter((line) => line.trim() !== "");
        if (!lines.length) {
            return;
        }

        // If the import block is empty with multiple lines, remove it
        if (lines[0].trim() === "import {") {
            if (lines.length <= 2) {
                return;
            }
        }

        // If the import block is empty with single line, remove it
        if (lines.length === 1 && lines[0].match(/import\s+{?\s*}?\s+from\s+['"][^'"]+['"];?/)) {
            return;
        }

        original = lines.join("\n");

        content = content.replace(placeholder, original);
    });
    return content;
}

/**
 * @param {string} content
 * @returns {{content: string, namespaces: string[]}}
 */
const applyVariantsUtils = (content) => {
    const variantUtilsContent = fs.readFileSync("./src/core/utils/VariantUtils.ts", "utf-8");
    const parsedImports = parseImportsExports(variantUtilsContent).namespaceImports;
    const declarations = {};

    Object.entries(parsedImports).forEach(([importedModule, importInfo]) => {
        const namespace = importInfo[0].namespace;
        const importedContent = fs.readFileSync(`./src/${importedModule.replace("@/", "")}.ts`, "utf-8");
        const importedContentLines = importedContent.split("\n");
        const parsedExports = parseImportsExports(importedContent).declarationExports;
        const chunks = [`const ${namespace} = {`];
        declarations[namespace] = {};
        Object.entries(parsedExports).forEach(([exportedDeclaration, exportInfo]) => {
            const predictedStartLineIndex = importedContentLines.indexOf(importedContent.slice(exportInfo.start, exportInfo.end));
            const exportChunks = ["    {"];
            for (let i = predictedStartLineIndex + 1; i < importedContentLines.length; ++i) {
                const line = importedContentLines[i];
                if (line.startsWith("}")) {
                    break;
                }

                exportChunks.push(`    ${line}`);
            }
            exportChunks.push("    },");
            declarations[namespace][`${namespace}.${exportedDeclaration}`] = exportChunks.join("\n");
            exportChunks[0] = `    ${exportedDeclaration}:`;
            chunks.push(...exportChunks);
        });
        chunks.push("};");

        declarations[namespace].self = chunks.join("\n");
    });

    Object.entries(declarations).forEach(([namespace, declaration]) => {
        Object.entries(declaration).forEach(([declarationName, declarationContent]) => {
            if (content.includes(declarationName)) {
                content = content.replace(`${declarationName},`, declarationContent).replace(declarationName, declarationContent);
            }
        });

        if (content.includes(namespace)) {
            content = content.replace(`${namespace},`, declaration.self).replace(namespace, declaration.self);
        }
    });

    return { content, namespaces: Object.keys(declarations) };
};

/**
 * @param {import('tailwindcss').Config} config
 * @returns {import('tailwindcss').Config}
 */
export function withTansformTV(config) {
    config = withTV(config);
    const tvTransformer = config.content.transform.tsx;
    config.content.transform.tsx = (content) => {
        return tvTransformer(transformVariants(content));
    };
    return config;
}
