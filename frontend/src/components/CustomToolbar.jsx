import PropTypes from "prop-types";

const CustomToolbar = ({ label, onNavigate, onView, view, views }) => {
const goToBack = () => onNavigate("PREV");
const goToNext = () => onNavigate("NEXT");
const goToToday = () => onNavigate("TODAY");

return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 px-4 gap-4">
    {/* Navigation Buttons */}
    <div className="flex items-center space-x-2">
        <button
        onClick={goToToday}
        className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
        >
        Today
        </button>
        <button
        onClick={goToBack}
        className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
        >
        ‹
        </button>
        <button
        onClick={goToNext}
        className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
        >
        ›
        </button>
    </div>

    {/* Month and Year */}
    <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 text-center tracking-tight">
        {label}
    </div>

    {/* View Switcher */}
    <div className="flex items-center space-x-2">
        {views.map((viewName) => (
        <button
            key={viewName}
            onClick={() => onView(viewName)}
            className={`px-3 py-1 rounded text-sm sm:text-base ${
            view === viewName
                ? "bg-blue-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
        >
            {viewName.charAt(0).toUpperCase() + viewName.slice(1)}
        </button>
        ))}
    </div>
    </div>
);
};

CustomToolbar.propTypes = {
label: PropTypes.string.isRequired,
onNavigate: PropTypes.func.isRequired,
onView: PropTypes.func.isRequired,
view: PropTypes.string.isRequired,
views: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default CustomToolbar;
