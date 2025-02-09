// calendarService.js
import api from "./api";

// Fetch Calendar Events
export const fetchCalendarEvents = async (userId) => {
    try {
        const response = await api.get(`/calendar/events?user_id=${userId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching calendar events:", error);
        return [];
    }
};

// Create a New Calendar Event
export const createCalendarEvent = async (eventData) => {
    try {
        const response = await api.post("/calendar/events", eventData);
        return response.data;
    } catch (error) {
        console.error("Error creating event:", error);
        return null;
    }
};

// Update an Existing Event
export const updateCalendarEvent = async (eventId, updatedData) => {
    try {
        const response = await api.put(`/calendar/events/${eventId}`, updatedData);
        return response.data;
    } catch (error) {
        console.error("Error updating event:", error);
        return null;
    }
};

// Delete an Event
export const deleteCalendarEvent = async (eventId) => {
    try {
        await api.delete(`/calendar/events/${eventId}`);
        return { success: true };
    } catch (error) {
        console.error("Error deleting event:", error);
        return { success: false };
    }
};


// // Fetch Calendar Events
// export const fetchCalendarEvents = async (userId) => {
//     try {
//         const response = await fetch(`http://127.0.0.1:5001/calendar/events?user_id=${userId}`);
//         if (!response.ok) throw new Error("Failed to fetch calendar events.");
//         return await response.json();
//     } catch (error) {
//         console.error("Error fetching calendar events:", error);
//         return [];
//     }
// };

// // Create New Calendar Event
// export const createCalendarEvent = async (eventData) => {
//     try {
//         const response = await fetch("http://127.0.0.1:5001/calendar/events", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(eventData),
//         });

//         if (!response.ok) throw new Error("Failed to create event.");
//         return await response.json();
//     } catch (error) {
//         console.error("Error creating event:", error);
//         return null;
//     }
// };

// // ✅ Fetch Calendar Events (Meetings) for a User
// export const fetchMeetings = async (userId) => {
//     try {
//         const response = await fetch(`http://127.0.0.1:5001/calendar/events?user_id=${userId}`);
//         if (!response.ok) throw new Error("Failed to fetch calendar events.");
//         return await response.json();
//     } catch (error) {
//         console.error("❌ API Error - Fetching Calendar Events:", error);
//         return [];
//     }
// };


// // Update Calendar Event
// export const updateCalendarEvent = async (eventId, updatedData) => {
//     try {
//         const response = await fetch(`http://127.0.0.1:5001/calendar/events/${eventId}`, {
//             method: "PUT",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(updatedData),
//         });

//         if (!response.ok) throw new Error("Failed to update event.");
//         return await response.json();
//     } catch (error) {
//         console.error("Error updating event:", error);
//         return null;
//     }
// };

// // Delete Calendar Event
// export const deleteCalendarEvent = async (eventId) => {
//     try {
//         const response = await fetch(`http://127.0.0.1:5001/calendar/events/${eventId}`, {
//             method: "DELETE",
//         });

//         if (!response.ok) throw new Error("Failed to delete event.");
//         return { success: true };
//     } catch (error) {
//         console.error("Error deleting event:", error);
//         return { success: false };
//     }
// };