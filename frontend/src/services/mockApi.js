const MOCK_DELAY_MS = Number(import.meta.env.VITE_MOCK_DELAY_MS || 200);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const mockUser = {
    id: 101,
    user_id: 101,
    username: "jhalpe",
    first_name: "Pam",
    last_name: "Beesly",
    email: "pam.beesly@dundermifflin.com",
    phone_number: "555-0101",
    role_id: 3,
    role_name: "Sales Representative",
    department_id: 2,
    department_name: "Sales",
    branch_id: 1,
    branch_name: "Scranton",
    total_sales: 325000,
};

const mockUsers = [
    mockUser,
    {
        id: 102,
        user_id: 102,
        first_name: "Jim",
        last_name: "Halpert",
        email: "jim.halpert@dundermifflin.com",
        phone_number: "555-0102",
        role_id: 3,
        role_name: "Sales Representative",
        department_id: 2,
        department_name: "Sales",
        branch_id: 1,
        branch_name: "Scranton",
        total_sales: 410000,
    },
    {
        id: 201,
        user_id: 201,
        first_name: "Michael",
        last_name: "Scott",
        email: "michael.scott@dundermifflin.com",
        phone_number: "555-0201",
        role_id: 2,
        role_name: "Branch Manager",
        department_id: 1,
        department_name: "Management",
        branch_id: 1,
        branch_name: "Scranton",
        total_sales: 0,
    },
];

const mockAccounts = [
    {
        account_id: 1001,
        business_name: "Staples",
        contact_name: "Tim Robertson",
        phone_number: "570-555-0111",
        email: "tim@staples.com",
        address: "1200 Scranton Ave",
        city: "Scranton",
        state: "PA",
        zip_code: "18503",
        industry_name: "Retail",
        sales_rep_id: 101,
    },
    {
        account_id: 1002,
        business_name: "Penn Paper Co.",
        contact_name: "Sarah Lyons",
        phone_number: "570-555-0122",
        email: "sarah@pennpaper.com",
        address: "44 Market St",
        city: "Scranton",
        state: "PA",
        zip_code: "18503",
        industry_name: "Manufacturing",
        sales_rep_id: 101,
    },
    {
        account_id: 1003,
        business_name: "Schrute Farms",
        contact_name: "Dwight Schrute",
        phone_number: "570-555-0133",
        email: "dwight@schrutefarms.com",
        address: "Route 6",
        city: "Honesdale",
        state: "PA",
        zip_code: "18431",
        industry_name: "Agriculture",
        sales_rep_id: 102,
    },
];

const mockAccountMetrics = [
    {
        account_id: 1001,
        task_count: 4,
        total_revenue: 86000,
        last_invoice_date: "2025-12-12",
    },
    {
        account_id: 1002,
        task_count: 2,
        total_revenue: 54000,
        last_invoice_date: "2025-11-03",
    },
    {
        account_id: 1003,
        task_count: 6,
        total_revenue: 120000,
        last_invoice_date: "2025-10-18",
    },
];

const mockTasks = [
    {
        task_id: 501,
        title: "Follow up with Staples",
        description: "Confirm Q1 order quantities.",
        is_completed: false,
        assigned_to: 101,
        due_date: "2026-02-10",
    },
    {
        task_id: 502,
        title: "Renew Penn Paper contract",
        description: "Schedule renewal meeting.",
        is_completed: true,
        assigned_to: 101,
        due_date: "2026-02-07",
    },
];

const mockEvents = [
    {
        id: 701,
        title: "Client Review: Staples",
        start: "2026-02-06T14:00:00",
        end: "2026-02-06T15:00:00",
        user_id: 101,
        location: "Zoom",
    },
    {
        id: 702,
        title: "Pipeline Sync",
        start: "2026-02-08T10:00:00",
        end: "2026-02-08T10:30:00",
        user_id: 101,
        location: "Conference Room A",
    },
];

const mockNotifications = [
    {
        notification_id: 9001,
        user_id: 101,
        type: "task_assigned",
        title: "New task assigned",
        message: "Follow up with Staples",
        link: "/tasks",
        is_read: false,
        created_at: "2026-02-04 09:15:00",
    },
    {
        notification_id: 9002,
        user_id: 101,
        type: "event_reminder",
        title: "Upcoming event: Client Review",
        message: "Starts at 2:00 PM",
        link: "/calendar?date=2026-02-06",
        is_read: true,
        created_at: "2026-02-04 08:05:00",
    },
];

