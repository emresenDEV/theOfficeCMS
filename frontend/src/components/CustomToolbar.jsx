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
        className="bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200"
        >
        Today
        </button>
        <button
        onClick={goToBack}
        className="bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200"
        >
        ‹
        </button>
        <button
        onClick={goToNext}
        className="bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200"
        >
        ›
        </button>
    </div>

    {/* Month and Year */}
    <div className="text-3xl sm:text-4xl font-extrabold text-gray-900 text-center tracking-tight">
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
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
