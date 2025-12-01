import Sidebar from "./Sidebar";

const Layout = ({ children, sidebarOpen, setSidebarOpen, user, handleLogout }) => {
    return (
        <div className="flex h-screen w-full bg-gray-100">
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} user={user} handleLogout={handleLogout} />

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto">
                {/* Mobile hamburger button */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="md:hidden fixed top-4 left-4 bg-gray-800 text-white p-2 rounded-md z-50"
                    aria-label="Toggle sidebar"
                >
                    <svg
                        className="w-5 h-5"
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

                {/* Overlay on mobile when sidebar is open */}
                {sidebarOpen && (
                    <div
                        className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Page Content */}
                <div className="w-full h-full">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