const buildSalesSeries = (seed = 1) =>
    Array.from({ length: 12 }, (_, i) => Math.round((i + 1) * 4200 + seed * 350));

const mockBranchSales = {
    Scranton: buildSalesSeries(1),
    Stamford: buildSalesSeries(2),
    Utica: buildSalesSeries(3),
};

const mockBranchUsersSales = {
    "Pam Beesly": {
        role_id: 3,
        branch_id: 1,
        sales: buildSalesSeries(1),
    },
    "Jim Halpert": {
        role_id: 3,
        branch_id: 1,
        sales: buildSalesSeries(2),
    },
};

const ok = (config, data) => ({
    data,
    status: 200,
    statusText: "OK",
    headers: {},
    config,
});

const getPath = (url = "") => {
    if (url.startsWith("http")) {
        try {
            return new URL(url).pathname;
        } catch {
            return url;
        }
    }
    return url.split("?")[0];
};

export const mockAdapter = async (config) => {
    await delay(MOCK_DELAY_MS);

    const method = (config.method || "get").toLowerCase();
    const path = getPath(config.url || "");

    if (method === "post" && path === "/auth/login") {
        return ok(config, {
            message: "Login successful",
            user: {
                id: mockUser.id,
                username: mockUser.username,
                email: mockUser.email,
                first_name: mockUser.first_name,
                last_name: mockUser.last_name,
            },
        });
    }

    if (method === "get" && path === "/auth/session") {
        return ok(config, { ...mockUser });
    }

    if (method === "post" && path === "/auth/logout") {
        return ok(config, { success: true });
    }

    if (method === "get" && path === "/users") {
        return ok(config, mockUsers);
    }

    if (method === "get" && path.startsWith("/users/")) {
        const id = Number(path.replace("/users/", ""));
        const found = mockUsers.find((u) => u.user_id === id || u.id === id);
        return ok(config, found || mockUser);
    }

    if (method === "get" && path === "/accounts") {
        return ok(config, mockAccounts);
    }

    if (method === "get" && path === "/accounts/assigned") {
        return ok(config, mockAccounts.filter((acc) => acc.sales_rep_id === mockUser.user_id));
    }

    if (method === "get" && path === "/accounts/account_metrics") {
        return ok(config, mockAccountMetrics);
    }

    if (method === "get" && path.startsWith("/accounts/details/")) {
        const id = Number(path.replace("/accounts/details/", ""));
        const base = mockAccounts.find((acc) => acc.account_id === id) || mockAccounts[0];
        return ok(config, {
            ...base,
            notes: "Mock account details for UI review.",
        });
    }

    if (method === "get" && path === "/tasks") {
        return ok(config, mockTasks);
    }

    if (method === "put" && path.startsWith("/tasks/")) {
        const id = Number(path.replace("/tasks/", ""));
        const payload = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
        const existing = mockTasks.find((task) => task.task_id === id) || mockTasks[0];
        return ok(config, { ...existing, ...payload });
    }

    if (method === "get" && path === "/calendar/events") {
        return ok(config, mockEvents);
    }

    if (method === "post" && path === "/calendar/events") {
        const payload = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
        return ok(config, { id: Date.now(), ...payload });
    }

    if (method === "get" && path === "/notifications") {
        return ok(config, mockNotifications);
    }

    if (method === "put" && path.endsWith("/read")) {
        return ok(config, { message: "Notification marked as read" });
    }

    if (method === "put" && path === "/notifications/read_all") {
        return ok(config, { message: "All notifications marked as read" });
    }

    if (method === "get" && path === "/sales/company") {
        return ok(config, buildSalesSeries(1));
    }

    if (method === "get" && path === "/sales/user") {
        return ok(config, buildSalesSeries(2));
    }

    if (method === "get" && path === "/sales/branch") {
        return ok(config, mockBranchSales);
    }

    if (method === "get" && path === "/sales/branch-users") {
        return ok(config, mockBranchUsersSales);
    }

    if (method === "get") {
        return ok(config, []);
    }

    return ok(config, { success: true });
};
