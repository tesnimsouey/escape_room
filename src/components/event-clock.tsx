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
  const label = waiting ? "نستناو البداية" : closed ? "الإرسال مسكّر" : final ? "باقي في المهلة الأخيرة" : "باقي في وقت البحث";
  const display = waiting ? "—:—" : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
  return <div className={`event-clock${!waiting && !closed && remaining < 300 ? " low" : ""}`}>
    <span className="event-clock-label">{label}</span>
    <span className="event-clock-value" role="timer" aria-label={label} aria-live="off">{display}</span>
    <small>{waiting ? "المضيف يشغّل الوقت للفرق الكلّ." : event.locked ? "المضيف سكّر الإرسال والوقت ما زال يدور" : closed ? "وقت اللعب وفى." : final ? "المهلة الأخيرة ما زالت محلولة." : "بعدها تبدا المهلة الأخيرة."}</small>
  </div>;
}
