import PropTypes from "prop-types";

const CommissionsDataTable = ({ viewMode, data }) => {
    const getLabel = (index) => {
        const idx = parseInt(index);
        if (viewMode === "monthly") {
            return new Date(0, idx).toLocaleString("default", { month: "long" });
        }
        if (viewMode === "weekly") {
            return `Week ${idx + 1}`;
        }
        return index; // Year (no formatting)
    };
    

    return (
        <div className="mt-6">
            <h2 className="text-lg font-bold mb-2 text-foreground">📊 Commission Breakdown</h2>
            <div className="border border-border rounded-md overflow-hidden bg-card shadow">
                <table className="w-full text-left text-foreground">
                    <thead className="bg-muted text-sm uppercase">
                        <tr>
                            <th className="px-4 py-2">Period</th>
                            <th className="px-4 py-2 text-right">Commission ($)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(data).map(([key, value], idx) => (
                            <tr key={idx} className="border-t">
                                <td className="px-4 py-2">{getLabel(key)}</td>
                                <td className="px-4 py-2 text-green-600 font-semibold text-right">${Number(value).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

CommissionsDataTable.propTypes = {
    viewMode: PropTypes.string.isRequired,
    data: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.number), // For month/week view
        PropTypes.object, // For yearly view
    ]).isRequired,
};

export default CommissionsDataTable;
