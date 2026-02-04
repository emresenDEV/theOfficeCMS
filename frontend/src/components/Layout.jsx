import Sidebar from "./Sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { TooltipProvider } from "./ui/tooltip";
import GlobalSearch from "./GlobalSearch";
import NotificationBell from "./NotificationBell";

const Layout = ({ children, sidebarOpen, setSidebarOpen, user, handleLogout }) => {
    return (
        <TooltipProvider delayDuration={0}>
            <div className="flex min-h-screen w-full bg-background text-foreground">
                {/* Sidebar */}
                <Sidebar
                    isOpen={sidebarOpen}
                    toggleSidebar={() => setSidebarOpen(false)}
                    user={user}
                    handleLogout={handleLogout}
                />

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    {/* Top Bar */}
                    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
                        <div className="flex h-16 items-center gap-3 px-4 md:px-6">
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

                            <div className="flex-1">
                                <GlobalSearch user={user} />
                            </div>

                            <div className="hidden sm:flex items-center gap-2">
                                <button className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm hover:bg-muted">
                                    Quick Add
                                </button>
                            <NotificationBell user={user} />
                            <ThemeToggle />
                            </div>
                            <div className="flex sm:hidden">
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
        </TooltipProvider>
    );
};

export default Layout;
