import Link from "next/link";
import { Search } from "lucide-react";

/** Looks like an input but navigates to the dedicated search page. */
export function ShopSearchBar() {
    return (
        <Link
            href="/search"
            aria-label="جستجو"
            className="flex h-14 w-full items-center justify-between rounded-full bg-muted px-5 text-muted-foreground transition-colors active:bg-muted/70"
        >
            <span className="text-base">جستجو</span>
            <Search className="size-6 text-foreground" aria-hidden />
        </Link>
    );
}