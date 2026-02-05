import { useState } from "react";
import Sidebar from "./Sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { TooltipProvider } from "./ui/tooltip";
import GlobalSearch from "./GlobalSearch";
import NotificationBell from "./NotificationBell";
import QuickAddModal from "./QuickAddModal";

const Layout = ({ children, sidebarOpen, setSidebarOpen, user, handleLogout }) => {
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    return (
        <TooltipProvider delayDuration={0}>
            <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
                {/* Sidebar */}
                <Sidebar
                    isOpen={sidebarOpen}
                    toggleSidebar={() => setSidebarOpen(false)}
                    user={user}
                    handleLogout={handleLogout}
                />

                {/* Main Content Area */}
                <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    {/* Top Bar */}
                    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
                        <div className="flex min-h-16 flex-wrap items-center gap-3 px-3 py-2 md:h-16 md:flex-nowrap md:px-6 md:py-0">
                            {/* Mobile hamburger button */}
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground shadow-sm hover:bg-muted"
                                aria-label="Toggle sidebar"
                            >
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                </svg>
                            </button>

                            <div className="hidden md:flex flex-col">
                                <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Dunder Mifflin</span>
                                <span className="text-base font-semibold text-foreground">Sales Console</span>
                            </div>

                            <div className="order-3 w-full md:order-none md:w-auto md:flex-1">
                                <GlobalSearch user={user} />
                            </div>

                            <div className="hidden sm:flex items-center gap-2">
                                <button
                                    className="rounded-md border border-border bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground shadow-sm hover:bg-secondary/80"
                                    onClick={() => setShowQuickAdd(true)}
                                >
                                    Quick Add
                                </button>
                            <NotificationBell user={user} />
                            <ThemeToggle />
                            </div>
                            <div className="order-2 ml-auto flex items-center gap-2 sm:hidden">
                                <button
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground shadow-sm hover:bg-muted"
                                    onClick={() => setShowQuickAdd(true)}
                                    aria-label="Quick add"
                                >
                                    +
                                </button>
                                <NotificationBell user={user} />
                                <ThemeToggle size="sm" />
                            </div>
                        </div>
                    </header>

                    {/* Overlay on mobile when sidebar is open */}
                    {sidebarOpen && (
                        <div
                            className="md:hidden fixed inset-0 bg-black/40 z-20"
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}

                    {/* Page Content */}
                    <div className="w-full flex-1 overflow-auto">
                        {children}
                    </div>
                </main>
            </div>
            <QuickAddModal open={showQuickAdd} onClose={() => setShowQuickAdd(false)} user={user} />
        </TooltipProvider>
    );
};

export default Layout;
