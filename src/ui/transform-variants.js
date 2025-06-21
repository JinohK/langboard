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

    content = applyVariantsUtils(content);

    return content.replace(tvVariants, content);
}

/**
 * @param {string} content
 * @returns {string}
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

    return content;
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
