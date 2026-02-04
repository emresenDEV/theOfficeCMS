import Sidebar from "./Sidebar";
import { ThemeToggle } from "./ThemeToggle";

const Layout = ({ children, sidebarOpen, setSidebarOpen, user, handleLogout }) => {
    return (
        <div className="flex min-h-screen w-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            {/* Sidebar */}
            <Sidebar
                isOpen={sidebarOpen}
                toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                user={user}
                handleLogout={handleLogout}
            />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                    <div className="flex h-16 items-center gap-3 px-4 md:px-6">
                        {/* Mobile hamburger button */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
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
                            <span className="text-[11px] uppercase tracking-widest text-slate-400 dark:text-slate-500">Dunder Mifflin</span>
                            <span className="text-base font-semibold text-slate-900 dark:text-slate-100">Sales Console</span>
                        </div>

                        <div className="flex-1">
                            <div className="relative max-w-xl">
                                <svg
                                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-4.35-4.35m1.1-4.65a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search accounts, invoices, tasks..."
                                    className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-900/40"
                                />
                            </div>
                        </div>

                        <div className="hidden sm:flex items-center gap-2">
                            <button className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                                Quick Add
                            </button>
                            <button className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
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
                                        d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0"
                                    />
                                </svg>
                            </button>
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
                        className="md:hidden fixed inset-0 bg-slate-900/40 z-20"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Page Content */}
                <div className="w-full flex-1 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
