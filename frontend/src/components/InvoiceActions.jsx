// components/InvoiceActions.jsx
import React from "react";
import { PDFDownloadLink, pdf } from "@react-pdf/renderer";
import InvoicePDF from "./InvoicePDF";
import PropTypes from "prop-types";

const InvoiceActions = ({
invoice,
services,
salesRep,
payments,
user,
accountDetails
}) => {
const fileName = `dmpc${invoice.invoice_id}.pdf`;

const emailBody = `
${invoice.business_name} Contact,

I have attached the requested invoice (Invoice #: ${invoice.invoice_id}) for your review.

If you need anything, we are here to help.  
Your sales representative is:
${salesRep.first_name} ${salesRep.last_name}  
${salesRep.email}  
${accountDetails?.branch?.branch_name || "N/A"}  
${salesRep.phone_number || ""}

Respectfully,  
${user.first_name} ${user.last_name}  
${user.phone_number || ""}
`.trim();

const emailSubject = `Dunder-Mifflin Invoice #${invoice.invoice_id}`;

const handleEmailClick = async () => {
    const blob = await pdf(
    <InvoicePDF
        invoice={invoice}
        services={services}
        salesRep={salesRep}
        payments={payments}
        accountDetails={accountDetails}
    />
    ).toBlob();

    const url = URL.createObjectURL(blob);

    window.open(
    `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`,
    "_blank"
    );

    setTimeout(() => URL.revokeObjectURL(url), 10000);
};

const isPaid = payments && payments.length > 0;


return (
    <div className="mt-4 flex flex-col md:flex-row gap-3 items-start md:items-center">
    <PDFDownloadLink
        document={
        <InvoicePDF
            invoice={invoice}
            services={services}
            salesRep={salesRep}
            payments={invoice.payments}
            accountDetails={accountDetails}
        />
        }
        fileName={fileName}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
    >
        {isPaid ? "Download Receipt" : "Download Invoice"}
    </PDFDownloadLink>

    <button
        onClick={handleEmailClick}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
    >
        {isPaid ? "Email Receipt" : "Email Invoice"}
    </button>
    </div>
);
};

InvoiceActions.propTypes = {
invoice: PropTypes.object.isRequired,
services: PropTypes.array.isRequired,
salesRep: PropTypes.object.isRequired,
payments: PropTypes.arrayOf(
    PropTypes.shape({
        payment_id: PropTypes.number.isRequired,
        method_id: PropTypes.number,
        method_name: PropTypes.string, // added later via mapping
        last_four_payment_method: PropTypes.string,
        total_paid: PropTypes.number.isRequired,
        date_paid: PropTypes.string.isRequired,
        logged_by: PropTypes.number.isRequired, // user_id
        logged_by_username: PropTypes.string, // added after mapping
        logged_by_first_name: PropTypes.string, // added after mapping
        logged_by_last_name: PropTypes.string,  // added after mapping
        })
    ),
accountDetails: PropTypes.shape({
    account_id: PropTypes.number.isRequired,
    contact_name: PropTypes.string,
    address: PropTypes.string,
    city: PropTypes.string,
    state: PropTypes.string,
    zip_code: PropTypes.string,
    phone_number: PropTypes.string,
    email: PropTypes.string,
    branch: PropTypes.shape({
    branch_name: PropTypes.string,
    address: PropTypes.string,
    city: PropTypes.string,
    state: PropTypes.string,
    zip_code: PropTypes.string,
    phone_number: PropTypes.string,
    })
}),
user: PropTypes.shape({
    first_name: PropTypes.string.isRequired,
    last_name: PropTypes.string.isRequired,
    phone_number: PropTypes.string,
}).isRequired,
};

export default InvoiceActions;
