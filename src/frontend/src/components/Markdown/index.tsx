import { default as BaseMarkdown, Options as MarkdownOptions } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeMathjax from "rehype-mathjax";
import MarkdownCodeBlock from "@/components/Markdown/CodeBlock";
import { IChatContent } from "@/core/models/Base";
import { Box } from "@/components/base";

export interface IMarkdownProps extends Omit<MarkdownOptions, "remarkPlugins" | "rehypePlugins" | "className" | "components" | "children"> {
    message: IChatContent | { content: string };
}

function Markdown({ message, ...mdProps }: IMarkdownProps): JSX.Element {
    return (
        <Box className="markdown max-w-full">
            <BaseMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeMathjax]}
                components={{
                    p({ node, ...props }) {
                        return <div>{props.children}</div>;
                    },
                    pre({ node, ...props }) {
                        return <>{props.children}</>;
                    },
                    ol({ node, ...props }) {
                        return <ol className="max-w-full">{props.children}</ol>;
                    },
                    ul({ node, ...props }) {
                        return <ul className="max-w-full">{props.children}</ul>;
                    },
                    table({ node, ...props }) {
                        return (
                            <div className="prose prose-invert">
                                <table>{props.children}</table>
                            </div>
                        );
                    },
                    code: ({ node, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || "");
                        return match ? (
                            <MarkdownCodeBlock language={match[1]} code={String(children).replace(/\n$/, "")} />
                        ) : (
                            <code className={className} {...props}>
                                {children}
                            </code>
                        );
                    },
                }}
                {...mdProps}
            >
                {message.content}
            </BaseMarkdown>
        </Box>
    );
}

export default Markdown;
