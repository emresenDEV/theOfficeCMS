export const PIPELINE_STAGES = [
  { key: "contact_customer", label: "Contact customer", dayOffset: 0, tone: "info" },
  { key: "order_placed", label: "Order placed", dayOffset: 0, tone: "info" },
  { key: "payment_not_received", label: "Payment not received", dayOffset: 1, tone: "danger" },
  { key: "payment_received", label: "Payment received", dayOffset: 1, tone: "success" },
  { key: "order_packaged", label: "Order packaged", dayOffset: 2, tone: "info" },
  { key: "order_shipped", label: "Order shipped", dayOffset: 3, tone: "info" },
  { key: "order_delivered", label: "Order delivered", dayOffset: 4, tone: "success" },
];

export const PIPELINE_STAGE_MAP = PIPELINE_STAGES.reduce((acc, stage) => {
  acc[stage.key] = stage;
  return acc;
}, {});
