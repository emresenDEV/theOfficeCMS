import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PropTypes from "prop-types";
import PipelineStatusBar from "../components/PipelineStatusBar";
import { fetchPipelineList, fetchPipelineSummary } from "../services/pipelineService";
import { fetchUsers } from "../services/userService";
import { PIPELINE_STAGES, PIPELINE_STAGE_MAP } from "../utils/pipelineStages";
import { formatDateInTimeZone } from "../utils/timezone";
import { cn } from "../lib/utils";

const PipelineDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [summary, setSummary] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [salesRepId, setSalesRepId] = useState("");
  const [accountSearch, setAccountSearch] = useState("");
  const [invoiceIdSearch, setInvoiceIdSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateField, setDateField] = useState("created");
  const currentUserId = user?.user_id ?? user?.id ?? null;

  const stageParam = searchParams.get("stage") || "order_placed";

  const summaryMap = useMemo(() => {
    const map = new Map();
    summary.forEach((item) => map.set(item.stage, item));
    return map;
  }, [summary]);

  const handleStageSelect = (stage) => {
    setSearchParams({ stage });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return formatDateInTimeZone(dateString, user, {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  const filters = useMemo(
    () => ({
      sales_rep_id: salesRepId || undefined,
      account_search: accountSearch || undefined,
      invoice_id: invoiceIdSearch || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      date_field: dateField || undefined,
    }),
    [salesRepId, accountSearch, invoiceIdSearch, dateFrom, dateTo, dateField]
  );

  useEffect(() => {
    if (!currentUserId) return;
    let isMounted = true;
    async function loadSummary() {
      const data = await fetchPipelineSummary(currentUserId, filters);
      if (isMounted) setSummary(Array.isArray(data) ? data : []);
    }
    loadSummary();
    return () => {
      isMounted = false;
    };
  }, [currentUserId, filters]);

  useEffect(() => {
    if (!currentUserId) return;
    let isMounted = true;
    async function loadRows() {
      setLoading(true);
      const data = await fetchPipelineList(stageParam, currentUserId, filters);
      if (isMounted) {
        setRows(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    }
    loadRows();
    return () => {
      isMounted = false;
    };
  }, [stageParam, currentUserId, filters]);

  useEffect(() => {
    async function loadUsers() {
      const data = await fetchUsers();
      setUsers(Array.isArray(data) ? data : []);
    }
    loadUsers();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="rounded-lg border border-border bg-card p-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Paper Sales Pipeline</h1>
            <p className="text-sm text-muted-foreground">Track invoice progress and customer touchpoints.</p>
          </div>
          <button
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
            onClick={() => navigate("/invoices")}
          >
            View Invoices
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {PIPELINE_STAGES.map((stage) => {
            const counts = summaryMap.get(stage.key) || { invoice_count: 0, account_count: 0 };
            const isActive = stageParam === stage.key;
            return (
              <button
                key={stage.key}
                className={cn(
                  "rounded-lg border border-border p-4 text-left transition hover:bg-muted/60",
                  isActive && "border-primary bg-primary/10"
                )}
                onClick={() => handleStageSelect(stage.key)}
              >
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{stage.label}</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{counts.invoice_count}</p>
                <p className="text-xs text-muted-foreground">{counts.account_count} accounts</p>
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-lg border border-border bg-background p-4">
          <PipelineStatusBar currentStage={stageParam} compact />
          <div className="mt-4 flex flex-wrap gap-2">
            {PIPELINE_STAGES.map((stage) => (
              <button
                key={stage.key}
                className={cn(
                  "rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground hover:bg-muted",
                  stageParam === stage.key && "border-primary bg-primary/10 text-primary"
                )}
                onClick={() => handleStageSelect(stage.key)}
              >
                {stage.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Filters</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-6">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Account</label>
              <input
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                placeholder="Search by account name"
                value={accountSearch}
                onChange={(e) => setAccountSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Invoice #</label>
              <input
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                placeholder="ID"
                value={invoiceIdSearch}
                onChange={(e) => setInvoiceIdSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Sales Rep</label>
              <select
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                value={salesRepId}
                onChange={(e) => setSalesRepId(e.target.value)}
              >
                <option value="">All</option>
                {users.map((rep) => (
                  <option key={rep.user_id} value={rep.user_id}>
                    {rep.first_name} {rep.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Date Field</label>
              <select
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                value={dateField}
                onChange={(e) => setDateField(e.target.value)}
              >
                <option value="created">Invoice Created</option>
                <option value="updated">Pipeline Updated</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">From</label>
              <input
                type="date"
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">To</label>
              <input
                type="date"
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {PIPELINE_STAGE_MAP[stageParam]?.label || "Pipeline"} invoices
            </h2>
            <span className="text-xs text-muted-foreground">{rows.length} invoices</span>
          </div>

          <div className="mt-3 overflow-x-auto rounded-lg border border-border">
            {loading ? (
              <div className="p-6 text-sm text-muted-foreground">Loading pipeline...</div>
            ) : rows.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">No invoices in this stage yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Invoice</th>
                    <th className="px-3 py-2 text-left">Account</th>
                    <th className="px-3 py-2 text-left">Contact</th>
                    <th className="px-3 py-2 text-left">Stage</th>
                    <th className="px-3 py-2 text-left">Updated</th>
                    <th className="px-3 py-2 text-left">Total</th>
                    <th className="px-3 py-2 text-left">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row) => (
                    <tr key={row.invoice_id} className="hover:bg-muted/50">
                      <td className="px-3 py-2 font-semibold text-primary">
                        <button onClick={() => navigate(`/pipelines/invoice/${row.invoice_id}`)}>
                          #{row.invoice_id}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          className="text-primary hover:underline"
                          onClick={() => navigate(`/accounts/details/${row.account_id}`)}
                        >
                          {row.account_name}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        {row.contact_id ? (
                          <button
                            className="text-primary hover:underline"
                            onClick={() => navigate(`/contacts/${row.contact_id}`)}
                          >
                            {row.contact_name || "View contact"}
                          </button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            "rounded-full border border-border px-2 py-0.5 text-xs",
                            PIPELINE_STAGE_MAP[row.effective_stage || row.current_stage]?.tone === "danger" && "border-rose-300 text-rose-600",
                            PIPELINE_STAGE_MAP[row.effective_stage || row.current_stage]?.tone === "success" && "border-emerald-300 text-emerald-600"
                          )}
                        >
                          {PIPELINE_STAGE_MAP[row.effective_stage || row.current_stage]?.label || row.current_stage}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{formatDate(row.updated_at)}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        ${Number(row.final_total || 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{formatDate(row.due_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

PipelineDashboard.propTypes = {
  user: PropTypes.object,
};

export default PipelineDashboard;
