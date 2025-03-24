import React from "react";
import {
Document,
Page,
Text,
View,
StyleSheet,
} from "@react-pdf/renderer";
import PropTypes from "prop-types";

// PDF styles
const styles = StyleSheet.create({
page: { padding: 40, fontSize: 12, fontFamily: "Helvetica" },
section: { marginBottom: 20 },
heading: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
twoColumn: { flexDirection: "row", justifyContent: "space-between" },
column: { flexDirection: "column", width: "48%" },
tableHeader: {
    flexDirection: "row",
    borderBottom: "1pt solid #000",
    paddingBottom: 4,
    marginTop: 12,
},
tableRow: {
    flexDirection: "row",
    borderBottom: "1pt solid #ccc",
    paddingVertical: 2,
},
cell: { flex: 1, paddingRight: 6 },
totalLine: {
    textAlign: "right",
    fontWeight: "bold",
    marginTop: 4,
},
paidBadge: {
    color: "green",
    border: "1pt solid green",
    padding: 4,
    marginTop: 10,
    alignSelf: "flex-start",
    fontWeight: "bold",
},
});

const formatCurrency = (amount) =>
new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
}).format(amount);

const formatDate = (rawDate) => {
if (!rawDate) return "N/A";
return new Date(rawDate).toLocaleDateString("en-US");
};

const InvoicePDF = ({
invoice,
services,
payment,
salesRep,
accountDetails,
}) => {
const branch = accountDetails?.branch || {};

const serviceTotal = services.reduce(
    (sum, s) => sum + s.price_per_unit * s.quantity,
    0
);
const serviceDiscount = services.reduce(
    (sum, s) =>
    sum + s.price_per_unit * s.quantity * (s.discount_percent || 0),
    0
);

return (
    <Document>
    <Page size="A4" style={styles.page}>
        {/* Invoice Number */}
        <View style={styles.section}>
        <Text style={styles.heading}>Invoice #{invoice.invoice_id}</Text>
        </View>

        {/* Two Columns: Company + Billing Info */}
        <View style={[styles.section, styles.twoColumn]}>
        {/* Left Column - Company Info */}
        <View style={styles.column}>
            <Text>Dunder Mifflin Paper Company</Text>
            <Text>
            {salesRep.first_name} {salesRep.last_name}
            </Text>
            <Text>{branch.branch_name}</Text>
            <Text>{branch.address}</Text>
            <Text>
            {branch.city}, {branch.state} {branch.zip_code}
            </Text>
            <Text>{branch.phone_number}</Text>
        </View>

        {/* Right Column - Billing Info */}
        <View style={[styles.column, { textAlign: "right" }]}>
            <Text>Bill To:</Text>
            <Text>{invoice.business_name}</Text>
            <Text>Account #: {invoice.account_id}</Text>
            <Text>{accountDetails?.contact_name}</Text>
            <Text>{accountDetails?.address}</Text>
            <Text>
            {accountDetails?.city}, {accountDetails?.state}{" "}
            {accountDetails?.zip_code}
            </Text>
            <Text>{accountDetails?.phone_number}</Text>
            <Text>{accountDetails?.email}</Text>
            <Text>Invoice Date: {formatDate(invoice.date_created)}</Text>
            <Text>Due Date: {formatDate(invoice.due_date)}</Text>
        </View>
        </View>

        {/* Services Table */}
        <View style={styles.section}>
        <Text style={styles.heading}>Services</Text>
        <View style={styles.tableHeader}>
            <Text style={[styles.cell, { flex: 2 }]}>Service</Text>
            <Text style={styles.cell}>Qty</Text>
            <Text style={styles.cell}>Unit Price</Text>
            <Text style={styles.cell}>Discount</Text>
            <Text style={styles.cell}>Subtotal</Text>
        </View>
        {services.map((s, i) => {
            const discountAmount =
            s.price_per_unit * s.quantity * (s.discount_percent || 0);
            return (
            <View key={i} style={styles.tableRow}>
                <Text style={[styles.cell, { flex: 2 }]}>
                {s.service_name}
                {s.discount_percent > 0 &&
                    ` (Discount: ${(s.discount_percent * 100).toFixed(0)}% [${formatCurrency(
                    discountAmount
                    )}])`}
                </Text>
                <Text style={styles.cell}>{s.quantity}</Text>
                <Text style={styles.cell}>
                {formatCurrency(s.price_per_unit)}
                </Text>
                <Text style={styles.cell}>
                {(s.discount_percent * 100).toFixed(0)}%
                </Text>
                <Text style={styles.cell}>
                {formatCurrency(s.total_price)}
                </Text>
            </View>
            );
        })}
        </View>

        {/* Financial Summary */}
        <View style={styles.section}>
        <Text style={styles.totalLine}>
            Service Total: {formatCurrency(serviceTotal)}
        </Text>
        <Text style={styles.totalLine}>
            Service Discount: {formatCurrency(serviceDiscount)}
        </Text>
        <Text style={styles.totalLine}>
            Invoice Discount: {formatCurrency(invoice.discount_amount || 0)} (
            {(invoice.discount_percent * 100).toFixed(0)}%)
        </Text>
        <Text style={styles.totalLine}>
            Tax: {formatCurrency(invoice.tax_amount)} (
            {(invoice.tax_rate * 100).toFixed(2)}%)
        </Text>
        <Text style={styles.totalLine}>
            Final Total: {formatCurrency(invoice.final_total)}
        </Text>
        </View>

        {/* Paid Section */}
        {payment && (
        <View style={styles.section}>
            <Text style={styles.paidBadge}>PAID</Text>
            <Text>Confirmation #: {payment.payment_id}</Text>
            <Text>Logged By: {payment.logged_by}</Text>
            <Text>Payment Method: {payment.method_name}</Text>
            <Text>Last Four: {payment.last_four_payment_method}</Text>
            <Text>Total Paid: {formatCurrency(payment.total_paid)}</Text>
            <Text>
            Date Paid:{" "}
            {new Date(payment.date_paid).toLocaleString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            })}
            </Text>
        </View>
        )}
    </Page>
    </Document>
);
};

InvoicePDF.propTypes = {
    invoice: PropTypes.object.isRequired,
    services: PropTypes.array.isRequired,
    payment: PropTypes.object,
    salesRep: PropTypes.object.isRequired,
    accountDetails: PropTypes.shape({
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
            }),
    }).isRequired,
};

export default InvoicePDF;
