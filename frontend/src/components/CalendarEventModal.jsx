import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import PropTypes from "prop-types";

const CalendarEventModal = ({ isOpen, closeModal, onSave, initialData }) => {
const [formData, setFormData] = useState({
event_title: "",
location: "",
start_time: "",
end_time: "",
notes: "",
contact_name: "",
phone_number: "",
account_id: "",
});

useEffect(() => {
if (initialData) {
    setFormData({ ...initialData });
}
}, [initialData]);

const handleChange = (e) => {
const { name, value } = e.target;
setFormData((prev) => ({ ...prev, [name]: value }));
};

const handleSubmit = (e) => {
e.preventDefault();
onSave(formData);
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

    <div className="fixed inset-0 overflow-y-auto flex items-center justify-center">
        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
        <Dialog.Title className="text-lg font-medium text-gray-900">
            {initialData ? "Edit Event" : "Create Event"}
        </Dialog.Title>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <input
            type="text"
            name="event_title"
            placeholder="Event Title"
            value={formData.event_title}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
            />
            <input
            type="datetime-local"
            name="start_time"
            value={formData.start_time}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            />
            <input
            type="datetime-local"
            name="end_time"
            value={formData.end_time}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            />
            <input
            type="text"
            name="location"
            placeholder="Location"
            value={formData.location}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            />
            <textarea
            name="notes"
            placeholder="Notes"
            value={formData.notes}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            />
            <input
            type="text"
            name="contact_name"
            placeholder="Contact Name"
            value={formData.contact_name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            />
            <input
            type="text"
            name="phone_number"
            placeholder="Phone Number"
            value={formData.phone_number}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            />
            {/* You can add dropdowns for user/account assignments here */}

            <div className="flex justify-end space-x-2">
            <button
                type="button"
                onClick={closeModal}
                className="bg-gray-200 px-4 py-2 rounded"
            >
                Cancel
            </button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
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
initialData: PropTypes.object,
};

export default CalendarEventModal;
