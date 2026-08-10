import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import PageLoader from "@/components/common/PageLoader";
import { getCalendarEvents, createCalendarEvent } from "@/apiIntegration/calendar";
import { getUsers } from "@/apiIntegration/organization";
import { DEMO_CALENDAR_EVENTS } from "@/data/calendarDemoEvents";

// API event shape -> FullCalendar event shape. Anything the detail panel needs
// rides along in extendedProps, which is what eventClick hands back.
const toCalendarEvent = (e) => ({
  id: e.event_id,
  title: e.title,
  start: e.start_time,
  end: e.end_time || undefined,
  allDay: e.all_day ?? true,
  extendedProps: {
    description: e.description || "",
    assignedTo: e.assigned_to || [],
  },
});

// Assignees may arrive as plain strings or as user objects.
const assigneeLabel = (a) => {
  if (!a) return "";
  if (typeof a === "string") return a;
  const name = [a.first_name, a.last_name].filter(Boolean).join(" ").trim();
  return name || a.name || a.email || "";
};

const formatEventDate = (event) => {
  if (!event.start) return "";
  const opts = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  const start = event.start.toLocaleDateString(undefined, opts);
  if (!event.end) return start;
  const end = event.end.toLocaleDateString(undefined, opts);
  return start === end ? start : `${start} – ${end}`;
};

function renderEventContent(eventInfo) {
  return (
    <div className="text-left py-1 px-2" style={{ overflow: "hidden" }}>
      {eventInfo.timeText && (
        <div className="text-xs opacity-75">{eventInfo.timeText}</div>
      )}
      <div className="text-xs font-medium break-words">
        {eventInfo.event.title}
      </div>
    </div>
  );
}

function EventDetailModal({ event, onClose }) {
  if (!event) return null;

  const { description, assignedTo } = event.extendedProps || {};
  const assignees = (assignedTo || []).map(assigneeLabel).filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-16 shadow-4 w-full"
        style={{ maxWidth: 520, maxHeight: "85vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={event.title}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-bottom-light">
          <div>
            <h3 className="text-lg font-bold text-dark-1">{event.title}</h3>
            <div className="text-sm text-light-1 mt-1">
              <i className="fa-regular fa-calendar mr-2"></i>
              {formatEventDate(event)}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-light-1 hover:text-dark-1"
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <div className="text-xs font-semibold uppercase text-light-1 mb-2">
              Description
            </div>
            <p className="text-sm text-dark-1" style={{ whiteSpace: "pre-wrap" }}>
              {description || "No description provided."}
            </p>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase text-light-1 mb-2">
              Assigned to
            </div>
            {assignees.length ? (
              <div className="flex flex-wrap gap-2">
                {assignees.map((name, i) => (
                  <span
                    key={`${name}-${i}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-gray-50 text-gray-700 border-gray-200"
                  >
                    <i className="fa-regular fa-user text-[11px]"></i>
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-light-1">Nobody assigned.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateEventModal({ onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [usersError, setUsersError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getUsers({ limit: 500 })
      .then((list) => {
        if (!cancelled) setUsers(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.warn("Could not load organization users:", err);
        if (!cancelled)
          setUsersError("Could not load your organization's users.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleUser = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const haystack = [u.first_name, u.last_name, u.email]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(userSearch.toLowerCase());
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      setError("A title and a date are required.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await createCalendarEvent({
        title: title.trim(),
        description: description.trim(),
        // A date input gives YYYY-MM-DD; the backend normalises it to UTC.
        start_time: date,
        all_day: true,
        assigned_to: selectedIds.map((user_id) => ({ user_id })),
      });
      await onCreated();
      onClose();
    } catch (err) {
      setError(err?.message || "Could not create the event.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <form
        className="bg-white rounded-16 shadow-4 w-full"
        style={{ maxWidth: 560, maxHeight: "85vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-bottom-light">
          <h3 className="text-lg font-bold text-dark-1">New event</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-light-1 hover:text-dark-1"
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-dark-1 block mb-1">
              Title <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              className="form-control w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="e.g. Quarterly AI tool review"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-dark-1 block mb-1">
              Date <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              className="form-control w-full"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-dark-1 block mb-1">
              Description
            </label>
            <textarea
              className="form-control w-full"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={5000}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-dark-1 block mb-1">
              Assign to{" "}
              {selectedIds.length > 0 && (
                <span className="text-light-1 font-normal">
                  ({selectedIds.length} selected)
                </span>
              )}
            </label>
            {usersError ? (
              <p className="text-sm text-red-600">{usersError}</p>
            ) : (
              <>
                <input
                  type="text"
                  className="form-control w-full mb-2"
                  placeholder="Search people in your organization"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                <div
                  style={{
                    maxHeight: 180,
                    overflowY: "auto",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                  }}
                >
                  {filteredUsers.length ? (
                    filteredUsers.map((u) => {
                      const name =
                        [u.first_name, u.last_name].filter(Boolean).join(" ") ||
                        u.email;
                      return (
                        <label
                          key={u.user_id}
                          className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(u.user_id)}
                            onChange={() => toggleUser(u.user_id)}
                          />
                          <span className="text-dark-1">{name}</span>
                          {u.email && name !== u.email && (
                            <span className="text-light-1 text-xs">
                              {u.email}
                            </span>
                          )}
                        </label>
                      );
                    })
                  ) : (
                    <p className="text-sm text-light-1 px-3 py-2">
                      No matching people.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-top-light">
          <button
            type="button"
            onClick={onClose}
            className="button py-10 px-20 rounded-8 -outline-dark-1 text-dark-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="button py-10 px-20 rounded-8 -dark-1 text-white"
          >
            {submitting ? "Creating…" : "Create event"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function DashboardCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const loadEvents = React.useCallback(async () => {
    const showDemoData = () =>
      setEvents(DEMO_CALENDAR_EVENTS.map(toCalendarEvent));

    try {
      const data = await getCalendarEvents();
      const apiEvents = data?.events || [];
      if (apiEvents.length) {
        setEvents(apiEvents.map(toCalendarEvent));
      } else {
        showDemoData();
      }
    } catch (err) {
      // The endpoint may not be deployed yet - fall back to the demo event
      // rather than an empty grid.
      console.warn("Calendar events unavailable, showing demo data:", err);
      showDemoData();
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadEvents().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [loadEvents]);

  // Close on Escape as well as backdrop click.
  useEffect(() => {
    if (!selectedEvent) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setSelectedEvent(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedEvent]);

  if (loading) return <PageLoader loading />;

  return (
    <div className="space-y">
      <div className="dashboard-card p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-xl font-bold text-dark-1">Calendar</h2>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="button py-10 px-20 rounded-8 -dark-1 text-white"
          >
            <i className="fa-solid fa-plus mr-2"></i>
            New event
          </button>
        </div>

        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          events={events}
          eventContent={renderEventContent}
          eventClick={(info) => {
            info.jsEvent.preventDefault();
            setSelectedEvent(info.event);
          }}
          eventClassNames="cursor-pointer"
          height="auto"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
        />
      </div>

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      {showCreate && (
        <CreateEventModal
          onClose={() => setShowCreate(false)}
          onCreated={loadEvents}
        />
      )}
    </div>
  );
}
