import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { formatDateTimeInTimeZone } from "../utils/timezone";
import { fetchAuditLogs } from "../services/auditService";

const renderValue = (value) => {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }
  if (typeof value === "object") {
    return (
      <pre className="max-h-32 overflow-auto rounded-md bg-muted/60 p-2 text-xs text-foreground">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }
  const text = String(value);
  if (text.length > 60) {
    return (
      <div className="max-h-24 overflow-auto rounded-md bg-muted/60 p-2 text-xs text-foreground">
        {text}
      </div>
    );
  }
  return <span className="text-xs text-foreground">{text}</span>;
};

const diffEntries = (before, after) => {
  if (!before && !after) return [];
  const left = before || {};
  const right = after || {};
  const keys = Array.from(new Set([...Object.keys(left), ...Object.keys(right)]));
  return keys
    .filter((key) => JSON.stringify(left[key]) !== JSON.stringify(right[key]))
    .map((key) => ({
      key,
      before: left[key],
      after: right[key],
    }));
};

const AuditSection = ({ title, filters, limit = 50 }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const filterKey = JSON.stringify(filters);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const data = await fetchAuditLogs({ ...filters, limit });
      if (mounted) {
        setLogs(data);
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [filterKey, limit]);

  const rows = useMemo(() => {
    return logs.map((log) => {
      const changes = diffEntries(log.before_data, log.after_data);
      return { ...log, changes };
    });
  }, [logs]);

  return (
    <div className="mt-6 rounded-md border border-border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <span className="text-xs text-muted-foreground">{rows.length} entries</span>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading audit logs…</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No audit entries yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="sticky top-0 bg-muted/40">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Time
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actor
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Action
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Entity
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Invoice
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Changes
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Link
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.audit_id} className="hover:bg-muted/40">
                  <td className="px-3 py-2 text-muted-foreground">
                    {row.created_at ? formatDateTimeInTimeZone(row.created_at, null, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    }) : "—"}
                  </td>
                  <td className="px-3 py-2 text-foreground">
                    {row.user_email || "System"}
                  </td>
                  <td className="px-3 py-2 text-foreground">{row.action}</td>
                  <td className="px-3 py-2 text-foreground">
                    {row.entity_type}
                    {row.entity_id ? ` #${row.entity_id}` : ""}
                  </td>
                  <td className="px-3 py-2 text-foreground">
                    {row.invoice_id ? (
                      <Link className="text-primary hover:underline" to={`/invoice/${row.invoice_id}`}>
                        #{row.invoice_id}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {row.changes.length === 0 ? (
                      "—"
                    ) : row.changes.length <= 2 ? (
                      row.changes.map((change) => (
                        <div key={change.key} className="mb-3 last:mb-0">
                          <p className="text-xs font-semibold text-foreground">{change.key}</p>
                          <div className="mt-2 grid gap-2 md:grid-cols-2">
                            <div className="rounded-md border border-border bg-card p-2">
                              <p className="text-[10px] uppercase text-muted-foreground">Before</p>
                              <div className="mt-1">{renderValue(change.before)}</div>
                            </div>
                            <div className="rounded-md border border-border bg-card p-2">
                              <p className="text-[10px] uppercase text-muted-foreground">After</p>
                              <div className="mt-1">{renderValue(change.after)}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <details className="cursor-pointer">
                        <summary>{row.changes.length} fields changed</summary>
                        <div className="mt-2 space-y-1">
                          {row.changes.map((change) => (
                            <div key={change.key} className="mb-3 last:mb-0">
                              <p className="text-xs font-semibold text-foreground">{change.key}</p>
                              <div className="mt-2 grid gap-2 md:grid-cols-2">
                                <div className="rounded-md border border-border bg-card p-2">
                                  <p className="text-[10px] uppercase text-muted-foreground">Before</p>
                                  <div className="mt-1">{renderValue(change.before)}</div>
                                </div>
                                <div className="rounded-md border border-border bg-card p-2">
                                  <p className="text-[10px] uppercase text-muted-foreground">After</p>
                                  <div className="mt-1">{renderValue(change.after)}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {row.link ? (
                      <Link className="text-primary hover:underline" to={row.link}>
                        Open
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

AuditSection.propTypes = {
  title: PropTypes.string.isRequired,
  filters: PropTypes.object,
  limit: PropTypes.number,
};

AuditSection.defaultProps = {
  filters: {},
  limit: 50,
};

export default AuditSection;
