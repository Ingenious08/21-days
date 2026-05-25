import { useState, useEffect, useCallback, useRef } from "react";

/* ══════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════ */
const START_DATE = new Date("2026-05-25T00:00:00");
const TOTAL_DAYS = 21;
const OIL_DAYS   = new Set([1, 4, 7, 10, 13, 16, 19]);
const WASH_DAYS  = new Set([2, 5, 8, 11, 14, 17, 20]);

/* ══════════════════════════════════════════════════
   SKINCARE & HAIRCARE DATA
══════════════════════════════════════════════════ */
const SKINCARE_AM = [
  { id: "sc_am_wash",  icon: "🧼", label: "Face Wash / Cleanser" },
  { id: "sc_am_toner", icon: "💦", label: "Toner" },
  { id: "sc_am_moist", icon: "🧴", label: "Moisturizer" },
  { id: "sc_am_spf",   icon: "☀️", label: "Sunscreen SPF" },
];
const SKINCARE_PM = [
  { id: "sc_pm_oil",   icon: "🌿", label: "Cleansing Oil / Balm" },
  { id: "sc_pm_wash",  icon: "🧼", label: "Face Wash" },
  { id: "sc_pm_serum", icon: "💎", label: "Serum / Treatment" },
  { id: "sc_pm_night", icon: "🌙", label: "Night Cream / Gel" },
];
const SKINCARE_WEEKLY = [
  { id: "sc_wk_mask",  icon: "✨", label: "Face Mask (15–20 min)" },
  { id: "sc_wk_exfol", icon: "🌸", label: "Gentle Exfoliation" },
  { id: "sc_wk_eye",   icon: "👁️", label: "Under-Eye Patches" },
];
const ALL_SKINCARE = [...SKINCARE_AM, ...SKINCARE_PM, ...SKINCARE_WEEKLY];

const HAIR_OILS   = ["Coconut 🥥","Argan 🌿","Castor 🍶","Olive 🫒","Almond 🌰","Bhringraj 🌺","Jojoba 🌾"];
const OIL_TIMINGS = ["30 min","1 hour","2 hours","4 hours","Overnight"];
const WASH_STEPS  = [
  { id: "hw_shampoo", icon: "🧴", label: "Shampoo" },
  { id: "hw_cond",    icon: "💆", label: "Conditioner" },
  { id: "hw_mask",    icon: "🌿", label: "Hair Mask / Deep Treatment" },
  { id: "hw_serum",   icon: "✨", label: "Hair Serum / Leave-in" },
];

/* ══════════════════════════════════════════════════
   CATEGORY CONFIG
══════════════════════════════════════════════════ */
const CATS = {
  schedule: { label: "Daily Rhythm",  color: "#6d9e84", pale: "#eaf4ee" },
  meals:    { label: "Nourishment",   color: "#c07a50", pale: "#fdf0e6" },
  mind:     { label: "Mind & Soul",   color: "#8878c0", pale: "#eee9f8" },
  body:     { label: "Movement",      color: "#5090bc", pale: "#e6f2f9" },
  beauty:   { label: "Self Care",     color: "#c06888", pale: "#fce8ef" },
};

/* ══════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════ */
function getDayDate(n) {
  const d = new Date(START_DATE);
  d.setDate(d.getDate() + (n - 1));
  return d;
}
function isDaySunday(n) { return getDayDate(n).getDay() === 0; }

function fmtLong(n) {
  return getDayDate(n).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long",
  });
}

function getTasksForDay(n) {
  const t = [
    { id:"wake",    icon:"🌅", label:"Wake Up",       sub:"7–8 AM",           cat:"schedule" },
    { id:"sleep",   icon:"🌙", label:"Wind Down",      sub:"Sleep by 12–1 AM", cat:"schedule" },
    { id:"meal1",   icon:"🍳", label:"Breakfast",      cat:"meals",  isMeal:true },
    { id:"meal2",   icon:"🥗", label:"Lunch",          cat:"meals",  isMeal:true },
    { id:"meal3",   icon:"🍲", label:"Dinner",         cat:"meals",  isMeal:true },
    { id:"reading", icon:"📖", label:"Read",           sub:"5 pages minimum",  cat:"mind" },
    { id:"writing", icon:"✏️", label:"Write",          sub:"4–5 key points",   cat:"mind" },
    { id:"exercise",icon:"🏃", label:"Move Your Body", sub:"any exercise counts", cat:"body" },
  ];
  if (isDaySunday(n))  t.push({ id:"skincare",icon:"✨", label:"Sunday Skin Ritual",  sub:"full routine",     cat:"beauty", isSkincare:true });
  if (OIL_DAYS.has(n)) t.push({ id:"oiling",  icon:"💧", label:"Hair Oiling",         sub:"nourish your scalp", cat:"beauty", isHairOil:true });
  if (WASH_DAYS.has(n))t.push({ id:"hairwash",icon:"🚿", label:"Hair Wash",            sub:"post-oil cleanse", cat:"beauty", isHairWash:true });
  return t;
}

function getCurrentDayNum() {
  const now = new Date(); now.setHours(0,0,0,0);
  const st  = new Date(START_DATE); st.setHours(0,0,0,0);
  return Math.floor((now - st) / 86400000) + 1;
}

const DOW = ["Su","Mo","Tu","We","Th","Fr","Sa"];

