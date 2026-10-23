"use client";

import { useEffect, useState } from "react";

interface ClockEvent {
  phase: string;
  investigationEnds: number | null;
  hardEnd: number | null;
  locked?: boolean;
}

export function EventClock({ event, serverNow }: { event: ClockEvent; serverNow: number }) {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    const received = Date.now();
    setNow(serverNow);
    const timer = setInterval(() => setNow(serverNow + Date.now() - received), 1000);
    return () => clearInterval(timer);
  }, [serverNow]);
  const deadline = event.investigationEnds && now < event.investigationEnds ? event.investigationEnds : event.hardEnd;
  const remaining = Math.max(0, Math.ceil(((deadline ?? now) - now) / 1000));
  const closed = event.locked || event.phase === "closed" || (event.hardEnd !== null && now >= event.hardEnd);
  const waiting = event.phase === "lobby" && !closed;
  const final = !!event.investigationEnds && now >= event.investigationEnds;
  const label = waiting ? "Waiting to start" : closed ? "Submissions closed" : final ? "Final submission time left" : "Investigation time left";
  const display = waiting ? "—:—" : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
  return <div className={`event-clock${!waiting && !closed && remaining < 300 ? " low" : ""}`}>
    <span className="event-clock-label">{label}</span>
    <span className="event-clock-value" role="timer" aria-label={label} aria-live="off">{display}</span>
    <small>{waiting ? "The host starts the clock for every team." : event.locked ? "Locked by host · clock continues" : closed ? "The event time has ended." : final ? "Final submissions are open." : "Then final submission time begins."}</small>
  </div>;
}
