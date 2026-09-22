import React, { useCallback, useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import PageLoader from "@/components/common/PageLoader";
import { getCalendarEvents, createCalendarEvent } from "@/apiIntegration/calendar";
import { getUsers } from "@/apiIntegration/organization";
import AwsButton from "@/components/common/AwsButton";
import OrgRequiredWrapper from "@/components/common/OrgRequiredWrapper";
import { COLORS } from "@/styles/colors";
import "./DashboardCalendar.css";
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

// Local YYYY-MM-DD for the <input type="date"> floor. toISOString() would shift
// the day for anyone east or west of UTC, which is exactly the off-by-one that
// makes "today" look like a past date.
const todayInputValue = () => {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

function CreateEventModal({ onClose, onCreated }) {
  const minDate = todayInputValue();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [usersError, setUsersError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // The people list is a typeahead: it drops down while the field is in use and
  // folds away again, so the dialog stays short and the picks stay visible as
  // chips instead of being buried in a permanently open list.
  const [peopleOpen, setPeopleOpen] = useState(false);
  const peopleRef = useRef(null);

  useEffect(() => {
    if (!peopleOpen) return undefined;
    const onPointerDown = (e) => {
      if (!peopleRef.current?.contains(e.target)) setPeopleOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setPeopleOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [peopleOpen]);

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

  const userLabel = (u) =>
    [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || u.email;

  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const haystack = [u.first_name, u.last_name, u.email]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(userSearch.toLowerCase());
  });

  const selectedUsers = selectedIds
    .map((id) => users.find((u) => u.user_id === id))
    .filter(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      setError("A title and a date are required.");
      return;
    }

    // The `min` attribute stops the picker, but a typed or pasted date still
    // reaches here — an event cannot be scheduled in the past.
    if (date < minDate) {
      setError("Pick today or a later date. Events cannot be set in the past.");
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
      {/* Field styling lives here rather than on each input: the shared
          `form-control` class this modal used carries no styling in the
          dashboard, so every box rendered as bare text on a white sheet. */}
      <style>{`
        .ce-field {
          width: 100%;
          padding: 11px 13px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.5;
          color: ${COLORS.textPrimary};
          background: ${COLORS.bgPrimary};
          border: 1px solid ${COLORS.borderLight};
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          font-family: inherit;
        }
        .ce-field::placeholder { color: ${COLORS.textLight}; }
        .ce-field:hover { border-color: ${COLORS.border}; }
        .ce-field:focus {
          border-color: ${COLORS.primary};
          box-shadow: 0 0 0 3px ${COLORS.primaryAlpha15};
        }
        .ce-field--error {
          border-color: ${COLORS.error};
        }
        .ce-field--error:focus {
          border-color: ${COLORS.error};
          box-shadow: 0 0 0 3px ${COLORS.errorLight};
        }
        textarea.ce-field { resize: vertical; min-height: 88px; }
        .ce-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: ${COLORS.textPrimary};
          margin-bottom: 6px;
        }
        .ce-hint { font-size: 12px; color: ${COLORS.textMuted}; margin-top: 6px; }
        .ce-combo { position: relative; }
        .ce-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 8px;
        }
        .ce-people {
          max-height: 210px;
          overflow-y: auto;
          background: ${COLORS.bgPrimary};
          border: 1px solid ${COLORS.borderLight};
          border-radius: 12px;
          margin-top: 6px;
          box-shadow: 0 12px 24px rgba(15, 48, 83, 0.12);
        }
        .ce-person {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.12s ease;
        }
        .ce-person:hover { background: ${COLORS.bgTertiary}; }
        .ce-person + .ce-person { border-top: 1px solid ${COLORS.borderLight}; }
        .ce-empty {
          padding: 18px 12px;
          text-align: center;
          font-size: 13px;
          color: ${COLORS.textMuted};
        }
        .ce-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 6px 4px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 500;
          background: ${COLORS.primaryLighter};
          color: ${COLORS.primary};
        }
        .ce-chip__x {
          border: 0;
          background: transparent;
          color: inherit;
          cursor: pointer;
          font-size: 11px;
          line-height: 1;
          padding: 2px 4px;
          border-radius: 999px;
          opacity: 0.7;
        }
        .ce-chip__x:hover { opacity: 1; background: rgba(15, 48, 83, 0.1); }
      `}</style>

      <form
        // Column layout so the title and the buttons stay put and only the
        // fields scroll; with the whole form scrolling, a long people list
        // pushed "Create event" out of sight.
        className="bg-white rounded-16 shadow-4 w-full flex flex-col"
        style={{ maxWidth: 560, maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div
          className="flex items-start justify-between gap-4 px-6 py-5 flex-shrink-0"
          style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}
        >
          <div>
            <h3 className="text-lg font-bold text-dark-1">New event</h3>
            <p className="text-sm" style={{ color: COLORS.textMuted, margin: 0 }}>
              Schedule a review, assessment or deadline.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: COLORS.textMuted,
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div
          className="px-6 py-5 flex-1"
          style={{ overflowY: "auto", minHeight: 0 }}
        >
          <div style={{ marginBottom: 18 }}>
            <label className="ce-label" htmlFor="ce-title">
              Title <span style={{ color: COLORS.error }}>*</span>
            </label>
            <input
              id="ce-title"
              type="text"
              className="ce-field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="e.g. Quarterly AI tool review"
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label className="ce-label" htmlFor="ce-date">
              Date <span style={{ color: COLORS.error }}>*</span>
            </label>
            <input
              id="ce-date"
              type="date"
              className="ce-field"
              value={date}
              min={minDate}
              onChange={(e) => setDate(e.target.value)}
            />
            <p className="ce-hint">Today or later.</p>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label className="ce-label" htmlFor="ce-description">
              Description
            </label>
            <textarea
              id="ce-description"
              className="ce-field"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={5000}
              placeholder="What is this event for? (optional)"
            />
          </div>

          <div>
            <label className="ce-label" htmlFor="ce-people">
              Assign to{" "}
              {selectedIds.length > 0 && (
                <span style={{ fontWeight: 400, color: COLORS.textMuted }}>
                  ({selectedIds.length} selected)
                </span>
              )}
            </label>

            {usersError ? (
              <p className="text-sm" style={{ color: COLORS.error, margin: 0 }}>
                {usersError}
              </p>
            ) : (
              <div className="ce-combo" ref={peopleRef}>
                {/* The picks live outside the dropdown so they survive it
                    closing. */}
                {selectedUsers.length > 0 && (
                  <div className="ce-chips">
                    {selectedUsers.map((u) => (
                      <span key={u.user_id} className="ce-chip">
                        {userLabel(u)}
                        <button
                          type="button"
                          className="ce-chip__x"
                          onClick={() => toggleUser(u.user_id)}
                          aria-label={`Remove ${userLabel(u)}`}
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <input
                  id="ce-people"
                  type="text"
                  className="ce-field"
                  placeholder="Search people in your organization"
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setPeopleOpen(true);
                  }}
                  onFocus={() => setPeopleOpen(true)}
                  role="combobox"
                  aria-expanded={peopleOpen}
                  aria-controls="ce-people-list"
                  autoComplete="off"
                />

                {peopleOpen && (
                  <div className="ce-people" id="ce-people-list" role="listbox">
                    {filteredUsers.length ? (
                      filteredUsers.map((u) => {
                        const name = userLabel(u);
                        const checked = selectedIds.includes(u.user_id);
                        return (
                          <label
                            key={u.user_id}
                            className="ce-person"
                            role="option"
                            aria-selected={checked}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleUser(u.user_id)}
                            />
                            <span style={{ color: COLORS.textPrimary }}>
                              {name}
                            </span>
                            {u.email && name !== u.email && (
                              <span
                                style={{ color: COLORS.textMuted, fontSize: 12 }}
                              >
                                {u.email}
                              </span>
                            )}
                          </label>
                        );
                      })
                    ) : (
                      <p className="ce-empty">
                        {users.length
                          ? "No one matches that search."
                          : "No other people in your organization yet."}
                      </p>
                    )}
                  </div>
                )}

                {!peopleOpen && selectedUsers.length === 0 && (
                  <p className="ce-hint">
                    Start typing to find people, or click to see everyone.
                  </p>
                )}
              </div>
            )}
          </div>

          {error && (
            <p
              className="text-sm"
              style={{ color: COLORS.error, marginTop: 16, marginBottom: 0 }}
            >
              {error}
            </p>
          )}
        </div>

        <div
          className="flex justify-end gap-2 px-6 py-4 flex-shrink-0"
          style={{ borderTop: `1px solid ${COLORS.borderLight}` }}
        >
          <AwsButton variant="secondary" onClick={onClose}>
            Cancel
          </AwsButton>
          <AwsButton type="submit" loading={submitting}>
            {submitting ? "Creating…" : "Create event"}
          </AwsButton>
        </div>
      </form>
    </div>
  );
}

export default function DashboardCalendar() {
  const calendarWrapRef = useRef(null);

  // Analysts (the USER role) read the calendar; admins and managers schedule
  // on it. Same role source the AI Compliance list uses.
  const roles = (() => {
    try {
      const info = JSON.parse(localStorage.getItem("user_info") || "{}");
      return (info?.roles || []).map((r) => String(r).toUpperCase());
    } catch {
      return [];
    }
  })();
  const canCreateEvent = roles.some((r) => r === "ADMIN" || r === "MANAGER");
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

  // FullCalendar disables "Today" whenever the visible range already contains
  // today, so the button lands greyed out on the month you arrive on. Keep it
  // live: a click is a harmless no-op there, and a control that looks broken on
  // first sight is worse than one that does nothing.
  const enableTodayButton = useCallback(() => {
    const button = calendarWrapRef.current?.querySelector(".fc-today-button");
    if (button) button.disabled = false;
  }, []);

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
    <div className="space-y dashboard-calendar" ref={calendarWrapRef}>
      <div className="dashboard-card p-6">
        {/* No heading here - the page header already says "Calendar". */}
        <div className="flex items-center justify-end mb-4 flex-wrap gap-2">
          <OrgRequiredWrapper
            disabled={!canCreateEvent}
            message="Only admin users can create events"
          >
            <AwsButton
              onClick={() => canCreateEvent && setShowCreate(true)}
              disabled={!canCreateEvent}
            >
              <i className="fa-solid fa-plus"></i>
              New event
            </AwsButton>
          </OrgRequiredWrapper>
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
          // Runs on first render and after every prev/next/today, which is
          // exactly when FullCalendar re-evaluates the button's state.
          datesSet={() => requestAnimationFrame(enableTodayButton)}
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
