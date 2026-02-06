import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend
} from "chart.js";
import { 
    fetchCompanySales, 
    fetchUserSales, 
    fetchBranchSales, 
    fetchBranchUsersSales 
} from "../services/salesService";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import PropTypes from "prop-types";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

const MONTH_LABELS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const CURRENT_YEAR = new Date().getFullYear();
const getChartColor = (index) => {
    if (typeof window === "undefined") return `hsl(${COLORS_FALLBACK[index % COLORS_FALLBACK.length]})`;
    const root = getComputedStyle(document.documentElement);
    const value = root.getPropertyValue(`--chart-${index + 1}`).trim();
    return value ? `hsl(${value})` : `hsl(${COLORS_FALLBACK[index % COLORS_FALLBACK.length]})`;
};

const getChartFill = (index) => {
    if (typeof window === "undefined") return `hsla(${COLORS_FALLBACK[index % COLORS_FALLBACK.length]}, 0.2)`;
    const root = getComputedStyle(document.documentElement);
    const value = root.getPropertyValue(`--chart-${index + 1}`).trim();
    return value ? `hsl(${value} / 0.2)` : `hsla(${COLORS_FALLBACK[index % COLORS_FALLBACK.length]}, 0.2)`;
};

const COLORS_FALLBACK = [
    "221 83% 53%",
    "142 76% 36%",
    "38 92% 50%",
    "199 89% 48%",
    "262 83% 58%",
    "16 84% 56%",
];

