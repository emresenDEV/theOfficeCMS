import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { fetchContacts, createContact } from "../services/contactService";
import { fetchAccounts } from "../services/accountService";
import { fetchUsers } from "../services/userService";

const ContactsPage = ({ user }) => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [ownerId, setOwnerId] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    first_name: "",
    last_name: "",
    title: "",
    phone: "",
    email: "",
    status: "active",
    contact_owner_user_id: "",
    account_id: "",
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const [contactsData, accountsData, usersData] = await Promise.all([
        fetchContacts(),
        fetchAccounts(),
        fetchUsers(),
      ]);
      if (mounted) {
        setContacts(contactsData);
        setAccounts(accountsData);
        setUsers(usersData);
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const params = {
        search: search.trim() || undefined,
        status: status !== "all" ? status : undefined,
        owner_id: ownerId !== "all" ? Number(ownerId) : undefined,
      };
      const data = await fetchContacts(params);
      if (mounted) {
        setContacts(data);
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [search, status, ownerId]);

  const ownerOptions = useMemo(() => users.filter((u) => u.user_id), [users]);

  const accountOptions = useMemo(() => {
    return accounts
      .map((acc) => ({
        account_id: acc.account_id,
        business_name: acc.business_name,
      }))
      .sort((a, b) => a.business_name.localeCompare(b.business_name));
  }, [accounts]);

  const handleCreate = async () => {
    if (!createForm.first_name && !createForm.last_name) return;
    setCreating(true);
    const payload = {
      ...createForm,
      contact_owner_user_id: createForm.contact_owner_user_id
        ? Number(createForm.contact_owner_user_id)
        : undefined,
      account_ids: createForm.account_id ? [Number(createForm.account_id)] : [],
      actor_user_id: user?.user_id,
      actor_email: user?.email,
    };
    const created = await createContact(payload);
    setCreating(false);
    if (created?.contact_id) {
      navigate(`/contacts/${created.contact_id}`);
    }
  };

  return (
    <div className="flex-1 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
          <p className="text-sm text-muted-foreground">Search and manage company contacts.</p>
        </div>
        <button
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          onClick={() => setShowCreate((prev) => !prev)}
        >
          {showCreate ? "Close" : "+ New Contact"}
        </button>
      </div>

      {showCreate && (
        <div className="mt-4 rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Create Contact</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input
              className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
              placeholder="First name"
              value={createForm.first_name}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, first_name: e.target.value }))}
            />
            <input
              className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
              placeholder="Last name"
              value={createForm.last_name}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, last_name: e.target.value }))}
            />
            <input
              className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
              placeholder="Title"
              value={createForm.title}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            <input
              className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
              placeholder="Phone"
              value={createForm.phone}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
            <input
              className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
              placeholder="Email"
              value={createForm.email}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
            />
            <select
              className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
              value={createForm.contact_owner_user_id}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, contact_owner_user_id: e.target.value }))}
            >
              <option value="">Contact owner (optional)</option>
              {ownerOptions.map((owner) => (
                <option key={owner.user_id} value={owner.user_id}>
                  {owner.first_name} {owner.last_name} (ID {owner.user_id})
                </option>
              ))}
            </select>
            <select
              className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
              value={createForm.account_id}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, account_id: e.target.value }))}
            >
              <option value="">Link to account (optional)</option>
              {accountOptions.map((acc) => (
                <option key={acc.account_id} value={acc.account_id}>
                  {acc.business_name}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
              value={createForm.status}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? "Creating..." : "Create Contact"}
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-lg border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
            placeholder="Search by name, email, phone, business, address"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
          >
            <option value="all">All contact owners</option>
            {ownerOptions.map((owner) => (
              <option key={owner.user_id} value={owner.user_id}>
                {owner.first_name} {owner.last_name} (ID {owner.user_id})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card p-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading contacts...</p>
        ) : contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No contacts found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Contact</th>
                  <th className="px-3 py-2 text-left">Title</th>
                  <th className="px-3 py-2 text-left">Company</th>
                  <th className="px-3 py-2 text-left">Owner</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Phone</th>
                  <th className="px-3 py-2 text-left">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {contacts.map((contact) => (
                  <tr
                    key={contact.contact_id}
                    className="hover:bg-muted/40 cursor-pointer"
                    onClick={() => navigate(`/contacts/${contact.contact_id}`)}
                  >
                    <td className="px-3 py-2">
                      <p className="font-semibold text-foreground">
                        {contact.first_name || contact.last_name
                          ? `${contact.first_name || ""} ${contact.last_name || ""}`.trim()
                          : "Unnamed"}
                      </p>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {contact.title || "—"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        {contact.accounts?.length ? (
                          contact.accounts.map((acc) => (
                            <button
                              key={acc.account_id}
                              className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/accounts/details/${acc.account_id}`);
                              }}
                            >
                              {acc.business_name}
                            </button>
                          ))
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {contact.contact_owner_name || "—"}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          contact.status === "inactive"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {contact.status || "active"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {contact.phone || "—"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {contact.email || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

ContactsPage.propTypes = {
  user: PropTypes.shape({
    user_id: PropTypes.number,
    email: PropTypes.string,
  }).isRequired,
};

export default ContactsPage;
