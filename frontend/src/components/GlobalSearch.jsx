import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { format } from "date-fns";
import { Input } from "./ui/input";
import { cn } from "../lib/utils";
import { fetchAssignedAccounts } from "../services/accountService";
import { fetchInvoices } from "../services/invoiceService";
import { fetchTasks } from "../services/tasksService";
import { fetchCalendarEvents } from "../services/calendarService";

const CACHE_TTL = 60_000;

const GlobalSearch = ({ user }) => {
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const cacheRef = useRef({ timestamp: 0, accounts: [], invoices: [], tasks: [], events: [] });
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);

    const trimmedQuery = query.trim().toLowerCase();

    const loadData = async () => {
        if (!user?.id && !user?.user_id) return null;
        const userId = user.user_id || user.id;
        const now = Date.now();
        if (now - cacheRef.current.timestamp < CACHE_TTL) {
            return cacheRef.current;
        }

        setLoading(true);
        try {
            const [accounts, invoices, tasks, events] = await Promise.all([
                fetchAssignedAccounts(userId),
                fetchInvoices(userId),
                fetchTasks(userId),
                fetchCalendarEvents(userId),
            ]);
            const payload = {
                timestamp: Date.now(),
                accounts: accounts || [],
                invoices: invoices || [],
                tasks: tasks || [],
                events: events || [],
            };
            cacheRef.current = payload;
            return payload;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!trimmedQuery) {
            setResults([]);
            return;
        }

        const timeout = setTimeout(async () => {
            const data = await loadData();
            if (!data) return;

            const matches = [];

            data.accounts.forEach((acc) => {
                const haystack = `${acc.business_name} ${acc.contact_name || ""} ${acc.email || ""}`.toLowerCase();
                if (haystack.includes(trimmedQuery)) {
                    matches.push({
                        id: `account-${acc.account_id}`,
                        title: acc.business_name,
                        subtitle: acc.contact_name || "Account",
                        type: "Account",
                        href: `/accounts/details/${acc.account_id}`,
                    });
                }
            });

            data.invoices.forEach((inv) => {
                const haystack = `${inv.invoice_id} ${inv.status || ""}`.toLowerCase();
                if (haystack.includes(trimmedQuery)) {
                    matches.push({
                        id: `invoice-${inv.invoice_id}`,
                        title: `Invoice #${inv.invoice_id}`,
                        subtitle: inv.status || "Invoice",
                        type: "Invoice",
                        href: `/invoice/${inv.invoice_id}`,
                    });
                }
            });

            data.tasks.forEach((task) => {
                const text = task.task_description || task.description || task.title || "";
                const haystack = `${text}`.toLowerCase();
                if (haystack.includes(trimmedQuery)) {
                    matches.push({
                        id: `task-${task.task_id}`,
                        title: text || "Task",
                        subtitle: task.account_name || "Task",
                        type: "Task",
                        href: "/tasks",
                    });
                }
            });

            data.events.forEach((event) => {
                const haystack = `${event.title || ""} ${event.location || ""} ${event.account_name || ""}`.toLowerCase();
                if (haystack.includes(trimmedQuery)) {
                    const dateLabel = event.start_date || event.start || event.date;
                    const formatted = dateLabel ? format(new Date(dateLabel), "MMM d") : "Event";
                    matches.push({
                        id: `event-${event.event_id || event.id}`,
                        title: event.title || "Calendar Event",
                        subtitle: formatted,
                        type: "Calendar",
                        href: dateLabel ? `/calendar?date=${format(new Date(dateLabel), "yyyy-MM-dd")}` : "/calendar",
                    });
                }
            });

            setResults(matches.slice(0, 10));
        }, 300);

        return () => clearTimeout(timeout);
    }, [trimmedQuery]);

    useEffect(() => {
        const handler = (event) => {
            if (!containerRef.current?.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleSelect = (href) => {
        setOpen(false);
        setQuery("");
        navigate(href);
    };

    return (
        <div ref={containerRef} className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                value={query}
                onFocus={() => setOpen(true)}
                onChange={(event) => {
                    setQuery(event.target.value);
                    setOpen(true);
                }}
                placeholder="Search accounts, invoices, tasks..."
                className="pl-9"
            />

            {open && (trimmedQuery || loading) && (
                <div className="absolute z-40 mt-2 w-full rounded-md border border-border bg-popover shadow-lg">
                    {loading && (
                        <div className="px-4 py-3 text-sm text-muted-foreground">Searching…</div>
                    )}
                    {!loading && results.length === 0 && (
                        <div className="px-4 py-3 text-sm text-muted-foreground">No results found.</div>
                    )}
                    {!loading && results.length > 0 && (
                        <div className="max-h-80 overflow-y-auto py-2">
                            {results.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleSelect(item.href)}
                                    className={cn(
                                        "flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors",
                                        "hover:bg-accent hover:text-accent-foreground"
                                    )}
                                >
                                    <div>
                                        <p className="font-medium text-foreground">{item.title}</p>
                                        <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                                    </div>
                                    <span className="text-xs font-semibold text-muted-foreground">
                                        {item.type}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;

GlobalSearch.propTypes = {
    user: PropTypes.object,
};
