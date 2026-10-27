"use client";
import { useEffect, useRef, useState } from "react";
import { formatBookingDate } from "@/lib/format-date";
const weekdayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
function parseDateParts(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (!match)
        return null;
    return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}
function toKey(year, month, day) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function monthLabel(year, month) {
    return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
}
// Small RoomStay-styled calendar popover. Values stay "YYYY-MM-DD" strings;
// only the display uses friendly formatting.
export function DatePicker({ id, value, min, onChange, invalid, describedBy, labelledBy, }) {
    const [open, setOpen] = useState(false);
    const [view, setView] = useState({ year: 0, month: 1 });
    const containerRef = useRef(null);
    function openCalendar() {
        const current = parseDateParts(value) ?? parseDateParts(min);
        const fallback = new Date();
        setView(current ?? { year: fallback.getFullYear(), month: fallback.getMonth() + 1 });
        setOpen(true);
    }
    useEffect(() => {
        if (!open)
            return undefined;
        function handlePointerDown(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setOpen(false);
            }
        }
        function handleKeyDown(event) {
            if (event.key === "Escape")
                setOpen(false);
        }
        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);
    function shiftMonth(delta) {
        setView((current) => {
            const next = new Date(current.year, current.month - 1 + delta, 1);
            return { year: next.getFullYear(), month: next.getMonth() + 1 };
        });
    }
    function chooseDay(day) {
        onChange(toKey(view.year, view.month, day));
        setOpen(false);
    }
    function chooseToday() {
        if (min) {
            onChange(min);
            setOpen(false);
        }
    }
    const minParts = parseDateParts(min);
    const minMonthKey = minParts ? `${minParts.year}-${String(minParts.month).padStart(2, "0")}` : "";
    const viewMonthKey = `${view.year}-${String(view.month).padStart(2, "0")}`;
    const prevDisabled = minMonthKey !== "" && viewMonthKey <= minMonthKey;
    const firstWeekday = new Date(view.year, view.month - 1, 1).getDay();
    const daysInMonth = new Date(view.year, view.month, 0).getDate();
    const cells = [
        ...Array(firstWeekday).fill(null),
        ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];
    return (<div ref={containerRef} role="group" aria-labelledby={labelledBy} aria-describedby={describedBy} className="relative">
      <button id={id} type="button" onClick={() => (open ? setOpen(false) : openCalendar())} aria-haspopup="dialog" aria-expanded={open} className={`mt-2 flex h-11 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 ${value ? "text-ink" : "text-ink-secondary"} ${invalid ? "border-alert" : "border-line"}`}>
        <span>{value ? formatBookingDate(value) : "Select a date"}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-primary">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <path d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
      </button>

      {open && (<div role="dialog" aria-label="Choose a viewing date" className="absolute z-30 mt-2 w-72 max-w-[calc(100vw-88px)] rounded-xl border border-line bg-white p-3 shadow-lg shadow-ink/10">
          <div className="flex items-center justify-between gap-1">
            <button type="button" onClick={() => shiftMonth(-1)} disabled={prevDisabled} aria-label="Previous month" className="flex size-9 items-center justify-center rounded-lg text-lg leading-none font-semibold text-primary transition-colors hover:bg-primary-tint disabled:cursor-not-allowed disabled:text-ink-secondary disabled:opacity-40 disabled:hover:bg-transparent">
              <span aria-hidden="true">‹</span>
            </button>
            <p aria-live="polite" className="text-sm font-semibold text-ink">{view.year > 0 ? monthLabel(view.year, view.month) : ""}</p>
            <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month" className="flex size-9 items-center justify-center rounded-lg text-lg leading-none font-semibold text-primary transition-colors hover:bg-primary-tint">
              <span aria-hidden="true">›</span>
            </button>
          </div>

          <div role="grid" aria-label={view.year > 0 ? monthLabel(view.year, view.month) : undefined} className="mt-2 grid grid-cols-7 gap-1">
            {weekdayLabels.map((day) => (<span key={day} className="flex h-8 items-center justify-center text-[11px] font-semibold text-ink-secondary">
                {day}
              </span>))}
            {cells.map((day, index) => {
                if (day === null)
                    return <span key={`empty-${index}`}/>;
                const key = toKey(view.year, view.month, day);
                const disabled = min !== "" && key < min;
                const selected = value !== "" && key === value;
                const isToday = min !== "" && key === min;
                return (<button key={key} type="button" onClick={() => chooseDay(day)} disabled={disabled} aria-label={formatBookingDate(key)} aria-pressed={selected} aria-current={isToday && !selected ? "date" : undefined} className={`flex h-8 items-center justify-center rounded-lg text-[13px] transition-colors ${selected
                        ? "bg-primary font-semibold text-white"
                        : disabled
                            ? "cursor-not-allowed text-ink-secondary opacity-35"
                            : "text-ink hover:bg-primary-tint hover:text-primary"} ${isToday && !selected ? "ring-1 ring-primary/40" : ""}`}>
                  {day}
                </button>);
            })}
          </div>

          <button type="button" onClick={chooseToday} className="mt-2 inline-flex min-h-9 w-full items-center justify-center rounded-lg bg-primary-tint px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white">
            Today
          </button>
        </div>)}
    </div>);
}
