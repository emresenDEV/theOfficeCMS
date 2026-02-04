import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { createCalendarEvent } from "../services/calendarService";
import { fetchAccounts } from "../services/accountService";
import CustomTimePicker from "./CustomTimePicker";
import { getCurrentDate, getCurrentTime } from "../utils/dateUtils";
import { FiClock, FiCalendar } from "react-icons/fi";

/** Add One Hour to Time */
const addOneHour = (time) => {
    const [hour, minute, period] = time.split(/[: ]/);
    let hourNum = parseInt(hour, 10);

    if (period === "PM" && hourNum !== 12) hourNum += 12;
    if (period === "AM" && hourNum === 12) hourNum = 0;

    hourNum = (hourNum + 1) % 24;
    const newPeriod = hourNum >= 12 ? "PM" : "AM";
    const newHour = hourNum % 12 || 12;

    return `${newHour}:${minute} ${newPeriod}`;
};

const CreateCalendarEvent = ({ userId, setEvents, closeForm, refreshDashboardData, selectedDate = null }) => {
    const initialDate = selectedDate
        ? (typeof selectedDate.toISODate === "function"
            ? selectedDate.toISODate()
            : selectedDate.toISOString().split("T")[0])
        : getCurrentDate();
    const initialStartTime = getCurrentTime();
    const initialEndTime = addOneHour(initialStartTime);

    const [newEvent, setNewEvent] = useState({
        event_title: "",
        account_id: null,
        contact_name: "",
        phone_number: "",
        location: "",
        start_date: initialDate,
        start_time: initialStartTime,
        end_date: initialDate,
        end_time: initialEndTime,
        notes: "",
        reminder_minutes: "",
        user_id: userId,
        end_time_modified: false,
        start_date_modified: false,
    });

    const [accounts, setAccounts] = useState([]);
    const [accountSearch, setAccountSearch] = useState("");
    const [filteredAccounts, setFilteredAccounts] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    /** Fetch Account List */
    useEffect(() => {
        async function loadAccounts() {
            const fetchedAccounts = await fetchAccounts();
            setAccounts(fetchedAccounts);
        }
        loadAccounts();
    }, []);

    /** Dynamic Account Search */
    useEffect(() => {
        if (accountSearch.trim() === "") {
            setFilteredAccounts([]);
            setShowDropdown(false);
            return;
        }

        const matches = accounts.filter(account =>
            account.business_name.toLowerCase().includes(accountSearch.toLowerCase())
        );
        setFilteredAccounts(matches);
        setShowDropdown(matches.length > 0);
    }, [accountSearch, accounts]);

    /** Handle Input Change */
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewEvent(prevEvent => {
            const updated = { ...prevEvent, [name]: value };
            // When start_date changes, automatically update end_date to same day
            if (name === "start_date" && !prevEvent.start_date_modified) {
                updated.end_date = value;
            }
            // Mark start_date as modified if user changes it
            if (name === "start_date") {
                updated.start_date_modified = true;
            }
            return updated;
        });
    };

    /** Handle Time Change */
    const handleTimeChange = (name, value) => {
        setNewEvent(prevEvent => {
            let newEndTime = prevEvent.end_time;
            if (name === "start_time" && !prevEvent.end_time_modified) {
                newEndTime = addOneHour(value);
            }
            return { ...prevEvent, [name]: value, end_time: newEndTime };
        });
    };

    /** Track End Time Modification */
    const handleEndTimeChange = (value) => {
        setNewEvent(prevEvent => ({
            ...prevEvent,
            end_time: value,
            end_time_modified: true,
        }));
    };

    /** Handle Selecting an Account */
    const handleSelectAccount = (account) => {
        setNewEvent(prevEvent => ({
            ...prevEvent,
            account_id: account.account_id,
            contact_name: account.contact_name || "",
            phone_number: formatPhoneNumber(account.phone_number || ""),
            location: `${account.address}, ${account.city}, ${account.state} ${account.zip_code}`,
        }));
        setAccountSearch(account.business_name);
        setFilteredAccounts([]);
        setShowDropdown(false);
    };
    

    /** Format Phone Number as ###-###-#### */
    const formatPhoneNumber = (value) => {
        const cleaned = value.replace(/\D/g, "").slice(0, 10);
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        return match ? `${match[1]}-${match[2]}-${match[3]}` : cleaned;
    };
    /** Handle Phone Number Formatting */
    const handlePhoneNumberChange = (e) => {
        setNewEvent(prevEvent => ({ ...prevEvent, phone_number: formatPhoneNumber(e.target.value) }));
    };

    // Convert to 24 Hour Format for API
    const convertTo24HourFormat = (time12h) => {
        if (!time12h) return "00:00:00";
    
        const [time, modifier] = time12h.split(" ");
        let [hours, minutes] = time.split(":");
    
        hours = parseInt(hours, 10);
        if (modifier === "PM" && hours !== 12) hours += 12;
        if (modifier === "AM" && hours === 12) hours = 0;
    
        return `${String(hours).padStart(2, "0")}:${minutes.padStart(2, "0")}:00`;
    };
    

    /** Handle Creating an Event */
    const handleCreateEvent = async (e) => {
        e.preventDefault();

        if (!newEvent.event_title.trim() || !newEvent.start_date) {
            alert("⚠️ Event title and start date are required.");
            return;
        }

        try {
            const formattedEvent = {
                ...newEvent,
                user_id: userId,
                start_time: convertTo24HourFormat(newEvent.start_time),
                end_time: convertTo24HourFormat(newEvent.end_time),
                reminder_minutes: newEvent.reminder_minutes
                    ? parseInt(newEvent.reminder_minutes, 10)
                    : null,
            };

            console.log("📝 Creating event with data:", formattedEvent);
            const createdEvent = await createCalendarEvent(formattedEvent);
            console.log("✅ Event created successfully:", createdEvent);

            if (createdEvent) {
                // Refresh dashboard data to get updated events list
                if (refreshDashboardData && typeof refreshDashboardData === 'function') {
                    await refreshDashboardData(userId);
                }
                closeForm();
            }
        } catch (error) {
            console.error("❌ Error creating event:", error.response?.data || error.message);
            alert("Failed to create event. Check console logs.");
        }
    };

    return (
        <div className="mt-4 p-4 bg-card rounded-lg shadow-md border border-border text-left">
            <h2 className="text-xl font-semibold text-foreground mb-4">Create Event</h2>

            {/* Event Title */}
            <label className="block text-sm font-medium text-muted-foreground">Event Title</label>
            <input
                type="text"
                name="event_title"
                value={newEvent.event_title}
                onChange={handleInputChange}
                className="w-full p-2 border border-border bg-card text-foreground rounded-lg mb-4"
                placeholder="Enter event title"
            />

            {/* Account Search */}
            <label className="block text-sm font-medium text-muted-foreground">Search for an Account</label>
            <input
                type="text"
                value={accountSearch}
                onChange={(e) => setAccountSearch(e.target.value)}
                placeholder="Search by account name..."
                className="w-full p-2 border border-border bg-card text-foreground rounded-lg"
            />
            {showDropdown && (
                <ul className="absolute bg-card border border-border w-full mt-1 rounded shadow-lg max-h-48 overflow-y-auto z-50">
                    {filteredAccounts.map(account => (
                        <li
                            key={account.account_id}
                            onClick={() => handleSelectAccount(account)} 
                            className="p-2 hover:bg-muted cursor-pointer text-foreground"
                        >
                            {account.business_name}
                        </li>
                    ))}
                </ul>
            )}


            {/* Location, Contact Name, Phone Number */}
            <label className="block text-sm font-medium text-muted-foreground mt-2">Location</label>
            <input
                type="text"
                name="location"
                value={newEvent.location}
                onChange={handleInputChange}
                className="w-full p-2 border border-border bg-card text-foreground rounded-lg"
                placeholder="Enter or select location"
            />
            <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="relative">
                    <label className="block text-sm font-medium text-muted-foreground mt-2">Contact Name</label>
                    <input
                        type="text"
                        name="contact_name"
                        value={newEvent.contact_name}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-border bg-card text-foreground rounded-lg"
                    />
                    </div>
                <div className="relative">
                    <label className="block text-sm font-medium text-muted-foreground mt-4">Phone Number</label>
                    <input
                        type="text"
                        name="phone_number"
                        value={newEvent.phone_number}
                        onChange={handlePhoneNumberChange}  
                        className="w-full p-2 border border-border bg-card text-foreground rounded-lg"
                        placeholder="Enter phone number"
                        maxLength="12"  
                    />
                </div>
            </div>
            {/* Start Date, End Date */}
            <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="relative">
                    <label className="block text-sm font-medium text-muted-foreground">Start Date</label>
                    <FiCalendar className="absolute top-3 right-3 text-muted-foreground" />
                    <input 
                        type="date" 
                        name="start_date" 
                        value={newEvent.start_date} 
                        onChange={handleInputChange} 
                        className="w-full p-2 border border-border bg-card text-foreground rounded-lg"
                    />
                </div>

                <div className="relative">
                    <label className="block text-sm font-medium text-muted-foreground">End Date</label>
                    <FiCalendar className="absolute top-3 right-3 text-muted-foreground" />
                    <input 
                        type="date" 
                        name="end_date" 
                        value={newEvent.end_date} 
                        onChange={handleInputChange} 
                        className="w-full p-2 border border-border bg-card text-foreground rounded-lg"
                    />
                </div>
            </div>

            {/* Reminder */}
            <label className="block text-sm font-medium text-muted-foreground mt-4">
                Reminder
            </label>
            <select
                name="reminder_minutes"
                value={newEvent.reminder_minutes}
                onChange={handleInputChange}
                className="w-full p-2 border border-border bg-card text-foreground rounded-lg"
            >
                <option value="">No reminder</option>
                <option value="5">5 minutes before</option>
                <option value="10">10 minutes before</option>
                <option value="15">15 minutes before</option>
                <option value="30">30 minutes before</option>
                <option value="60">1 hour before</option>
            </select>
            {/* Start Time, End Time */}
            <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="relative">
                    <label className="block text-sm font-medium text-muted-foreground">Start Time</label>
                    <FiClock className="absolute top-3 right-3 text-muted-foreground" />
                        <CustomTimePicker 
                            value={newEvent.start_time} 
                            onChange={(value) => handleTimeChange("start_time", value)} 
                        />
                </div>
                <div className="relative">
                    <label className="block text-sm font-medium text-muted-foreground">End Time</label>
                    <FiClock className="absolute top-3 right-3 text-muted-foreground" />
                        <CustomTimePicker 
                            value={newEvent.end_time} 
                            onChange={handleEndTimeChange} 
                        />
                </div>
            </div>

            <label className="block text-sm font-medium text-muted-foreground mt-4">Notes</label>
            <textarea name="notes" value={newEvent.notes} onChange={handleInputChange} className="w-full p-2 border border-border bg-card text-foreground rounded-lg" rows="3"></textarea>

            {/* Buttons */}
            <div className="flex justify-between mt-4">
                <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg" onClick={closeForm}>Cancel</button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg" onClick={handleCreateEvent}>Save</button>
            </div>
        </div>
    );
};

CreateCalendarEvent.propTypes = {
    userId: PropTypes.number.isRequired,
    setEvents: PropTypes.func.isRequired,
    closeForm: PropTypes.func.isRequired,
    refreshDashboardData: PropTypes.func.isRequired,
    selectedDate: PropTypes.object,
};

export default CreateCalendarEvent;
