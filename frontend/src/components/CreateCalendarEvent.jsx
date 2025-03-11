import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { createCalendarEvent } from "../services/calendarService";
import { fetchAccounts } from "../services/accountService";
import CustomTimePicker from "./CustomTimePicker";
import { getCurrentDate, getCurrentTime } from "../utils/dateUtils";

const CreateCalendarEvent = ({ userId, setEvents }) => {
    const navigate = useNavigate();
    const initialStartTime = getCurrentTime();
    const initialEndTime = addOneHour(initialStartTime); // ✅ Ensure `end_time` is 1 hour ahead

    const [newEvent, setNewEvent] = useState({
        event_title: "",
        account_id: null,
        contact_name: "",
        phone_number: "",
        address: "",
        city: "",
        state: "",
        zip_code: "",
        start_date: getCurrentDate(),
        start_time: initialStartTime,
        end_date: getCurrentDate(),
        end_time: initialEndTime,
        notes: "",
        end_time_modified: false, // ✅ Track if the user manually changes end time
    });

    const [showModal, setShowModal] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [accountSearch, setAccountSearch] = useState("");
    const [filteredAccounts, setFilteredAccounts] = useState([]);

    /** ✅ Fetch Account List */
    useEffect(() => {
        async function loadAccounts() {
            const fetchedAccounts = await fetchAccounts();
            setAccounts(fetchedAccounts);
        }
        loadAccounts();
    }, []);

    /** ✅ Dynamic Account Search */
    useEffect(() => {
        if (accountSearch.trim() === "") {
            setFilteredAccounts([]);
            return;
        }

        const matches = accounts.filter((account) =>
            account.business_name.toLowerCase().includes(accountSearch.toLowerCase())
        );
        setFilteredAccounts(matches);
    }, [accountSearch, accounts]);

    /** ✅ Handle Input Change */
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewEvent(prevEvent => ({
            ...prevEvent,
            [name]: value,
        }));
    };

    /** ✅ Add One Hour to Time */
    const addOneHour = (time) => {
        const [hour, minute, period] = time.split(/[: ]/);
        let hourNum = parseInt(hour, 10);
        if (period === "PM" && hourNum !== 12) {
            hourNum += 12;
        }
        if (period === "AM" && hourNum === 12) {
            hourNum = 0;
        }
        hourNum = (hourNum + 1) % 24; // ✅ Ensure it loops within 24-hour time
        const newPeriod = hourNum >= 12 ? "PM" : "AM";
        const newHour = hourNum % 12 || 12; // ✅ Convert back to 12-hour format
        return `${newHour}:${minute} ${newPeriod}`;
    };

    /** ✅ Handle Time Change */
    const handleTimeChange = (name, value) => {
        setNewEvent(prevEvent => {
            let newEndTime = prevEvent.end_time;

            if (name === "start_time" && !prevEvent.end_time_modified) {
                newEndTime = addOneHour(value);
            }

            return {
                ...prevEvent,
                [name]: value,
                end_time: newEndTime,
            };
        });
    };

    /** ✅ Track when user manually changes end time */
    const handleEndTimeChange = (value) => {
        setNewEvent(prevEvent => ({
            ...prevEvent,
            end_time: value,
            end_time_modified: true,
        }));
    };

    /** ✅ Handle Creating an Event */
    const handleCreateEvent = async (e) => {
        e.preventDefault();
    
        if (!newEvent.event_title.trim() || !newEvent.start_date) {
            alert("⚠️ Event title, start date, and start time are required.");
            return;
        }
    
        try {
            const createdEvent = await createCalendarEvent({ ...newEvent, user_id: userId });
    
            if (createdEvent) {
                setEvents(prev => [...prev, createdEvent]); // ✅ Update event list
                navigate("/dashboard"); // ✅ Redirect after creation
            }
        } catch (error) {
            console.error("❌ Error creating event:", error.response?.data || error.message);
            alert("Failed to create event. Check console logs.");
        }
    };

    return (
        <div className="mt-6">
            <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md"
                onClick={() => setShowModal(true)}
            >
                Create Event
            </button>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-1/2 relative">
                        <button
                            className="absolute top-2 left-2 text-gray-500 hover:text-gray-700"
                            onClick={() => setShowModal(false)}
                        >
                            ✖
                        </button>

                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Create Event</h2>

                        {/* 🔹 Event Title */}
                        <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                        <input
                            type="text"
                            name="event_title"
                            value={newEvent.event_title}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            placeholder="Enter event title"
                        />

                        {/* 🔹 Account Search & Selection */}
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search for an Account</label>
                        <input
                            type="text"
                            value={accountSearch}
                            onChange={(e) => setAccountSearch(e.target.value)}
                            placeholder="Search by account name..."
                            className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                        {filteredAccounts.length > 0 && (
                            <ul className="absolute bg-white border w-full mt-1 rounded shadow-lg max-h-48 overflow-y-auto">
                                {filteredAccounts.map((account) => (
                                    <li
                                        key={account.account_id}
                                        onClick={() => {
                                            setNewEvent({
                                                ...newEvent,
                                                account_id: account.account_id,
                                                contact_name: account.contact_name || "",
                                                phone_number: account.phone_number || "",
                                            });
                                            setAccountSearch(account.business_name);
                                            setFilteredAccounts([]);
                                        }}
                                        className="p-2 hover:bg-gray-200 cursor-pointer"
                                    >
                                        {account.business_name}
                                    </li>
                                ))}
                            </ul>
                        )}

                        {/* 🔹 Start & End Time */}
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                        <CustomTimePicker value={newEvent.start_time} onChange={(value) => handleTimeChange("start_time", value)} />
                        
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                        <CustomTimePicker value={newEvent.end_time} onChange={handleEndTimeChange} />

                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg mt-4" onClick={handleCreateEvent}>
                            Save
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ✅ PropTypes Validation
CreateCalendarEvent.propTypes = {
    userId: PropTypes.number.isRequired,
    setEvents: PropTypes.func.isRequired,
};

export default CreateCalendarEvent;
