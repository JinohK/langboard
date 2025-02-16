import { default as BaseMarkdown, Options as MarkdownOptions } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeMathjax from "rehype-mathjax";
import MarkdownCodeBlock from "@/components/Markdown/CodeBlock";
import { IChatContent } from "@/core/models/Base";

export interface IMarkdownProps extends Omit<MarkdownOptions, "remarkPlugins" | "rehypePlugins" | "className" | "components" | "children"> {
    message: IChatContent | { content: string };
}

function Markdown({ message, ...mdProps }: IMarkdownProps): JSX.Element {
    return (
        <BaseMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeMathjax]}
            className="markdown max-w-full"
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
    );
}

export default Markdown;
