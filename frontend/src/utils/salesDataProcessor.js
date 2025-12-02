/**
 * Process sales data for mobile dashboard chart
 * Converts user sales data into monthly aggregations for chart display
 */

export const generateMonthlySalesData = (salesRecords, selectedYear) => {
    const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    // Initialize months with zero values
    const monthlyData = monthNames.map((month, index) => ({
        month,
        monthIndex: index,
        sales: 0,
    }));

    // Aggregate sales by month for the selected year
    if (salesRecords && Array.isArray(salesRecords)) {
        salesRecords.forEach(record => {
            if (record.date) {
                const recordDate = new Date(record.date);
                if (recordDate.getFullYear() === selectedYear) {
                    const monthIndex = recordDate.getMonth();
                    monthlyData[monthIndex].sales += record.amount || 0;
                }
            }
        });
    }

    return monthlyData;
};

export const getCurrentYear = () => {
    return new Date().getFullYear();
};

export const getAvailableYears = (salesRecords) => {
    const years = new Set();
    const currentYear = getCurrentYear();

    // Add current year and 2 years back
    years.add(currentYear);
    years.add(currentYear - 1);
    years.add(currentYear - 2);

    // Add any years from sales records
    if (salesRecords && Array.isArray(salesRecords)) {
        salesRecords.forEach(record => {
            if (record.date) {
                const year = new Date(record.date).getFullYear();
                years.add(year);
            }
        });
    }

    return Array.from(years).sort((a, b) => b - a);
};

export const filterSalesRepsByRole = (users) => {
    return users.filter(user => user.role_name === "Sales Representative");
};

export const filterBranchesByNames = (salesData) => {
    // Get unique branches with their names
    const branchMap = new Map();

    salesData.forEach(rep => {
        if (rep.branch_id && rep.branch_name) {
            if (!branchMap.has(rep.branch_id)) {
                branchMap.set(rep.branch_id, {
                    id: rep.branch_id,
                    name: rep.branch_name,
                });
            }
        }
    });

    return Array.from(branchMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
    );
};