const SalesChart = ({ userProfile }) => {
    const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState("company");
    const [companySales, setCompanySales] = useState([]);
    const [userSales, setUserSales] = useState([]);
    const [branchSales, setBranchSales] = useState({});
    const [branchUsersSales, setBranchUsersSales] = useState({});
    const [selectedSalesReps, setSelectedSalesReps] = useState([]);
    const [salesReps, setSalesReps] = useState([]);
    const [allBranches, setAllBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userProfile?.branch_id) return;

        async function fetchSalesData() {
            setLoading(true);
            try {
                const year = selectedYear;
                const branchId = userProfile.branch_id;

                // Fetch sequentially to avoid overwhelming Cloudflare tunnel
                const company = await fetchCompanySales(year);
                setCompanySales(company || Array(12).fill(0));

                const user = await fetchUserSales(userProfile.user_id, year);
                setUserSales(user || Array(12).fill(0));

                const branches = await fetchBranchSales(year);
                setBranchSales(branches || {});

                const reps = await fetchBranchUsersSales(branchId, year);
                setBranchUsersSales(reps || {});

                const branchNames = Object.keys(branches || {});
                setAllBranches(branchNames);

                if (!branchNames.includes(selectedBranch)) {
                    setSelectedBranch(branchNames[0] || "");
                }

                const filteredReps = Object.entries(reps || {})
                    .filter(([_, rep]) => rep.role_id === 3 && rep.branch_id === branchId)
                    .map(([name, rep]) => ({ name, sales: rep.sales || Array(12).fill(0) }));

                setSalesReps(filteredReps);
            } catch (err) {
                console.error("❌ Error loading sales chart data:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchSalesData();
    }, [userProfile, selectedYear]);

    const renderChartData = () => {
        if (activeTab === "company") {
            return [
                {
                    label: "Company-Wide Sales",
                    data: companySales,
                    borderColor: getChartColor(0),
                    backgroundColor: getChartFill(0),
                    pointBackgroundColor: getChartColor(0),
                    fill: true,
                    tension: 0.35,
                },
                {
                    label: `${userProfile.first_name}'s Sales`,
                    data: userSales,
                    borderColor: getChartColor(1),
                    backgroundColor: getChartFill(1),
                    pointBackgroundColor: getChartColor(1),
                    fill: true,
                    tension: 0.35,
                }
            ];
        } else if (activeTab === "branch") {
            return selectedBranch ? [{
                label: `${selectedBranch} Sales`,
                data: branchSales[selectedBranch] || Array(12).fill(0),
                borderColor: getChartColor(2),
                backgroundColor: getChartFill(2),
                pointBackgroundColor: getChartColor(2),
                fill: true,
                tension: 0.35,
            }] : [];
        } else {
            return selectedSalesReps.map((rep, i) => {
                const found = salesReps.find(r => r.name === rep);
                return {
                    label: rep,
                    data: found?.sales || Array(12).fill(0),
                    borderColor: getChartColor(i % COLORS_FALLBACK.length),
                    backgroundColor: getChartFill(i % COLORS_FALLBACK.length),
                    pointBackgroundColor: getChartColor(i % COLORS_FALLBACK.length),
                    fill: false,
                    tension: 0.35,
                };
            });
        }
    };

    if (!userProfile || !userProfile.branch_id) return <p className="text-center text-muted-foreground">Waiting for user profile data...</p>;
    if (loading) return <p className="text-center text-muted-foreground">Loading Sales Data...</p>;

    return (
        <div className="rounded-md border border-border bg-card shadow-card">
            <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer"
                onClick={() => setIsCollapsed((prev) => !prev)}
            >
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-foreground">Sales Performance</h3>
                    <div className="flex gap-1">
                        {["company", "branch", "branchUsers"].map((tab) => (
                        <Button
                            key={tab}
                            size="sm"
                            variant={activeTab === tab ? "default" : "ghost"}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTab(tab);
                                }}
                                className="text-xs capitalize"
                            >
                                {tab === "branchUsers" ? "Sales Reps" : tab}
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        id="yearSelect"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        onClick={(e) => e.stopPropagation()}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        {[...Array(5)].map((_, i) => {
                            const year = CURRENT_YEAR - i;
                            return (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            );
                        })}
                    </select>
                    {isCollapsed ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    )}
                </div>
            </div>

            {!isCollapsed && (
                <div className="px-4 pb-4">
                    {activeTab === "branch" && (
                        <div className="mb-4 flex items-center gap-2">
                            <label htmlFor="branchSelect" className="text-sm font-semibold text-muted-foreground">
                                Select Branch:
                            </label>
                            <select
                                id="branchSelect"
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                {allBranches.map((branch) => (
                                    <option key={branch} value={branch}>
                                        {branch}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {activeTab === "branchUsers" && (
                        <div className="mb-4">
                            <p className="mb-2 text-sm font-semibold text-muted-foreground">Select Sales Representatives:</p>
                            <div className="flex flex-wrap gap-2">
                                {salesReps.map((rep) => (
                                    <Button
                                        key={rep.name}
                                        size="sm"
                                        variant={selectedSalesReps.includes(rep.name) ? "default" : "ghost"}
                                        className={cn("text-xs")}
                                        onClick={() =>
                                            setSelectedSalesReps((prev) =>
                                                prev.includes(rep.name)
                                                    ? prev.filter((r) => r !== rep.name)
                                                    : [...prev, rep.name]
                                            )
                                        }
                                    >
                                        {rep.name}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    <Line
                        data={{ labels: MONTH_LABELS, datasets: renderChartData() }}
                        options={{
                            responsive: true,
                            plugins: {
                                legend: { display: true, labels: { color: "hsl(var(--foreground))" } },
                                tooltip: { enabled: true }
                            },
                            scales: {
                                x: { ticks: { color: "hsl(var(--muted-foreground))" }, grid: { display: false } },
                                y: { ticks: { color: "hsl(var(--muted-foreground))" } }
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
};

SalesChart.propTypes = {
    userProfile: PropTypes.shape({
        user_id: PropTypes.number.isRequired,
        first_name: PropTypes.string.isRequired,
        last_name: PropTypes.string.isRequired,
        email: PropTypes.string.isRequired,
        branch_id: PropTypes.number.isRequired,
        branch_name: PropTypes.string.isRequired,
        role_id: PropTypes.number.isRequired,
        role_name: PropTypes.string.isRequired,
        department_id: PropTypes.number.isRequired,
        department_name: PropTypes.string.isRequired,
    }).isRequired,
};

export default SalesChart;