/* ══════════════════════════════════════════════════
   ROOT APP
══════════════════════════════════════════════════ */
export default function App() {
  const [dayData,  setDayData]  = useState({});
  const [tab,      setTab]      = useState("today");
  const [viewDay,  setViewDay]  = useState(null);
  const [loaded,   setLoaded]   = useState(false);
  const [toast,    setToast]    = useState(null);
  const toastRef = useRef(null);

  const curDay     = getCurrentDayNum();
  const displayDay = viewDay ?? Math.max(1, Math.min(Math.max(curDay, 1), TOTAL_DAYS));

  /* Persist */
  useEffect(() => {
    try { const r = localStorage.getItem("wellness21_v2"); if (r) setDayData(JSON.parse(r)); }
    catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem("wellness21_v2", JSON.stringify(dayData)); } catch {}
  }, [dayData, loaded]);

  /* Toast */
  const showToast = useCallback((msg) => {
    clearTimeout(toastRef.current);
    setToast({ msg, id: Date.now() });
    toastRef.current = setTimeout(() => setToast(null), 2500);
  }, []);

  /* Task toggle */
  const toggleTask = useCallback((dn, tid) => {
    setDayData(prev => {
      const day   = prev[dn] || { tasks:{} };
      const tasks = { ...(day.tasks||{}) };
      const wasDone = !!tasks[tid]?.done;
      tasks[tid] = { ...tasks[tid], done: !wasDone };
      if (!wasDone) showToast("✓ Lovely! Habit noted.");
      return { ...prev, [dn]: { ...day, tasks } };
    });
  }, [showToast]);

  /* Update sub-field on a task */
  const updateField = useCallback((dn, tid, field, value) => {
    setDayData(prev => {
      const day   = prev[dn] || { tasks:{} };
      const tasks = { ...(day.tasks||{}) };
      tasks[tid]  = { ...tasks[tid], [field]: value };
      return { ...prev, [dn]: { ...day, tasks } };
    });
  }, []);

  /* Computed stats */
  const totalStat = (() => {
    let done = 0, total = 0;
    for (let d = 1; d <= TOTAL_DAYS; d++) {
      const t = getTasksForDay(d), s = dayData[d]?.tasks || {};
      total += t.length;
      done  += t.filter(tk => s[tk.id]?.done).length;
    }
    return { done, total, pct: total > 0 ? Math.round(done / total * 100) : 0 };
  })();

  const streak = (() => {
    let cur = 0;
    for (let d = 1; d <= Math.min(curDay, TOTAL_DAYS); d++) {
      const t = getTasksForDay(d), s = dayData[d]?.tasks || {};
      const pct = t.length ? t.filter(tk => s[tk.id]?.done).length / t.length : 0;
      if (pct >= 0.6) cur++;
      else if (d < curDay) cur = 0;
    }
    return cur;
  })();

  const dayCompletion = (d) => {
    const t = getTasksForDay(d), s = dayData[d]?.tasks || {};
    const done = t.filter(tk => s[tk.id]?.done).length;
    return { done, total: t.length, pct: t.length ? done / t.length : 0 };
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning 🌸";
    if (h < 17) return "Good afternoon ☀️";
    if (h < 21) return "Good evening 🌙";
    return "Good night ✨";
  };

  const journeyPct = Math.max(0, Math.min(100, (Math.max(curDay - 1, 0) / TOTAL_DAYS) * 100));

  return (
    <>
      <style>{CSS}</style>
      <div className="app">

        {/* ── HEADER ── */}
        <header className="hdr">
          <div className="hdr-inner">
            <div className="hdr-left">
              <p className="hdr-greet">{greeting()}</p>
              <h1 className="hdr-title">21-Day Wellness</h1>
              <p className="hdr-sub">
                {curDay <= 0 ? "Starting May 25 ✨"
                  : curDay > 21 ? "🌟 All 21 days complete!"
                  : `Day ${curDay} of 21`}
              </p>
            </div>
            <div className="hdr-badges">
              <div className="badge-pill badge-streak">🔥 {streak} streak</div>
              <div className="badge-pill badge-pct">{totalStat.pct}% done</div>
            </div>
          </div>
          <div className="hdr-prog-wrap">
            <div className="hdr-prog-bg">
              <div className="hdr-prog-fill" style={{ width: `${journeyPct}%` }} />
            </div>
            <div className="hdr-prog-labels">
              <span>Day 1</span>
              <span>Day 21</span>
            </div>
          </div>
        </header>

        {/* ── NAV ── */}
        <nav className="nav">
          {[
            { id:"today", label:"Today",    emoji:"🌿" },
            { id:"cal",   label:"Calendar", emoji:"📅" },
            { id:"prog",  label:"Progress", emoji:"📊" },
          ].map(t => (
            <button key={t.id}
              className={`nav-btn${tab === t.id ? " nav-active" : ""}`}
              onClick={() => setTab(t.id)}>
              <span className="nav-emoji">{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        {/* ── CONTENT ── */}
        <main className="main">
          {tab === "today" && (
            <TodayView
              dayNum={displayDay} curDay={curDay}
              dayData={dayData}
              toggleTask={toggleTask}
              updateField={updateField}
              setViewDay={setViewDay}
            />
          )}
          {tab === "cal" && (
            <CalendarView
              curDay={curDay}
              dayCompletion={dayCompletion}
              onDayClick={(d) => { setViewDay(d); setTab("today"); }}
            />
          )}
          {tab === "prog" && (
            <ProgressView
              dayData={dayData} curDay={curDay}
              totalStat={totalStat} streak={streak}
              dayCompletion={dayCompletion}
            />
          )}
        </main>

        {/* ── TOAST ── */}
        {toast && <div key={toast.id} className="toast">{toast.msg}</div>}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════
   TODAY VIEW
══════════════════════════════════════════════════ */
function TodayView({ dayNum, curDay, dayData, toggleTask, updateField, setViewDay }) {
  const tasks    = getTasksForDay(dayNum);
  const saved    = dayData[dayNum]?.tasks || {};
  const isFuture = dayNum > curDay && curDay > 0;
  const isToday  = dayNum === curDay;
  const isPast   = dayNum < curDay;

  const doneCount = tasks.filter(t => saved[t.id]?.done).length;
  const pct       = tasks.length ? doneCount / tasks.length : 0;
  const pctPct    = Math.round(pct * 100);

  // Group tasks by category
  const groups = {};
  tasks.forEach(t => { (groups[t.cat] = groups[t.cat] || []).push(t); });

  const barColor = pct === 1 ? "#6d9e84" : pct >= 0.6 ? "#c07a50" : "#c06888";

  return (
    <div className="view ani">
      {/* Day nav */}
      <div className="day-nav">
        <button className="arrow-btn"
          onClick={() => setViewDay(Math.max(1, dayNum - 1))}
          disabled={dayNum <= 1}>‹</button>
        <div className="day-center">
          <div className="day-num-row">
            <span className="day-num">Day {dayNum}</span>
            {isToday  && <span className="chip chip-today">Today</span>}
            {isPast   && <span className="chip chip-past">Logged</span>}
            {isFuture && <span className="chip chip-future">Coming up</span>}
          </div>
          <p className="day-date">{fmtLong(dayNum)}</p>
        </div>
        <button className="arrow-btn"
          onClick={() => setViewDay(Math.min(21, dayNum + 1))}
          disabled={dayNum >= 21}>›</button>
      </div>

      {/* Day progress */}
      <div className="day-prog-card">
        <div className="day-prog-row">
          <span className="day-prog-label">{doneCount} of {tasks.length} habits</span>
          <span className="day-prog-pct" style={{ color: barColor }}>{pctPct}%</span>
        </div>
        <div className="prog-bar-bg">
          <div className="prog-bar-fill"
            style={{ width: `${pctPct}%`, background: barColor }} />
        </div>
        {pct === 1 && <p className="perfect-msg">🌟 Perfect day! You're glowing.</p>}
        {pct >= 0.6 && pct < 1 && <p className="good-msg">✨ Beautiful progress today.</p>}
      </div>

      {/* Tasks */}
      {isFuture ? (
        <div className="future-box">
          <div style={{ fontSize: 44, marginBottom: 10 }}>🌱</div>
          <p className="future-title">Day {dayNum} is coming up</p>
          <p className="future-sub">Stay consistent — your future self will thank you.</p>
        </div>
      ) : (
        Object.entries(groups).map(([cat, catTasks]) => (
          <div key={cat} className="task-group">
            <p className="cat-label" style={{ color: CATS[cat].color }}>
              {CATS[cat].label}
            </p>
            {catTasks.map(task => {
              const s = saved[task.id] || {};
              if (task.isSkincare) return (
                <SkincareCard key={task.id} task={task} saved={s}
                  onToggle={() => toggleTask(dayNum, task.id)}
                  onUpdate={(f, v) => updateField(dayNum, task.id, f, v)} />
              );
              if (task.isHairOil) return (
                <HairOilCard key={task.id} task={task} saved={s}
                  onToggle={() => toggleTask(dayNum, task.id)}
                  onUpdate={(f, v) => updateField(dayNum, task.id, f, v)} />
              );
              if (task.isHairWash) return (
                <HairWashCard key={task.id} task={task} saved={s}
                  onToggle={() => toggleTask(dayNum, task.id)}
                  onUpdate={(f, v) => updateField(dayNum, task.id, f, v)} />
              );
              return (
                <TaskCard key={task.id} task={task} saved={s}
                  onToggle={() => toggleTask(dayNum, task.id)}
                  onUpdate={(f, v) => updateField(dayNum, task.id, f, v)} />
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   TASK CARD (basic)
══════════════════════════════════════════════════ */
function TaskCard({ task, saved, onToggle, onUpdate }) {
  const done = !!saved.done;
  const cat  = CATS[task.cat];
  return (
    <div className={`tcard${done ? " tcard-done" : ""}`} onClick={onToggle}>
      <div className="tcard-bar"   style={{ background: cat.color }} />
      <div className="tcard-icon"  style={{ background: cat.pale }}>{task.icon}</div>
      <div className="tcard-body">
        <p className={`tcard-name${done ? " tcard-name-done" : ""}`}>{task.label}</p>
        {task.sub && <p className="tcard-sub">{task.sub}</p>}
        {task.isMeal && done && (
          <div className="meal-row" onClick={e => e.stopPropagation()}>
            {["🏠 Home", "🏪 Outside"].map(mt => (
              <button key={mt}
                className={`pill${saved.mealType === mt ? " pill-on" : ""}`}
                style={saved.mealType === mt
                  ? { background: cat.pale, borderColor: cat.color, color: cat.color }
                  : {}}
                onClick={() => onUpdate("mealType", saved.mealType === mt ? null : mt)}>
                {mt}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className={`tcheck${done ? " tcheck-on" : ""}`}
        style={done ? { background: cat.color, borderColor: cat.color } : {}}>
        {done && "✓"}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SKINCARE CARD (Sunday)
══════════════════════════════════════════════════ */
function SkincareCard({ task, saved, onToggle, onUpdate }) {
  const [open, setOpen] = useState(false);
  const done = !!saved.done;
  const cat  = CATS[task.cat];
  const stepsDone = ALL_SKINCARE.filter(s => saved[s.id]).length;

  return (
    <div className={`tcard expand-card${done ? " tcard-done" : ""}${open ? " tcard-open" : ""}`}>
      <div className="tcard-bar"  style={{ background: cat.color }} />
      <div className="tcard-icon" style={{ background: cat.pale }}>{task.icon}</div>
      <div className="tcard-body" onClick={() => setOpen(o => !o)}>
        <p className={`tcard-name${done ? " tcard-name-done" : ""}`}>{task.label}</p>
        <p className="tcard-sub">
          {stepsDone}/{ALL_SKINCARE.length} steps · {open ? "tap to close ▲" : "tap to expand ▼"}
        </p>
      </div>
      <div className={`tcheck${done ? " tcheck-on" : ""}`}
        style={done ? { background: cat.color, borderColor: cat.color } : {}}
        onClick={onToggle}>{done && "✓"}
      </div>

      {open && (
        <div className="expand-panel">
          {[
            { title: "☀️ Morning Ritual",  steps: SKINCARE_AM },
            { title: "🌙 Evening Ritual",  steps: SKINCARE_PM },
            { title: "🌸 Weekly Treats",   steps: SKINCARE_WEEKLY },
          ].map(({ title, steps }) => (
            <div key={title} className="expand-section">
              <p className="expand-title">{title}</p>
              {steps.map(step => (
                <div key={step.id} className="step-row"
                  onClick={() => onUpdate(step.id, !saved[step.id])}>
                  <div className={`mini-chk${saved[step.id] ? " mini-chk-on" : ""}`}
                    style={saved[step.id] ? { background: cat.color, borderColor: cat.color } : {}}>
                    {saved[step.id] && "✓"}
                  </div>
                  <span>{step.icon} {step.label}</span>
                </div>
              ))}
            </div>
          ))}
          <button className="mark-btn" style={{ color: cat.color }}
            onClick={() => {
              ALL_SKINCARE.forEach(s => onUpdate(s.id, true));
              if (!done) onToggle();
              setOpen(false);
            }}>
            Mark all done ✓
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   HAIR OIL CARD
══════════════════════════════════════════════════ */
function HairOilCard({ task, saved, onToggle, onUpdate }) {
  const [open, setOpen] = useState(false);
  const done = !!saved.done;
  const cat  = CATS[task.cat];

  return (
    <div className={`tcard expand-card${done ? " tcard-done" : ""}${open ? " tcard-open" : ""}`}>
      <div className="tcard-bar"  style={{ background: cat.color }} />
      <div className="tcard-icon" style={{ background: cat.pale }}>{task.icon}</div>
      <div className="tcard-body" onClick={() => setOpen(o => !o)}>
        <p className={`tcard-name${done ? " tcard-name-done" : ""}`}>{task.label}</p>
        <p className="tcard-sub">
          {saved.oil
            ? `${saved.oil}${saved.duration ? ` · ${saved.duration}` : ""}`
            : `nourish your scalp · ${open ? "close ▲" : "log details ▼"}`}
        </p>
      </div>
      <div className={`tcheck${done ? " tcheck-on" : ""}`}
        style={done ? { background: cat.color, borderColor: cat.color } : {}}
        onClick={onToggle}>{done && "✓"}
      </div>

      {open && (
        <div className="expand-panel">
          <p className="expand-title">Which oil did you use?</p>
          <div className="pills-wrap">
            {HAIR_OILS.map(o => (
              <button key={o}
                className={`pill${saved.oil === o ? " pill-on" : ""}`}
                style={saved.oil === o ? { background: cat.pale, borderColor: cat.color, color: cat.color } : {}}
                onClick={() => onUpdate("oil", saved.oil === o ? null : o)}>{o}
              </button>
            ))}
          </div>

          <p className="expand-title" style={{ marginTop: 14 }}>Left in for how long?</p>
          <div className="pills-wrap">
            {OIL_TIMINGS.map(t => (
              <button key={t}
                className={`pill${saved.duration === t ? " pill-on" : ""}`}
                style={saved.duration === t ? { background: cat.pale, borderColor: cat.color, color: cat.color } : {}}
                onClick={() => onUpdate("duration", saved.duration === t ? null : t)}>{t}
              </button>
            ))}
          </div>

          <button className="mark-btn" style={{ color: cat.color }}
            onClick={() => { if (!done) onToggle(); setOpen(false); }}>
            {done ? "Logged ✓" : "Mark as done ✓"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   HAIR WASH CARD
══════════════════════════════════════════════════ */
function HairWashCard({ task, saved, onToggle, onUpdate }) {
  const [open, setOpen] = useState(false);
  const done = !!saved.done;
  const cat  = CATS[task.cat];
  const stepsDone = WASH_STEPS.filter(s => saved[s.id]).length;

  return (
    <div className={`tcard expand-card${done ? " tcard-done" : ""}${open ? " tcard-open" : ""}`}>
      <div className="tcard-bar"  style={{ background: cat.color }} />
      <div className="tcard-icon" style={{ background: cat.pale }}>{task.icon}</div>
      <div className="tcard-body" onClick={() => setOpen(o => !o)}>
        <p className={`tcard-name${done ? " tcard-name-done" : ""}`}>{task.label}</p>
        <p className="tcard-sub">
          {stepsDone > 0
            ? `${stepsDone}/${WASH_STEPS.length} steps done · ${open ? "close ▲" : "view ▼"}`
            : `post-oil cleanse · ${open ? "close ▲" : "log routine ▼"}`}
        </p>
      </div>
      <div className={`tcheck${done ? " tcheck-on" : ""}`}
        style={done ? { background: cat.color, borderColor: cat.color } : {}}
        onClick={onToggle}>{done && "✓"}
      </div>

      {open && (
        <div className="expand-panel">
          <p className="expand-title">Today's wash routine</p>
          {WASH_STEPS.map(step => (
            <div key={step.id} className="step-row"
              onClick={() => onUpdate(step.id, !saved[step.id])}>
              <div className={`mini-chk${saved[step.id] ? " mini-chk-on" : ""}`}
                style={saved[step.id] ? { background: cat.color, borderColor: cat.color } : {}}>
                {saved[step.id] && "✓"}
              </div>
              <span>{step.icon} {step.label}</span>
            </div>
          ))}
          <button className="mark-btn" style={{ color: cat.color }}
            onClick={() => { if (!done) onToggle(); setOpen(false); }}>
            {done ? "Logged ✓" : "Mark wash as done ✓"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   CALENDAR VIEW
══════════════════════════════════════════════════ */
function CalendarView({ curDay, dayCompletion, onDayClick }) {
  const [hovered, setHovered] = useState(null);

  // Build grid with leading empty cells
  const startDow = getDayDate(1).getDay(); // Mon = 1
  const cells = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1),
  ];

  const cellStyle = (d) => {
    if (d > curDay && curDay > 0) return { bg:"#f2ede6", border:"#e4ddd4", txt:"#c4b8ac" };
    const { pct } = dayCompletion(d);
    if (pct >= 0.9) return { bg:"#d8eedf", border:"#a8d4b4", txt:"#3d7a52" };
    if (pct >= 0.6) return { bg:"#fdecd6", border:"#e8c090", txt:"#7a4e1a" };
    if (pct >= 0.3) return { bg:"#fde4d4", border:"#e8b098", txt:"#7a3818" };
    if (pct >  0)   return { bg:"#fce0e8", border:"#e8a8bc", txt:"#7a2840" };
    return { bg:"#fce8e8", border:"#e0b4b4", txt:"#9a5050" };
  };

  const summary = Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1)
    .filter(d => d <= Math.max(curDay, 0))
    .reduce((a, d) => {
      const p = dayCompletion(d).pct;
      if (p >= 0.9) a.g++; else if (p >= 0.6) a.ok++; else a.b++;
      return a;
    }, { g:0, ok:0, b:0 });

  return (
    <div className="view ani">
      <h2 className="sec-title">Your 21-Day Journey</h2>

      {/* Legend */}
      <div className="legend">
        {[{c:"#d8eedf",l:"90%+"},{c:"#fdecd6",l:"60%+"},{c:"#fde4d4",l:"30%+"},
          {c:"#fce0e8",l:"Some"},{c:"#fce8e8",l:"Missed"},{c:"#f2ede6",l:"Upcoming"}]
          .map(x => (
            <div key={x.l} className="leg-item">
              <div className="leg-dot" style={{ background: x.c, border:`1px solid ${x.c}` }} />
              <span>{x.l}</span>
            </div>
          ))}
      </div>

      {/* Grid */}
      <div className="cal-grid">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d, i) => (
          <div key={i} className="cal-head">{d}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="cal-empty" />;
          const { done, total, pct } = dayCompletion(d);
          const cs   = cellStyle(d);
          const isNow = d === curDay;
          const date  = getDayDate(d);
          const canClick = d <= Math.max(curDay, 1);
          const special = [
            isDaySunday(d) && "✨",
            OIL_DAYS.has(d)  && "💧",
            WASH_DAYS.has(d) && "🚿",
          ].filter(Boolean);

          return (
            <div key={d}
              className={`cal-cell${isNow ? " cal-now" : ""}${canClick ? " cal-clickable" : ""}`}
              style={{
                background: cs.bg,
                borderColor: isNow ? "#6d9e84" : cs.border,
                borderWidth: isNow ? 2 : 1,
                color: cs.txt,
              }}
              onClick={() => canClick && onDayClick(d)}
              onMouseEnter={() => setHovered(d)}
              onMouseLeave={() => setHovered(null)}>
              <span className="cal-daynum">{d}</span>
              <span style={{ fontSize: 7, opacity: .65 }}>{DOW[date.getDay()]}</span>
              {d <= Math.max(curDay, 0)
                ? <span style={{ fontSize: 8 }}>{done}/{total}</span>
                : <span style={{ fontSize: 8 }}>—</span>}
              {isNow && <span className="cal-now-dot" />}
              {special.length > 0 && (
                <div style={{ display:"flex", gap:1, justifyContent:"center" }}>
                  {special.map((s, i) => <span key={i} style={{ fontSize: 7 }}>{s}</span>)}
                </div>
              )}
              {pct > 0 && pct < 1 && d <= curDay && (
                <div className="cal-mini-bar-bg">
                  <div className="cal-mini-bar-fill"
                    style={{ width:`${pct*100}%`, background: cs.border }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {hovered && (
        <div className="cal-tip">
          <strong>Day {hovered}</strong> — {fmtLong(hovered)}
          {isDaySunday(hovered)    && " · ✨ Skincare"}
          {OIL_DAYS.has(hovered)   && " · 💧 Oil"}
          {WASH_DAYS.has(hovered)  && " · 🚿 Wash"}
          {hovered <= curDay && ` · ${dayCompletion(hovered).done}/${dayCompletion(hovered).total} done`}
        </div>
      )}

      {/* Summary */}
      <div className="cal-summary">
        {[
          { v: summary.g,  l: "Champion Days", c: "#3d7a52"  },
          { v: summary.ok, l: "Good Days",      c: "#c07a50"  },
          { v: summary.b,  l: "To Improve",     c: "#c06888"  },
        ].map(x => (
          <div key={x.l} className="sum-item">
            <span className="sum-num" style={{ color: x.c }}>{x.v}</span>
            <span className="sum-lbl">{x.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PROGRESS VIEW
══════════════════════════════════════════════════ */
function ProgressView({ dayData, curDay, totalStat, streak, dayCompletion }) {
  const logged = Math.max(0, Math.min(curDay, TOTAL_DAYS));

  // Category stats
  const catStats = {};
  for (let d = 1; d <= logged; d++) {
    getTasksForDay(d).forEach(t => {
      catStats[t.cat] = catStats[t.cat] || { done:0, total:0 };
      catStats[t.cat].total++;
      if (dayData[d]?.tasks?.[t.id]?.done) catStats[t.cat].done++;
    });
  }

  // Per-task stats
  const taskMap = {};
  for (let d = 1; d <= logged; d++) {
    getTasksForDay(d).forEach(t => {
      taskMap[t.id] = taskMap[t.id] || { label:t.label, icon:t.icon, done:0, total:0 };
      taskMap[t.id].total++;
      if (dayData[d]?.tasks?.[t.id]?.done) taskMap[t.id].done++;
    });
  }

  const allTasks    = Object.values(taskMap).filter(t => t.total > 0);
  const bestTasks   = [...allTasks].sort((a,b) => (b.done/b.total)-(a.done/a.total)).slice(0,4);
  const needsTasks  = [...allTasks]
    .filter(t => t.done < t.total)
    .sort((a,b) => (a.done/a.total)-(b.done/b.total))
    .slice(0,3);

  const perfectDays = Array.from({ length: logged }, (_, i) => i + 1)
    .filter(d => { const { done, total } = dayCompletion(d); return total > 0 && done === total; }).length;

  const heroColor = totalStat.pct >= 70 ? "#6d9e84" : totalStat.pct >= 40 ? "#c07a50" : "#c06888";

  return (
    <div className="view ani prog-view">

      {/* Hero */}
      <div className="prog-hero">
        <div className="prog-big" style={{ color: heroColor }}>{totalStat.pct}%</div>
        <p className="prog-hero-sub">overall completion</p>
        <div className="prog-hero-row">
          {[
            { v: streak,          l: "Day Streak",   ico: "🔥" },
            { v: perfectDays,     l: "Perfect Days", ico: "🌟" },
            { v: `${totalStat.done}/${totalStat.total}`, l: "Tasks Done", ico: "✓" },
          ].map(x => (
            <div key={x.l} className="prog-mini">
              <span className="prog-mini-ico">{x.ico}</span>
              <span className="prog-mini-val">{x.v}</span>
              <span className="prog-mini-lbl">{x.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category breakdown */}
      <div className="prog-card">
        <p className="prog-card-title">By Category</p>
        {Object.entries(catStats).length === 0
          ? <p style={{ color:"#b0a89e", fontSize:13, textAlign:"center", padding:"12px 0" }}>
              Start logging habits to see your breakdown!
            </p>
          : Object.entries(catStats).map(([cat, { done, total }]) => {
              const p = total ? done / total * 100 : 0;
              return (
                <div key={cat} className="cat-row">
                  <span className="cat-row-label" style={{ color: CATS[cat].color }}>
                    {CATS[cat].label}
                  </span>
                  <div className="cat-bar-bg">
                    <div className="cat-bar-fill"
                      style={{ width:`${p}%`, background: CATS[cat].color }} />
                  </div>
                  <span className="cat-bar-pct">{Math.round(p)}%</span>
                </div>
              );
            })}
      </div>

      {/* Best habits */}
      {bestTasks.some(t => t.done > 0) && (
        <div className="prog-card">
          <p className="prog-card-title">💚 Your Strongest Habits</p>
          {bestTasks.filter(t => t.done > 0).map((t, i) => {
            const p = Math.round(t.done / t.total * 100);
            return (
              <div key={i} className="habit-row">
                <span className="habit-ico">{t.icon}</span>
                <div className="habit-info">
                  <span className="habit-lbl">{t.label}</span>
                  <div className="habit-bar-bg">
                    <div className="habit-bar" style={{ width:`${p}%`, background:"#6d9e84" }} />
                  </div>
                </div>
                <span className="habit-pct">{p}%</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Needs love */}
      {needsTasks.length > 0 && (
        <div className="prog-card needs-card">
          <p className="prog-card-title">🌱 Give These More Love</p>
          {needsTasks.map((t, i) => {
            const p = Math.round(t.done / t.total * 100);
            return (
              <div key={i} className="habit-row">
                <span className="habit-ico">{t.icon}</span>
                <div className="habit-info">
                  <span className="habit-lbl">{t.label}</span>
                  <div className="habit-bar-bg">
                    <div className="habit-bar" style={{ width:`${p}%`, background:"#c06888" }} />
                  </div>
                </div>
                <span className="habit-pct">{p}%</span>
              </div>
            );
          })}
          <p className="needs-note">Progress, not perfection. Be gentle with yourself 🌸</p>
        </div>
      )}

      {/* Special days reminder */}
      <div className="prog-card">
        <p className="prog-card-title">🗓️ Special Days This Journey</p>
        <div className="special-grid">
          <div className="special-item" style={{ background:"#fce8ef", borderColor:"#e8b0c4" }}>
            <span style={{ fontSize:20 }}>✨</span>
            <span style={{ fontWeight:600, fontSize:12, color:"#c06888" }}>Skincare</span>
            <span style={{ fontSize:11, color:"#9a7080" }}>Every Sunday</span>
          </div>
          <div className="special-item" style={{ background:"#fdf0e6", borderColor:"#e8c8a0" }}>
            <span style={{ fontSize:20 }}>💧</span>
            <span style={{ fontWeight:600, fontSize:12, color:"#c07a50" }}>Hair Oil</span>
            <span style={{ fontSize:11, color:"#9a7050" }}>Every 3 days</span>
          </div>
          <div className="special-item" style={{ background:"#eaf4ee", borderColor:"#a8d4b4" }}>
            <span style={{ fontSize:20 }}>🚿</span>
            <span style={{ fontWeight:600, fontSize:12, color:"#6d9e84" }}>Hair Wash</span>
            <span style={{ fontSize:11, color:"#507060" }}>Day after oil</span>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {logged === 0 && (
        <div className="prog-card" style={{ textAlign:"center", padding:"32px 20px" }}>
          <div style={{ fontSize:52, marginBottom:12 }}>🌿</div>
          <p style={{ fontSize:16, fontWeight:700, color:"#2e2a28", marginBottom:8 }}>
            Your journey starts today
          </p>
          <p style={{ fontSize:13, color:"#9a9490", lineHeight:1.7 }}>
            Begin ticking off your daily habits — your progress will bloom beautifully here.
          </p>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   CSS
══════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html,body,#root{height:100%;background:#f6f2ec;}

::-webkit-scrollbar{width:3px;}
::-webkit-scrollbar-track{background:#f0ece4;}
::-webkit-scrollbar-thumb{background:#d0c8bc;border-radius:2px;}

.app{
  min-height:100vh;
  background:#f6f2ec;
  color:#2e2a28;
  font-family:'Poppins',sans-serif;
  max-width:430px;
  margin:0 auto;
  position:relative;
}

/* ── HEADER ── */
.hdr{
  background:linear-gradient(145deg,#e8f2ec 0%,#eee8f8 55%,#fdeae0 100%);
  padding:22px 18px 18px;
  border-bottom:1px solid #e0dcd4;
}
.hdr-inner{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;}
.hdr-greet{font-size:12px;color:#7a9484;font-weight:500;margin-bottom:2px;}
.hdr-title{font-size:22px;font-weight:700;color:#2e2a28;letter-spacing:-0.4px;line-height:1.2;}
.hdr-sub{font-size:12px;color:#9a9490;margin-top:3px;}
.hdr-badges{display:flex;flex-direction:column;gap:6px;align-items:flex-end;}
.badge-pill{font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;white-space:nowrap;}
.badge-streak{background:#fff8e6;color:#c07a50;border:1px solid #e8c890;}
.badge-pct{background:#e8f2ec;color:#5a8a6a;border:1px solid #a8d4b4;}

.hdr-prog-wrap{}
.hdr-prog-bg{
  height:6px;background:rgba(255,255,255,.5);
  border-radius:3px;overflow:hidden;margin-bottom:5px;
}
.hdr-prog-fill{
  height:100%;border-radius:3px;
  background:linear-gradient(90deg,#7abf94,#a894d0);
  transition:width .7s ease;
}
.hdr-prog-labels{display:flex;justify-content:space-between;font-size:10px;color:#9a9490;}

/* ── NAV ── */
.nav{
  display:flex;
  background:#fff;
  border-bottom:1px solid #e8e2da;
  position:sticky;top:0;z-index:30;
  box-shadow:0 2px 10px rgba(0,0,0,.04);
}
.nav-btn{
  flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;
  padding:10px 4px 9px;background:none;border:none;
  color:#b4a89e;font-family:'Poppins',sans-serif;
  font-size:11px;font-weight:500;cursor:pointer;
  transition:all .2s;border-bottom:2px solid transparent;
}
.nav-btn:hover{color:#6e6860;}
.nav-emoji{font-size:16px;line-height:1;}
.nav-active{color:#6d9e84;border-bottom-color:#6d9e84;font-weight:600;}
.nav-active .nav-emoji{transform:scale(1.1);}

/* ── MAIN ── */
.main{padding:16px 14px 56px;}
.view{}
.ani{animation:fadeUp .28s ease;}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}

/* ── TODAY: Day nav ── */
.day-nav{
  display:flex;align-items:center;
  justify-content:space-between;margin-bottom:14px;
}
.arrow-btn{
  width:38px;height:38px;border-radius:50%;
  border:1px solid #e0dcd4;background:#fff;
  color:#a0988e;font-size:22px;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  transition:all .2s;box-shadow:0 1px 5px rgba(0,0,0,.06);
  line-height:1;
}
.arrow-btn:hover:not(:disabled){border-color:#6d9e84;color:#6d9e84;}
.arrow-btn:disabled{opacity:.25;cursor:not-allowed;}
.day-center{text-align:center;flex:1;}
.day-num-row{display:flex;align-items:center;justify-content:center;gap:7px;margin-bottom:2px;}
.day-num{font-size:20px;font-weight:700;color:#2e2a28;}
.day-date{font-size:11px;color:#9a9490;}

.chip{font-size:9px;padding:2px 8px;border-radius:20px;font-weight:700;letter-spacing:.3px;}
.chip-today{background:#6d9e84;color:#fff;}
.chip-past{background:#eaf4ee;color:#6d9e84;border:1px solid #a8d4b4;}
.chip-future{background:#fdeae0;color:#c07a50;border:1px solid #e8c090;}

/* Day progress card */
.day-prog-card{
  background:#fff;border-radius:16px;
  padding:14px 16px;margin-bottom:20px;
  box-shadow:0 2px 12px rgba(0,0,0,.05);
  border:1px solid #ede8e0;
}
.day-prog-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}
.day-prog-label{font-size:12px;color:#9a9490;}
.day-prog-pct{font-size:14px;font-weight:700;}
.prog-bar-bg{height:8px;background:#f0ece4;border-radius:4px;overflow:hidden;}
.prog-bar-fill{height:100%;border-radius:4px;transition:width .5s ease;}
.perfect-msg{font-size:12px;color:#6d9e84;font-weight:600;text-align:center;margin-top:8px;}
.good-msg{font-size:12px;color:#c07a50;font-weight:500;text-align:center;margin-top:8px;}

/* Task groups */
.task-group{margin-bottom:22px;}
.cat-label{font-size:9.5px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;padding-left:2px;}

/* ── TASK CARD ── */
.tcard{
  background:#fff;
  border:1px solid #ede8e0;
  border-radius:16px;
  margin-bottom:8px;
  display:flex;align-items:center;
  overflow:hidden;flex-wrap:wrap;
  box-shadow:0 1px 6px rgba(0,0,0,.04);
  transition:box-shadow .2s,transform .15s;
  cursor:pointer;user-select:none;
}
.tcard:active{transform:scale(.98);}
.tcard:hover{box-shadow:0 4px 18px rgba(0,0,0,.08);}
.tcard.tcard-done{background:#fafdf8;border-color:#cce8d4;}
.tcard.expand-card{cursor:default;}
.tcard.tcard-open{border-color:#d8d0e8;}

.tcard-bar{width:4px;align-self:stretch;flex-shrink:0;}
.tcard-icon{
  width:40px;height:40px;border-radius:11px;
  display:flex;align-items:center;justify-content:center;
  font-size:19px;flex-shrink:0;margin:12px 0 12px 10px;
}
.tcard-body{flex:1;padding:12px 0;min-width:0;}
.tcard-name{font-size:13px;font-weight:600;color:#2e2a28;line-height:1.3;}
.tcard-name-done{color:#6d9e84;text-decoration:line-through;text-decoration-color:#a8d4b480;}
.tcard-sub{font-size:11px;color:#b4a89e;margin-top:1px;}

.tcheck{
  width:26px;height:26px;border-radius:50%;
  border:2px solid #d8d0c8;margin-right:14px;
  display:flex;align-items:center;justify-content:center;
  font-size:12px;font-weight:700;color:#fff;
  flex-shrink:0;transition:all .2s;
}

/* Meals */
.meal-row{display:flex;gap:5px;margin-top:7px;flex-wrap:wrap;}
.pill{
  font-size:10px;padding:3px 10px;border-radius:20px;
  border:1px solid #ddd8d0;background:#faf8f4;
  color:#9a9490;cursor:pointer;transition:all .15s;
  font-family:'Poppins',sans-serif;font-weight:500;
}
.pill:hover{border-color:#a8a09a;}
.pill.pill-on{}

/* Expand panel */
.expand-panel{
  width:100%;
  border-top:1px solid #f0ece4;
  padding:14px 14px 10px 14px;
  background:#fdfbf7;
}
.expand-section{margin-bottom:14px;}
.expand-title{
  font-size:10px;font-weight:700;
  letter-spacing:1px;text-transform:uppercase;
  color:#a89e94;margin-bottom:8px;
}
.step-row{
  display:flex;align-items:center;gap:10px;
  padding:7px 0;border-top:1px solid #f0ece4;
  font-size:13px;color:#3a3535;cursor:pointer;
  transition:opacity .1s;
}
.step-row:first-of-type{border-top:none;}
.step-row:hover{opacity:.65;}
.mini-chk{
  width:20px;height:20px;border-radius:50%;
  border:1.5px solid #d0c8c0;
  display:flex;align-items:center;justify-content:center;
  font-size:10px;font-weight:700;color:#fff;
  flex-shrink:0;transition:all .2s;
}
.pills-wrap{display:flex;flex-wrap:wrap;gap:6px;}
.mark-btn{
  display:block;width:100%;background:none;border:none;
  font-size:12px;font-weight:600;text-align:center;
  cursor:pointer;margin-top:12px;padding:9px;
  border-radius:10px;transition:background .15s;
  font-family:'Poppins',sans-serif;border:1px solid transparent;
}
.mark-btn:hover{background:#f0ece4;}

/* Future locked */
.future-box{text-align:center;padding:52px 20px;color:#b4a89e;}
.future-title{font-size:16px;font-weight:700;color:#6e6860;margin-bottom:6px;}
.future-sub{font-size:13px;line-height:1.6;}

/* ── CALENDAR ── */
.sec-title{font-size:17px;font-weight:700;color:#2e2a28;margin-bottom:13px;}

.legend{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;}
.leg-item{display:flex;align-items:center;gap:4px;font-size:10px;color:#9a9490;}
.leg-dot{width:9px;height:9px;border-radius:50%;}

.cal-grid{
  display:grid;grid-template-columns:repeat(7,1fr);
  gap:4px;margin-bottom:16px;
}
.cal-head{
  text-align:center;font-size:9px;font-weight:700;
  color:#b4a89e;padding:5px 0;letter-spacing:.5px;
}
.cal-empty{aspect-ratio:1;}
.cal-cell{
  aspect-ratio:1;border-radius:10px;
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  border:1px solid;padding:2px;
  transition:transform .15s,box-shadow .15s;
  font-family:'Poppins',sans-serif;position:relative;
}
.cal-clickable:hover{transform:scale(1.06);box-shadow:0 4px 14px rgba(0,0,0,.1);cursor:pointer;}
.cal-now{box-shadow:0 0 0 2px #6d9e84,0 3px 10px rgba(109,158,132,.25);}
.cal-daynum{font-size:14px;font-weight:700;line-height:1;}
.cal-now-dot{
  position:absolute;top:3px;right:3px;
  width:5px;height:5px;border-radius:50%;background:#6d9e84;
}
.cal-mini-bar-bg{width:75%;height:2px;background:#e8e0d4;border-radius:1px;margin-top:2px;}
.cal-mini-bar-fill{height:100%;border-radius:1px;}

.cal-tip{
  background:#fff;border:1px solid #e0dcd4;
  border-radius:10px;padding:8px 12px;
  font-size:11px;color:#6e6860;margin-bottom:14px;
  text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.06);
}
.cal-summary{
  display:flex;justify-content:space-around;
  background:#fff;border-radius:16px;
  border:1px solid #e8e2da;padding:16px;
  box-shadow:0 2px 10px rgba(0,0,0,.04);
}
.sum-item{display:flex;flex-direction:column;align-items:center;gap:4px;}
.sum-num{font-size:28px;font-weight:800;line-height:1;}
.sum-lbl{font-size:10px;color:#9a9490;}

/* ── PROGRESS ── */
.prog-view{display:flex;flex-direction:column;gap:12px;}

.prog-hero{
  background:linear-gradient(145deg,#eaf4ee 0%,#eee8f8 100%);
  border-radius:20px;padding:24px 20px;
  text-align:center;border:1px solid #ddd8ec;
}
.prog-big{font-size:62px;font-weight:800;line-height:1;margin-bottom:4px;}
.prog-hero-sub{font-size:12px;color:#9a9490;margin-bottom:16px;}
.prog-hero-row{display:flex;justify-content:space-around;}
.prog-mini{display:flex;flex-direction:column;align-items:center;gap:2px;}
.prog-mini-ico{font-size:20px;}
.prog-mini-val{font-size:18px;font-weight:700;color:#2e2a28;}
.prog-mini-lbl{font-size:10px;color:#9a9490;}

.prog-card{
  background:#fff;border-radius:16px;
  border:1px solid #ede8e0;padding:16px;
  box-shadow:0 2px 10px rgba(0,0,0,.04);
}
.prog-card-title{font-size:12px;font-weight:700;color:#2e2a28;margin-bottom:13px;}

.cat-row{display:flex;align-items:center;gap:10px;margin-bottom:11px;}
.cat-row-label{width:78px;font-size:11px;font-weight:600;flex-shrink:0;}
.cat-bar-bg{flex:1;height:8px;background:#f0ece4;border-radius:4px;overflow:hidden;}
.cat-bar-fill{height:100%;border-radius:4px;transition:width .5s ease;}
.cat-bar-pct{width:34px;text-align:right;font-size:11px;font-weight:600;color:#9a9490;}

.habit-row{display:flex;align-items:center;gap:10px;margin-bottom:12px;}
.habit-ico{font-size:18px;flex-shrink:0;}
.habit-info{flex:1;min-width:0;}
.habit-lbl{font-size:12px;font-weight:500;color:#3a3535;display:block;margin-bottom:4px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.habit-bar-bg{height:5px;background:#f0ece4;border-radius:3px;overflow:hidden;}
.habit-bar{height:100%;border-radius:3px;transition:width .4s ease;}
.habit-pct{width:32px;text-align:right;font-size:11px;font-weight:600;color:#9a9490;}

.needs-card{border-color:#f8e4ec;}
.needs-note{font-size:11px;color:#c06888;font-style:italic;text-align:center;margin-top:12px;line-height:1.5;}

.special-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.special-item{
  display:flex;flex-direction:column;align-items:center;gap:4px;
  padding:12px 6px;border-radius:12px;border:1px solid;text-align:center;
}

/* ── TOAST ── */
.toast{
  position:fixed;bottom:28px;left:50%;
  transform:translateX(-50%);
  padding:11px 24px;border-radius:100px;
  font-size:13px;font-weight:600;
  z-index:9999;
  background:#fff;
  border:1px solid #a8d4b4;
  color:#4a7a5a;
  box-shadow:0 6px 24px rgba(0,0,0,.1);
  white-space:nowrap;max-width:88vw;
  font-family:'Poppins',sans-serif;
  animation:fadeUp .3s ease;
}
`;
