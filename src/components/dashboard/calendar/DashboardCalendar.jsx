import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import PageLoader from "@/components/common/PageLoader";
import { getCalendarEvents } from "@/apiIntegration/calendar";
import { DEMO_CALENDAR_EVENTS } from "@/data/calendarDemoEvents";

// API event shape -> FullCalendar event shape
const toCalendarEvent = (e) => ({
  id: e.event_id,
  title: e.title,
  start: e.start_time,
  end: e.end_time || undefined,
  allDay: e.all_day ?? true,
});

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

export default function DashboardCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingDemoData, setUsingDemoData] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const showDemoData = () => {
        if (cancelled) return;
        setEvents(DEMO_CALENDAR_EVENTS.map(toCalendarEvent));
        setUsingDemoData(true);
      };

      try {
        const data = await getCalendarEvents();
        if (cancelled) return;

        const apiEvents = data?.events || [];
        if (apiEvents.length) {
          setEvents(apiEvents.map(toCalendarEvent));
          setUsingDemoData(false);
        } else {
          showDemoData();
        }
      } catch (err) {
        // The endpoint may not be deployed yet. Fall back to the demo event
        // rather than an empty grid, but say so in the UI so nobody mistakes
        // placeholder data for real events.
        console.warn("Calendar events unavailable, showing demo data:", err);
        showDemoData();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <PageLoader loading />;

  return (
    <div className="space-y">
      <div className="dashboard-card p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-xl font-bold text-dark-1">Calendar</h2>
          {usingDemoData && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
              <i className="fa-solid fa-circle-info text-[11px]"></i>
              Demo data
            </span>
          )}
        </div>

        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          events={events}
          eventContent={renderEventContent}
          height="auto"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
        />
      </div>
    </div>
  );
}
