import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";
import { DateTime } from "luxon";

const CalendarEventModal = ({
    isOpen,
    closeModal,
    onSave,
    onDelete,
    initialData = {},
    accounts = [],
}) => {
const [formData, setFormData] = useState({
    event_title: "",
    location: "",
    start: DateTime.now(),
    end: DateTime.now().plus({ hours: 1 }),
    notes: "",
    contact_name: "",
    phone_number: "",
    account_id: "",
});

  // Set form data when editing an event
useEffect(() => {
    if (initialData?.event_id) {
        setFormData({
            ...initialData,
            start: DateTime.fromJSDate(initialData.start),
            end: DateTime.fromJSDate(initialData.end),
        });
    } else {
        setFormData((prev) => ({
            ...prev,
            start: DateTime.now(),
            end: DateTime.now().plus({ hours: 1 }),
        }));
    }
}, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;

    if (name === "account_id") {
        const selectedAccount = accounts.find(
            (acc) => acc.account_id === parseInt(value)
            );
            if (selectedAccount) {
                setFormData((prev) => ({
                    ...prev,
                    account_id: value,
                    location: selectedAccount.address ?? "",
                    contact_name: selectedAccount.contact_name ?? "",
                    phone_number: selectedAccount.phone_number ?? "",
                }));
            return;
        }
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    };

const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.start >= formData.end) {
        alert("Start time must be before end time.");
        return;
    }

    const payload = {
        ...formData,
        start_date: formData.start.toFormat("yyyy-MM-dd"),
        end_date: formData.end.toFormat("yyyy-MM-dd"),
        start_time: formData.start.toFormat("HH:mm:ss"),
        end_time: formData.end.toFormat("HH:mm:ss"),
    };

    onSave(payload);
};

const handleDelete = () => {
    if (confirm("Are you sure you want to delete this event?")) {
        onDelete(initialData.event_id);
    }
    };

    return (
    <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
        <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
        >
            <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-2">
                {initialData?.event_id ? "Edit Event" : "Create Event"}
            </Dialog.Title>

            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    name="event_title"
                    placeholder="Event Title"
                    value={formData.event_title ?? ""}
                    onChange={handleChange}
                    required
                    className="w-full border rounded px-3 py-2"
                />

                <LocalizationProvider dateAdapter={AdapterLuxon}>
                    <DateTimePicker
                    label="Start Date & Time"
                    value={formData.start}
                    onChange={(newVal) =>
                        setFormData((prev) => ({ ...prev, start: newVal }))
                    }
                    className="w-full"
                    />
                    <DateTimePicker
                    label="End Date & Time"
                    value={formData.end}
                    onChange={(newVal) =>
                        setFormData((prev) => ({ ...prev, end: newVal }))
                    }
                    className="w-full"
                    />
                </LocalizationProvider>

                <select
                    name="account_id"
                    value={formData.account_id ?? ""}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                >
                    <option value="">Select Account (optional)</option>
                    {accounts.map((acc) => (
                    <option key={acc.account_id} value={acc.account_id}>
                        {acc.business_name}
                    </option>
                    ))}
                </select>

                <input
                    type="text"
                    name="location"
                    placeholder="Location"
                    value={formData.location ?? ""}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                />

                <textarea
                    name="notes"
                    placeholder="Notes"
                    value={formData.notes ?? ""}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                />

                <input
                    type="text"
                    name="contact_name"
                    placeholder="Contact Name"
                    value={formData.contact_name ?? ""}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                />

                <input
                    type="text"
                    name="phone_number"
                    placeholder="Phone Number"
                    value={formData.phone_number ?? ""}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                />

                <div className="flex justify-between space-x-2 pt-2">
                    <button
                    type="button"
                    onClick={closeModal}
                    className="bg-gray-200 px-4 py-2 rounded"
                    >
                    Cancel
                    </button>
                    {initialData?.event_id && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="bg-red-600 text-white px-4 py-2 rounded"
                    >
                        Delete
                    </button>
                    )}
                    <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                    >
                    Save
                    </button>
                </div>
                </form>
            </Dialog.Panel>
            </div>
        </Dialog>
        </Transition>
    );
};

CalendarEventModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    closeModal: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    initialData: PropTypes.object,
    accounts: PropTypes.array,
};

export default CalendarEventModal;
