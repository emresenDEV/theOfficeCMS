import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PropTypes from "prop-types";
import PipelineStatusBar from "../components/PipelineStatusBar";
import { addPipelineNote, fetchPipelineDetail, updatePipelineStage } from "../services/pipelineService";
import { PIPELINE_STAGES, PIPELINE_STAGE_MAP } from "../utils/pipelineStages";
import { formatDateInTimeZone, formatDateTimeInTimeZone } from "../utils/timezone";

const STAGE_FIELDS = {
  contact_customer: "contacted_at",
  order_placed: "order_placed_at",
  payment_not_received: "payment_not_received_at",
  payment_received: "payment_received_at",
  order_packaged: "order_packaged_at",
  order_shipped: "order_shipped_at",
  order_delivered: "order_delivered_at",
};

const PipelineInvoicePage = ({ user }) => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const currentUserId = user?.user_id ?? user?.id ?? null;
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState("");
  const [stageNote, setStageNote] = useState("");
  const [noteOnly, setNoteOnly] = useState("");
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);

  const pipeline = detail?.pipeline;
  const invoice = detail?.invoice;
  const contact = detail?.contact;
  const suggestedDates = detail?.suggested_dates || {};

  useEffect(() => {
    let isMounted = true;
    async function loadDetail() {
      setLoading(true);
      const data = await fetchPipelineDetail(invoiceId);
      if (isMounted) {
        setDetail(data);
        setSelectedStage(data?.effective_stage || data?.pipeline?.current_stage || "");
        setLoading(false);
      }
    }
    loadDetail();
    return () => {
      isMounted = false;
    };
  }, [invoiceId]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleStageUpdate = async () => {
    if (!selectedStage || !invoiceId || !currentUserId) return;
    setSaving(true);
    const updated = await updatePipelineStage(invoiceId, {
      stage: selectedStage,
      note: stageNote,
      actor_user_id: currentUserId,
      actor_email: user?.email,
    });
    if (updated) {
      const refreshed = await fetchPipelineDetail(invoiceId);
      setDetail(refreshed);
      setStageNote("");
      setToast("Pipeline updated.");
    }
    setSaving(false);
  };

  const handleAddNote = async () => {
    if (!noteOnly.trim() || !invoiceId || !currentUserId) return;
    setSaving(true);
    const created = await addPipelineNote(invoiceId, {
      note: noteOnly.trim(),
      stage: pipeline?.current_stage,
      actor_user_id: currentUserId,
      actor_email: user?.email,
    });
    if (created) {
      const refreshed = await fetchPipelineDetail(invoiceId);
      setDetail(refreshed);
      setNoteOnly("");
      setToast("Note added.");
    }
    setSaving(false);
  };

  const formattedHistory = useMemo(() => {
    if (!detail?.history) return [];
    return detail.history;
  }, [detail]);

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return formatDateInTimeZone(dateString, user, {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    return formatDateTimeInTimeZone(dateString, user, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading pipeline...</div>;
  }

  if (!detail) {
    return <div className="p-6 text-sm text-muted-foreground">Pipeline not found.</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {toast && (
        <div className="fixed right-6 bottom-6 z-50 rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground shadow-lg">
          {toast}
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              className="text-sm text-primary hover:underline"
              onClick={() => navigate("/pipelines")}
            >
              ← Back to Pipeline
            </button>
            <h1 className="mt-2 text-2xl font-semibold text-foreground">
              Invoice #{invoice?.invoice_id}
            </h1>
            <p className="text-sm text-muted-foreground">
              {invoice?.account_name} • Status: {invoice?.status} • Pipeline:{" "}
              {PIPELINE_STAGE_MAP[detail?.effective_stage]?.label || detail?.effective_stage || pipeline?.current_stage}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
            <p className="text-xs uppercase text-muted-foreground">Contact</p>
            {contact?.name ? (
              <div className="mt-1">
                <button
                  className="font-semibold text-primary hover:underline"
                  onClick={() => navigate(`/contacts/${contact.contact_id}`)}
                >
                  {contact.name}
                </button>
                {contact.email && (
                  <div>
                    <a
                      className="text-xs text-muted-foreground hover:underline"
                      href={`mailto:${contact.email}?subject=Invoice%20%23${invoice?.invoice_id}`}
                    >
                      {contact.email}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No contact linked</p>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-border bg-background p-4">
          <PipelineStatusBar
            currentStage={detail?.effective_stage || pipeline?.current_stage}
            onStageSelect={(stage) => setSelectedStage(stage)}
          />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[2fr,1fr]">
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-lg font-semibold text-foreground">Update Stage</h2>
            <p className="text-xs text-muted-foreground">
              Move the pipeline forward and log a note (optional).
            </p>
            <div className="mt-4 space-y-3">
              <select
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
              >
                {PIPELINE_STAGES.map((stage) => (
                  <option key={stage.key} value={stage.key}>
                    {stage.label}
                  </option>
                ))}
              </select>
              <textarea
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                placeholder="Add a note (optional)"
                rows={3}
                value={stageNote}
                onChange={(e) => setStageNote(e.target.value)}
              />
              <button
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                onClick={handleStageUpdate}
                disabled={saving}
              >
                {saving ? "Saving..." : "Update Stage"}
              </button>
              {selectedStage === "payment_not_received" && (
                <p className="text-xs text-amber-700">
                  This will log a payment issue email and notify the rep if unresolved after 2 days.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-lg font-semibold text-foreground">Add Note</h2>
            <p className="text-xs text-muted-foreground">Notes show in the pipeline history.</p>
            <textarea
              className="mt-3 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
              rows={4}
              placeholder="Capture key details, customer responses, or next steps."
              value={noteOnly}
              onChange={(e) => setNoteOnly(e.target.value)}
            />
            <button
              className="mt-3 rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
              onClick={handleAddNote}
              disabled={saving}
            >
              {saving ? "Saving..." : "Add Note"}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-foreground">Timeline</h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Stage</th>
                <th className="px-3 py-2 text-left">Suggested Date</th>
                <th className="px-3 py-2 text-left">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PIPELINE_STAGES.map((stage) => {
                const actual = pipeline?.[STAGE_FIELDS[stage.key]];
                return (
                  <tr key={stage.key} className="hover:bg-muted/40">
                    <td className="px-3 py-2 font-semibold text-foreground">{stage.label}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {formatDate(suggestedDates?.[stage.key])}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {actual ? formatDateTime(actual) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-foreground">History</h2>
        <div className="mt-4 space-y-3">
          {formattedHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history yet.</p>
          ) : (
            formattedHistory.map((entry) => (
              <div key={entry.history_id} className="rounded-md border border-border bg-muted/40 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-foreground">
                    {PIPELINE_STAGE_MAP[entry.stage]?.label || entry.stage || "Update"} • {entry.action}
                  </div>
                  <div className="text-xs text-muted-foreground">{formatDateTime(entry.created_at)}</div>
                </div>
                {entry.note && <p className="mt-2 text-sm text-foreground">{entry.note}</p>}
                {entry.actor_name && (
                  <p className="mt-1 text-xs text-muted-foreground">By {entry.actor_name}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

PipelineInvoicePage.propTypes = {
  user: PropTypes.object,
};

export default PipelineInvoicePage;
