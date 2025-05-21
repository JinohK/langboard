import * as React from "react";
import { cn } from "@/core/utils/ComponentUtils";
import * as Tooltip from "@/components/base/Tooltip";

const Root = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
        <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
));
Root.displayName = "Table";

const Header = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
));
Header.displayName = "TableHeader";

const Body = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
));
Body.displayName = "TableBody";

const Footer = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
    <tfoot ref={ref} className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)} {...props} />
));
Footer.displayName = "TableFooter";

const Row = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(({ className, ...props }, ref) => (
    <tr ref={ref} className={cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className)} {...props} />
));
Row.displayName = "TableRow";

export interface ITableCellProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
    title?: string;
    titleAlign?: "center" | "start" | "end";
    titleSide?: "top" | "bottom" | "left" | "right";
}

const Head = React.forwardRef<HTMLTableCellElement, ITableCellProps>(({ title, titleAlign, titleSide, className, children, ...props }, ref) => {
    const headProps = {
        ref,
        className: cn("h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0", className),
        ...props,
    };

    if (!title) {
        return <th {...headProps}>{children}</th>;
    }

    return (
        <th {...headProps}>
            <Tooltip.Root>
                <Tooltip.Trigger>{children}</Tooltip.Trigger>
                <Tooltip.Content align={titleAlign} side={titleSide}>
                    {title}
                </Tooltip.Content>
            </Tooltip.Root>
        </th>
    );
});
Head.displayName = "TableHead";

const Cell = React.forwardRef<HTMLTableCellElement, ITableCellProps>(({ title, titleAlign, titleSide, className, children, ...props }, ref) => {
    const cellProps = {
        ref,
        className: cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className),
        ...props,
    };

    if (!title) {
        return <td {...cellProps}>{children}</td>;
    }

    return (
        <td {...cellProps}>
            <Tooltip.Root>
                <Tooltip.Trigger>{children}</Tooltip.Trigger>
                <Tooltip.Content align={titleAlign} side={titleSide}>
                    {title}
                </Tooltip.Content>
            </Tooltip.Root>
        </td>
    );
});
Cell.displayName = "TableCell";

const Caption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(({ className, ...props }, ref) => (
    <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
));
Caption.displayName = "TableCaption";

export { Body, Caption, Cell, Footer, Head, Header, Root, Row };
