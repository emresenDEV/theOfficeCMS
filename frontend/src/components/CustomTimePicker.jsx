import { useState, useRef, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { getCurrentTime } from "../utils/dateUtils"; // ✅ Import helper function

const hours = Array.from({ length: 12 }, (_, i) => i + 1); // 1–12
const minutes = ["00", "15", "30", "45"]; // 00, 15, 30, 45

const CustomTimePicker = ({ value, onChange, isEndTime, startTime }) => {
    // ✅ Set initial values using `getCurrentTime()`
    const initialTime = useRef(value || getCurrentTime()).current; // Example: "2:30 PM"
    const [selectedHour, setSelectedHour] = useState(initialTime.split(/[: ]/)[0]);
    const [selectedMinute, setSelectedMinute] = useState(initialTime.split(/[: ]/)[1]);
    const [selectedPeriod, setSelectedPeriod] = useState(initialTime.split(/[: ]/)[2]);

    const [showDropdown, setShowDropdown] = useState(false);
    const timeoutRef = useRef(null);

    /** ✅ Handle Time Change */
    const handleTimeChange = useCallback((hour, minute, period) => {
        setSelectedHour(hour);
        setSelectedMinute(minute);
        setSelectedPeriod(period);
        
        const formattedTime = `${hour}:${minute} ${period}`;
        if (onChange) {
            onChange(formattedTime); // ✅ Calls the parent function with updated time
        }
    }, [onChange]);


    /** ✅ Sync End Time with Start Time +1 Hour */
    useEffect(() => {
        if (!isEndTime || !startTime) return; // Only modify end time if necessary

        const [hour, minute, period] = startTime.split(/[: ]/);
        let newHour = parseInt(hour, 10) + 1;
        let newPeriod = period;

        if (newHour > 12) {
            newHour = 1;
            newPeriod = period === "AM" ? "PM" : "AM";
        }

        // ✅ Update only if values actually changed
        if (
            newHour !== parseInt(selectedHour, 10) ||
            minute !== selectedMinute ||
            newPeriod !== selectedPeriod
        ) {
            setSelectedHour(String(newHour));
            setSelectedMinute(minute);
            setSelectedPeriod(newPeriod);
            onChange(`${newHour}:${minute} ${newPeriod}`); // ✅ Correct format
        }
    }, [isEndTime, startTime, selectedHour, selectedMinute, selectedPeriod, onChange]);

    

    /** ✅ Update Selected Time */
    // useEffect(() => {
    //     const time = `${selectedHour}:${selectedMinute} ${selectedPeriod}`;
    //     if (onChange) {
    //         onChange(time);
    //     }
    // }, [selectedHour, selectedMinute, selectedPeriod ]);


    /** ✅ Handle Input Focus/Blur */
    const handleFocus = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            setShowDropdown(true);
        }
    };

    const handleBlur = () => {
        timeoutRef.current = setTimeout(() => setShowDropdown(false), 200);
    };

    /** ✅ Auto-scroll to current time in the dropdown */
    useEffect(() => {
        if (showDropdown) {
            const hourIndex = hours.indexOf(parseInt(selectedHour, 10));
            const minuteIndex = minutes.indexOf(selectedMinute);
            setTimeout(() => {
                document.getElementById(`hour-${hourIndex}`)?.scrollIntoView({ block: "center" });
                document.getElementById(`minute-${minuteIndex}`)?.scrollIntoView({ block: "center" });
            }, 50);
        }
    }, [showDropdown, selectedHour, selectedMinute]);

    return (
        <div className="relative w-full">
            <input
                type="text"
                value={`${selectedHour}:${selectedMinute} ${selectedPeriod}`}
                readOnly
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="HH:MM AM/PM"
                onFocus={handleFocus}
                onBlur={handleBlur}
                aria-label="Time picker"
                aria-expanded={showDropdown}
                aria-haspopup="listbox"
            />
            {showDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto p-2">
                    <div className="flex">
                        {/* Hour Selection */}
                        <div className="flex-1 overflow-y-auto max-h-48 pr-2">
                            {hours.map((hour) => (
                                <div
                                    key={hour}
                                    className={`p-2 text-center rounded-lg cursor-pointer ${
                                        selectedHour === String(hour)
                                            ? "bg-blue-500 text-white"
                                            : "hover:bg-gray-100"
                                    }`}
                                    onClick={() => handleTimeChange(String(hour), selectedMinute, selectedPeriod)}
                                >
                                    {hour}
                                </div>
                            ))}
                        </div>

                        {/* Minute Selection */}
                        <div className="flex-1 overflow-y-auto max-h-48 pr-2">
                            {minutes.map((minute) => (
                                <div
                                    key={minute}
                                    className={`p-2 text-center rounded-lg cursor-pointer ${
                                        selectedMinute === minute
                                            ? "bg-blue-500 text-white"
                                            : "hover:bg-gray-100"
                                    }`}
                                    onClick={() => handleTimeChange(selectedHour, minute, selectedPeriod)}
                                >
                                    {minute}
                                </div>
                            ))}
                        </div>

                        {/* AM/PM Selection */}
                        <div className="flex flex-col justify-center">
                            <div
                                className={`p-2 text-center rounded-lg cursor-pointer ${
                                    selectedPeriod === "AM"
                                        ? "bg-blue-500 text-white"
                                        : "hover:bg-gray-100"
                                }`}
                                onClick={() => handleTimeChange(selectedHour, selectedMinute, "AM")}
                            >
                                AM
                            </div>
                            <div
                                className={`p-2 text-center rounded-lg cursor-pointer ${
                                    selectedPeriod === "PM"
                                        ? "bg-blue-500 text-white"
                                        : "hover:bg-gray-100"
                                }`}
                                onClick={() => handleTimeChange(selectedHour, selectedMinute, "PM")}
                            >
                                PM
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ✅ Prop validation for CustomTimePicker
CustomTimePicker.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    isEndTime: PropTypes.bool,
    startTime: PropTypes.string,
};

export default CustomTimePicker;
