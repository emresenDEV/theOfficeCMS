import React, { useState } from "react";
import PropTypes from "prop-types";

const PaidBox = ({
payment,
onUpdate,
onDelete,
paymentMethods,
invoiceTotal,
totalPaidSoFar,
loggedInUsername,
}) => {
const [isEditing, setIsEditing] = useState(false);
const [editedPayment, setEditedPayment] = useState({ ...payment });
const [showConfirmDelete, setShowConfirmDelete] = useState(false);

const toCurrency = (val) =>
    new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    }).format(parseFloat(val || 0));

const handleChange = (field, value) => {
    setEditedPayment((prev) => ({
    ...prev,
    [field]: value,
    logged_by: loggedInUsername,
    }));
};

const handleSave = () => {
    onUpdate(editedPayment);
    setIsEditing(false);
};

const handleDelete = () => {
    onDelete(payment.payment_id);
    setShowConfirmDelete(false);
};

const remainingDue = Math.max(0, invoiceTotal - totalPaidSoFar);

// const methodName = paymentMethods.find(
//     (pm) => pm.method_id === payment.method_id
// )?.method_name || "N/A";

const methodFromBackend = payment.method_name;
const methodFromList = paymentMethods.find(pm => pm.method_id === payment.payment_method);
const methodName = methodFromList?.method_name || methodFromBackend || "N/A";

const localTime = new Date(payment.date_paid).toLocaleString("en-US", {
    timeZone: "America/Chicago", // or use Intl.DateTimeFormat().resolvedOptions().timeZone for auto
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
});


return (
    <div className="border p-6 rounded-lg bg-white shadow mb-6 text-base relative">
    <div className="flex justify-between items-center mb-4">
        <p className="font-bold">Confirmation #: {payment.payment_id}</p>
        <button
        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        onClick={() => setIsEditing(!isEditing)}
        >
        {isEditing ? "Cancel" : "Edit"}
        </button>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
        <p className="font-semibold">Logged By:</p>
        <p>{editedPayment.logged_by_username || editedPayment.logged_by}</p>
        </div>

        <div>
        <p className="font-semibold">Payment Method:</p>
        {isEditing ? (
            <select
            value={editedPayment.method_id}
            onChange={(e) =>
                handleChange("method_id", parseInt(e.target.value))
            }
            className="w-full border rounded px-2 py-1"
            >
            {paymentMethods.map((pm) => (
                <option key={pm.method_id} value={pm.method_id}>
                {pm.method_name}
                </option>
            ))}
            </select>
        ) : (
            <p>{methodName}</p>
        )}
        </div>

        <div>
        <p className="font-semibold">Last Four:</p>
        {isEditing ? (
            <input
            value={editedPayment.last_four_payment_method || ""}
            onChange={(e) =>
                handleChange("last_four_payment_method", e.target.value)
            }
            maxLength={4}
            className="w-full border rounded px-2 py-1"
            />
        ) : (
            <p>{payment.last_four_payment_method || payment.last_four || "N/A"}</p>

        )}
        </div>

        <div>
        <p className="font-semibold">Total Paid:</p>
        {isEditing ? (
            <input
            type="number"
            value={editedPayment.total_paid}
            onChange={(e) =>
                handleChange("total_paid", parseFloat(e.target.value))
            }
            className="w-full border rounded px-2 py-1"
            />
        ) : (
            <p>{toCurrency(payment.total_paid)}</p>
        )}
        </div>

        <div>
        <p className="font-semibold">Date Paid:</p>
        {isEditing ? (
            <input
            type="datetime-local"
            value={new Date(editedPayment.date_paid)
                .toISOString()
                .slice(0, 16)}
            onChange={(e) =>
                handleChange(
                "date_paid",
                new Date(e.target.value).toISOString()
                )
            }
            className="w-full border rounded px-2 py-1"
            />
        ) : (
            <p>
            {new Date(payment.date_paid).toLocaleString("en-US", {
                timezone: "America/Chicago)",
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            })}
            </p>
        )}
        </div>

        <div>
        <p className="font-semibold text-green-600">Remaining Due:</p>
        <p
            className={
            remainingDue > 0
                ? "text-red-600 font-bold"
                : "text-green-600 font-bold"
            }
        >
            {toCurrency(remainingDue)}
        </p>
        </div>
    </div>

    <div className="flex justify-end gap-3">
        {isEditing && (
        <button
            onClick={handleSave}
            className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
        >
            Save
        </button>
        )}
        <button
        onClick={() => setShowConfirmDelete(true)}
        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
        >
        Delete
        </button>
    </div>

    {showConfirmDelete && (
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
        <div className="bg-white p-6 rounded shadow-md w-80">
            <p className="mb-4 font-semibold">
            Are you sure you want to delete this payment?
            </p>
            <div className="flex justify-between">
            <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            >
                Yes, Delete
            </button>
            <button
                onClick={() => setShowConfirmDelete(false)}
                className="bg-gray-400 text-black px-3 py-1 rounded hover:bg-gray-500"
            >
                Cancel
            </button>
            </div>
        </div>
        </div>
    )}
    </div>
);
};

PaidBox.propTypes = {
payment: PropTypes.object.isRequired,
onUpdate: PropTypes.func.isRequired,
onDelete: PropTypes.func.isRequired,
paymentMethods: PropTypes.array.isRequired,
invoiceTotal: PropTypes.number.isRequired,
totalPaidSoFar: PropTypes.number.isRequired,
loggedInUsername: PropTypes.string.isRequired,
};

export default PaidBox;
