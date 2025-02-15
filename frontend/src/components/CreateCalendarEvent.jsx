import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { createCalendarEvent } from "../services/calendarService";
import { fetchAccounts } from "../services/accountService";
import CustomTimePicker from "./CustomTimePicker";
import { getCurrentDate, getCurrentTime } from "../utils/dateUtils";

const CreateCalendarEvent = ({ userId, setEvents }) => {
    const initialStartTime = getCurrentTime();
    const initialEndTime = getCurrentTime(true);

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
        setNewEvent((prevEvent) => ({
            ...prevEvent,
            [name]: value,
        }));
    };

    /** ✅ Handle Time Change (Custom Time Picker) */
    const handleTimeChange = (name, value) => {
        setNewEvent((prevEvent) => ({
            ...prevEvent,
            [name]: value, // ✅ Store in AM/PM format in UI
            [`${name}_24h`]: convertTo24HourFormat(value), // ✅ Store in 24-hour format for the database
        }));
    };

    /** ✅ Convert Time to 24 hour Format for Database */
    const convertTo24HourFormat = (time) => {
        const [hour, minute, period] = time.split(/[: ]/);
        let hour24 = parseInt(hour, 10);
        if (period === "PM" && hour24 !== 12) {
            hour24 += 12;
        }
        if (period === "AM" && hour24 === 12) {
            hour24 = 0;
        }
        return `${String(hour24).padStart(2, "0")}:${minute}`;
    };
    
    /** ✅ Handle Creating an Event */
    const handleCreateEvent = async (e) => {
        e.stopPropagation(); // Prevents clicking outside from closing modal

        if (!newEvent.event_title.trim() || !newEvent.start_date) {
            alert("⚠️ Event title, start date, and start time are required.");
            return;
        }

        // ✅ Convert start/end time to 24-hour format before sending
        const eventToSend = {
            ...newEvent,
            start_time: convertTo24HourFormat(newEvent.start_time), 
            end_time: convertTo24HourFormat(newEvent.end_time), 
        };

        console.log("📤 Sending Event Data:", eventToSend); // ✅ Debugging log

        try {
            const createdEvent = await createCalendarEvent({ ...eventToSend, user_id: userId });

            if (createdEvent) {
                setEvents(prev => [...prev, createdEvent]);
                setShowModal(false);

                // ✅ Reset form
                setNewEvent({
                    event_title: "",
                    account_id: null,
                    contact_name: "",
                    phone_number: "",
                    address: "",
                    city: "",
                    state: "",
                    zip_code: "",
                    start_date: getCurrentDate(),
                    start_time: getCurrentTime(),
                    end_date: getCurrentDate(),
                    end_time: getCurrentTime(true),
                    notes: "",
                });
            }
        } catch (error) {
            console.error("❌ Error creating event:", error.response?.data || error.message);
            alert("Failed to create event. Check console logs.");
        }
    };
    return (
        <div className="mt-6">
            {/* Create Event Button */}
            <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                onClick={(e) => {
                    e.stopPropagation(); //prevent click from triggering calendar
                    setShowModal(true)
                }}
            >
                Create Event
            </button>

            {/* Modal */}
            {showModal && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
                    onClick={(e) => e.stopPropagation()} //prevent click from closing modal
                    >
                    <div className="bg-white p-6 rounded-lg shadow-lg w-1/2 relative" onClick={(e) => e.stopPropagation()}>
                        {/* Cancel Button (X) */}
                            <button
                                className="absolute top-2 left-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                onClick={() => setShowModal(false)}
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        {/* Modal Header */}
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Create Event</h2>

                        {/* Event Title */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Event Title</label>
                            <input
                                type="text"
                                name="event_title"
                                value={newEvent.event_title}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter event title"
                            />
                        </div>

                        {/* Account Search */}
                        <div className="mb-4 relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Search for an Account</label>
                            <input
                                type="text"
                                value={accountSearch}
                                onChange={(e) => setAccountSearch(e.target.value)}
                                placeholder="Search by account name..."
                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                                    address: account.address || "",
                                                    city: account.city || "",
                                                    state: account.state || "",
                                                    zip_code: account.zip_code || "",
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
                        </div>
                        {/* Contact Name and Phone Number on one line */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {/* Contact Name */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Contact Name</label>
                                <input
                                    type="text"
                                    value={newEvent.contact_name}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter contact name"
                                />
                            </div>

                            {/* Phone Number */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Phone Number</label>
                                <input
                                    type="text"
                                    value={newEvent.phone_number}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter phone number"
                                />
                            </div>
                        </div>
                                                
                        {/* Address */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Address</label>
                            <input
                                type="text"
                                name="address"
                                value={newEvent.address}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter Address"
                            />
                        </div>
                        {/* City, State, Zipcode on Single-Line */}
                        <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">City</label>
                            <input
                                type="text"
                                name="city"
                                value={newEvent.city}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter City"
                            />
                        </div>
                            {/* State */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">State</label>
                            <input
                                type="text"
                                name="state"
                                value={newEvent.state}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter State"
                            />
                        </div>
                            {/* Zipcode */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Zip Code</label>
                            <input
                                type="numerical"
                                name="zip_code"
                                value={newEvent.zip_code}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter Zip Code"
                            />
                        </div>
                    </div>

                        {/* Start Date & Time */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Start Date</label>
                                <input
                                    type="date"
                                    name="start_date"
                                    value={newEvent.start_date}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Start Time</label>
                                <CustomTimePicker
                                    value={newEvent.start_time}
                                    onChange={(value) => handleTimeChange("start_time", value)}
                                />          
                            </div>
                        </div>

                        {/* End Date & Time */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">End Date</label>
                                <input
                                    type="date"
                                    name="end_date"
                                    value={newEvent.end_date}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">End Time</label>
                                <CustomTimePicker 
                                    value={newEvent.end_time} 
                                    onChange={(value) => handleTimeChange("end_time", value)}
                                    isEndTime={true}
                                    startTime={newEvent.start_time}
                                    />
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Notes</label>
                            <textarea
                                type="text"
                                name="notes"
                                value={newEvent.notes}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Add notes"
                                rows="3"
                            ></textarea>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-2">
                            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50" onClick={handleCreateEvent}>Save</button>
                        </div>
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

