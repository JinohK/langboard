import { cn } from "@/core/utils/ComponentUtils";

export interface IDataTableLoadingProps {
    className?: string;
    searchable?: bool;
    showPagination?: bool;
}

function DataTableLoading({ className, searchable, showPagination }: IDataTableLoadingProps) {
    return (
        <div className={cn("rounded-ele w-full overflow-hidden border border-border bg-card", className)}>
            <div className="animate-pulse p-6">
                {/* Search skeleton */}
                {searchable && <div className="rounded-ele mb-6 h-10 bg-muted"></div>}
                {/* Table skeleton */}
                <div className="rounded-ele overflow-hidden border border-border">
                    <div className="h-12 bg-muted/30"></div>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-14 border-t border-border bg-card"></div>
                    ))}
                </div>
                {/* Pagination skeleton */}
                {showPagination && (
                    <div className="mt-6 flex items-center justify-between">
                        <div className="h-4 w-48 rounded bg-muted"></div>
                        <div className="flex gap-2">
                            <div className="rounded-ele h-9 w-20 bg-muted"></div>
                            <div className="rounded-ele h-9 w-9 bg-muted"></div>
                            <div className="rounded-ele h-9 w-9 bg-muted"></div>
                            <div className="rounded-ele h-9 w-16 bg-muted"></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DataTableLoading;
