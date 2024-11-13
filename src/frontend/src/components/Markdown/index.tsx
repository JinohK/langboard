import { default as BaseMarkdown, Options as MarkdownOptions } from "react-markdown";
import remarkGfm from "remark-gfm";

export interface IMarkdownProps extends Omit<MarkdownOptions, "remarkPlugins"> {
    children: string;
}

function Markdown({ children, ...props }: IMarkdownProps): JSX.Element {
    return (
        <BaseMarkdown remarkPlugins={[[remarkGfm, { singleTilde: false }]]} {...props}>
            {children}
        </BaseMarkdown>
    );
}

export default Markdown;
