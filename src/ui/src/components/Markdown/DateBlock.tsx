const MarkdownDateBlock = ({ children }: { children: string[] }) => {
    if (children.length === 0) {
        return <span className="w-fit rounded-sm bg-border px-1 text-muted-foreground">Invalid date</span>;
    }

    const dateString = children[0];
    const date = new Date(dateString);

    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
    const formattedDate = date.toLocaleDateString("ko-KR", options);

    return <span className="w-fit rounded-sm bg-neutral-800 px-1 text-muted-foreground">{formattedDate}</span>;
};

export default MarkdownDateBlock;
