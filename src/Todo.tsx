import { useState, useMemo, useRef, useEffect } from "react";

// ─── Types

type Priority = "low" | "medium" | "high";
type Filter   = "all" | "completed" | "incomplete";
type SortBy   = "created" | "dueDate" | "priority" | "title";
type ViewMode = "list" | "board";

interface Subtask {
  id: string;
  text: string;
  done: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  category: string;
  dueDate: string;
  estimatedMinutes: number;
  tags: string[];
  subtasks: Subtask[];
  pinned: boolean;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
}

interface FormState {
  title: string;
  description: string;
  priority: Priority;
  category: string;
  dueDate: string;
  estimatedMinutes: number;
  tagInput: string;
  tags: string[];
  subtaskInput: string;
  subtasks: Subtask[];
}

// ─── Constants 

const PRIORITY_CFG: Record<Priority, { label: string; dot: string; badge: string; ring: string; order: number }> = {
  high:   { label: "High",   dot: "bg-rose-400",    badge: "bg-rose-950 text-rose-300 border border-rose-800",       ring: "ring-rose-800",    order: 0 },
  medium: { label: "Medium", dot: "bg-amber-400",   badge: "bg-amber-950 text-amber-300 border border-amber-800",    ring: "ring-amber-800",   order: 1 },
  low:    { label: "Low",    dot: "bg-emerald-400", badge: "bg-emerald-950 text-emerald-300 border border-emerald-800", ring: "ring-emerald-800", order: 2 },
};

const CATEGORIES = ["Design", "Development", "Research", "Marketing", "Personal", "Other"];

const EMPTY_FORM: FormState = {
  title: "", description: "", priority: "medium", category: "Personal",
  dueDate: "", estimatedMinutes: 30, tagInput: "", tags: [], subtaskInput: "", subtasks: [],
};

const INITIAL_TASKS: Task[] = [
  {
    id: "1",
    title: "Design new landing page mockup",
    description: "Create wireframes and high-fidelity screens for the Q3 marketing campaign page.",
    priority: "high",
    category: "Design",
    dueDate: "2026-05-30",
    estimatedMinutes: 120,
    tags: ["ui", "mockup"],
    subtasks: [{ id: "s1", text: "Wireframe layout", done: true },
    { id: "s2", text: "Choose color palette", done: false },
    { id: "s3", text: "Export assets", done: false }],
    pinned: true,
    completed: false,
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: "2",
    title: "Review pull request for auth module",
    description: "Check the JWT refresh logic and unit test coverage.",
    priority: "medium",
    category: "Development",
    dueDate: "2026-05-26", estimatedMinutes: 45,
    tags: ["code-review"],
    subtasks: [{ id: "s4", text: "Read diff", done: true },
    { id: "s5", text: "Leave comments", done: true }],
    pinned: false,
    completed: true,
    createdAt: Date.now() - 86400000, completedAt: Date.now() - 3600000,
  },
  {
    id: "3",
    title: "Write weekly status report",
    description: "Summarize sprint progress for stakeholders.",
    priority: "low",
    category: "Personal",
    dueDate: "2026-05-24",
    estimatedMinutes: 20,
    tags: ["writing", "report"],
    subtasks: [],
    pinned: false,
    completed: false,
    createdAt: Date.now() - 3600000,
  },
  {
    id: "4",
    title: "Fix mobile nav overflow bug",
    description: "Navigation menu breaks below 375px on Safari iOS.",
    priority: "high",
    category: "Development",
    dueDate: "2026-05-25",
    estimatedMinutes: 60,
    tags: ["bug", "mobile"],
    subtasks: [{ id: "s6", text: "Reproduce bug", done: true },
    { id: "s7",
    text: "Apply fix", done: false }],
    pinned: false,
    completed: false,
    createdAt: Date.now() - 7200000,
  },
];

// ─── Helpers 

function fmtDuration(min: number) {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isOverdue(task: Task) {
  return !!task.dueDate && !task.completed && new Date(task.dueDate) < new Date();
}

function dueSoon(task: Task) {
  if (!task.dueDate || task.completed) return false;
  const diff = new Date(task.dueDate).getTime() - Date.now();
  return diff >= 0 && diff < 86400000 * 2;
}

//  Sub-components 

function StatBox({ label, count, active, onClick, accent }: {
  label: string; count: number; active: boolean; onClick: () => void; accent?: string;
}) {
  return (
    <button onClick={onClick} className={`flex-1 rounded-xl px-3 py-3 text-left transition-all duration-200 border ${
      active ? "bg-white text-gray-900 border-white/20 shadow-lg shadow-black/30"
             : "bg-white/5 border-white/5 hover:bg-white/10"
    }`}>
      <div className={`text-2xl font-bold tracking-tight mb-0.5 ${active ? "text-gray-900" : accent ?? "text-gray-200"}`}>{count}</div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">{label}</div>
    </button>
  );
}

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const color = pct === 100 ? "from-emerald-400 to-teal-400" : pct > 60 ? "from-indigo-400 to-violet-400" : "from-indigo-400 to-violet-400";
  return (
    <div className="flex flex-col gap-1.5 p-3.5 rounded-xl border border-white/8 bg-white/[0.02]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold">
          {pct === 100 ? "🎉 All done!" : "Progress"}
        </span>
        <span className="text-xs font-bold text-gray-200">{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[11px] text-gray-600">{completed} of {total} tasks completed</div>
    </div>
  );
}

function Tag({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-800">
      #{label}
      {onRemove && (
        <button onClick={onRemove} className="hover:text-white ml-0.5 leading-none" aria-label={`Remove tag ${label}`}>×</button>
      )}
    </span>
  );
}

function SubtaskProgress({ subtasks }: { subtasks: Subtask[] }) {
  if (!subtasks.length) return null;
  const done = subtasks.filter(s => s.done).length;
  const pct = Math.round((done / subtasks.length) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full bg-indigo-500 transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-gray-600">{done}/{subtasks.length}</span>
    </div>
  );
}

function TaskCard({
  task, onToggle, onDelete, onEdit, onPin, onToggleSubtask,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onPin: (id: string) => void;
  onToggleSubtask: (taskId: string, subId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const prio = PRIORITY_CFG[task.priority];
  const overdue = isOverdue(task);
  const soon    = dueSoon(task);

  return (
    <div className={`group rounded-xl border transition-all duration-200 overflow-hidden ${
      task.completed ? "bg-white/[0.02] border-white/5 opacity-60"
      : task.pinned  ? "bg-indigo-950/20 border-indigo-500/25 hover:border-indigo-500/40"
                     : "bg-white/[0.04] border-white/10 hover:bg-white/[0.06] hover:border-white/15"
    }`}>
      <div className="flex items-start gap-3 p-3.5">
        {/* Checkbox */}
        <button onClick={() => onToggle(task.id)} aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
            task.completed ? "bg-indigo-500 border-indigo-500" : "border-white/20 hover:border-indigo-400"
          }`}>
          {task.completed && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            {task.pinned && <span className="text-indigo-400 text-xs mt-0.5 flex-shrink-0">📌</span>}
            <p className={`text-sm font-medium leading-snug flex-1 ${task.completed ? "line-through text-gray-600" : "text-gray-100"}`}>
              {task.title}
            </p>
          </div>

          {task.description && (
            <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{task.description}</p>
          )}

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${prio.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
              {prio.label}
            </span>
            <span className="text-[10px] text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
              {task.category}
            </span>
            {task.dueDate && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                overdue ? "text-rose-300 bg-rose-950 border-rose-800"
                : soon  ? "text-amber-300 bg-amber-950 border-amber-800"
                        : "text-gray-500 bg-white/5 border-white/10"
              }`}>
                {overdue ? "⚠ " : soon ? "⏰ " : ""}
                {fmtDate(task.dueDate)}
              </span>
            )}
            {task.estimatedMinutes > 0 && (
              <span className="text-[10px] text-gray-600 px-2 py-0.5 rounded-full border border-white/5 bg-white/5">
                ⏱ {fmtDuration(task.estimatedMinutes)}
              </span>
            )}
            {task.tags.map(t => <Tag key={t} label={t} />)}
          </div>

          {/* Subtask progress */}
          {task.subtasks.length > 0 && (
            <div className="mt-2">
              <SubtaskProgress subtasks={task.subtasks} />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {task.subtasks.length > 0 && (
            <button onClick={() => setExpanded(e => !e)} aria-label="Toggle subtasks"
              className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/10 transition-colors text-xs">
              {expanded ? "▲" : "▼"}
            </button>
          )}
          <button onClick={() => onPin(task.id)} aria-label={task.pinned ? "Unpin" : "Pin"}
            className={`p-1.5 rounded-lg transition-colors ${task.pinned ? "text-indigo-400 hover:bg-indigo-950" : "text-gray-600 hover:text-indigo-400 hover:bg-indigo-950"}`}>
            <svg className="w-3.5 h-3.5" fill={task.pinned ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <button onClick={() => onEdit(task)} aria-label="Edit"
            className="p-1.5 rounded-lg text-gray-600 hover:text-indigo-400 hover:bg-indigo-950 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button onClick={() => onDelete(task.id)} aria-label="Delete"
            className="p-1.5 rounded-lg text-gray-600 hover:text-rose-400 hover:bg-rose-950 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded subtasks */}
      {expanded && task.subtasks.length > 0 && (
        <div className="border-t border-white/8 px-4 pb-3 pt-2.5 flex flex-col gap-1.5">
          <p className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold mb-1">Subtasks</p>
          {task.subtasks.map(s => (
            <label key={s.id} className="flex items-center gap-2 cursor-pointer group/sub">
              <input type="checkbox" checked={s.done} onChange={() => onToggleSubtask(task.id, s.id)}
                className="accent-indigo-500 w-3.5 h-3.5 rounded" />
              <span className={`text-xs transition-colors ${s.done ? "line-through text-gray-700" : "text-gray-400 group-hover/sub:text-gray-300"}`}>
                {s.text}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────

export default function Todo() {
  const [tasks,       setTasks]       = useState<Task[]>(INITIAL_TASKS);
  const [filter,      setFilter]      = useState<Filter>("all");
  const [sortBy,      setSortBy]      = useState<SortBy>("created");
  const [viewMode,    setViewMode]    = useState<ViewMode>("list");
  const [search,      setSearch]      = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form,        setForm]        = useState<FormState>(EMPTY_FORM);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTask) {
        titleRef.current?.focus();
      }
    }, [editingTask]);

  // ── Counts ──
  const totalCount     = tasks.length;
  const completedCount = useMemo(() => tasks.filter(t => t.completed).length, [tasks]);
  const incompleteCount = useMemo(() => tasks.filter(t => !t.completed).length, [tasks]);
  const overdueCount   = useMemo(() => tasks.filter(t => isOverdue(t)).length, [tasks]);
  const pinnedCount    = useMemo(() => tasks.filter(t => t.pinned && !t.completed).length, [tasks]);

  // ── Filtered + sorted list ──
  const filteredTasks = useMemo(() => {
    let list = [...tasks];

    // filter
    if (filter === "completed")  list = list.filter(t => t.completed);
    if (filter === "incomplete") list = list.filter(t => !t.completed);

    // search
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q)) ||
      t.category.toLowerCase().includes(q)
    );

    // sort
    list.sort((a, b) => {
      if (sortBy === "priority") return PRIORITY_CFG[a.priority].order - PRIORITY_CFG[b.priority].order;
      if (sortBy === "dueDate")  return (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
      if (sortBy === "title")    return a.title.localeCompare(b.title);
      return b.createdAt - a.createdAt; // created
    });

    // pinned first (within each filter view)
    list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

    return list;
  }, [tasks, filter, search, sortBy]);

  // ── Handlers ──
  const handleSubmit = () => {
    if (!form.title.trim()) return;
    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? {
        ...t,
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        category: form.category,
        dueDate: form.dueDate,
        estimatedMinutes: form.estimatedMinutes,
        tags: form.tags,
        subtasks: form.subtasks,
      } : t));
      setEditingTask(null);
    } else {
      setTasks(prev => [{
        id: crypto.randomUUID(),
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        category: form.category,
        dueDate: form.dueDate,
        estimatedMinutes: form.estimatedMinutes,
        tags: form.tags,
        subtasks: form.subtasks,
        pinned: false,
        completed: false,
        createdAt: Date.now(),
      }, ...prev]);
    }
    setForm(EMPTY_FORM);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setForm({
      title: task.title, description: task.description, priority: task.priority,
      category: task.category, dueDate: task.dueDate, estimatedMinutes: task.estimatedMinutes,
      tags: task.tags, tagInput: "", subtasks: task.subtasks, subtaskInput: "",
    });
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setForm(EMPTY_FORM);
  };

  const handleToggle = (id: string) =>
    setTasks(prev => prev.map(t => t.id === id
      ? { ...t, completed: !t.completed, completedAt: !t.completed ? Date.now() : undefined }
      : t));

  const handleDelete = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (editingTask?.id === id) handleCancelEdit();
  };

  const handlePin = (id: string) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, pinned: !t.pinned } : t));

  const handleToggleSubtask = (taskId: string, subId: string) =>
    setTasks(prev => prev.map(t => t.id === taskId
      ? { ...t, subtasks: t.subtasks.map(s => s.id === subId ? { ...s, done: !s.done } : s) }
      : t));

  const handleClearCompleted = () => setTasks(prev => prev.filter(t => !t.completed));

  const addTag = () => {
    const tag = form.tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (tag && !form.tags.includes(tag)) setForm(f => ({ ...f, tags: [...f.tags, tag], tagInput: "" }));
    else setForm(f => ({ ...f, tagInput: "" }));
  };

  const addSubtask = () => {
    const text = form.subtaskInput.trim();
    if (!text) return;
    setForm(f => ({ ...f, subtasks: [...f.subtasks, { id: crypto.randomUUID(), text, done: false }], subtaskInput: "" }));
  };

  // ── Styles ──
  const inputCls = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition-all duration-150";
  const labelCls = "block text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1.5";

  // ── Board view: group by category ──
  const boardColumns = useMemo(() => {
    const cols: Record<string, Task[]> = {};
    filteredTasks.forEach(t => {
      if (!cols[t.category]) cols[t.category] = [];
      cols[t.category].push(t);
    });
    return cols;
  }, [filteredTasks]);

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-gray-100 p-4 md:p-6 flex flex-col gap-5">

      {/* ── Header ── */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Task<span className="text-indigo-400">Board</span>
          </h1>
          <p className="text-[11px] text-gray-600 mt-0.5 uppercase tracking-widest">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        {/* View toggle */}
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
          {(["list", "board"] as ViewMode[]).map(v => (
            <button key={v} onClick={() => setViewMode(v)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all duration-150 ${
                viewMode === v ? "bg-white text-gray-900" : "text-gray-500 hover:text-gray-300"
              }`}>
              {v === "list" ? "☰ List" : "⊞ Board"}
            </button>
          ))}
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-col lg:flex-row gap-5 flex-1">

        {/* ── LEFT COLUMN ── */}
        <aside className="lg:w-76 xl:w-84 flex-shrink-0 flex flex-col gap-4" style={{ width: "304px" }}>

          {/* Stat boxes */}
          <div className="grid grid-cols-3 gap-2">
            <StatBox label="All"        count={totalCount}      active={filter === "all"}        onClick={() => setFilter("all")}        />
            <StatBox label="Done"       count={completedCount}  active={filter === "completed"}  onClick={() => setFilter("completed")}  accent="text-emerald-400" />
            <StatBox label="Remaining"  count={incompleteCount} active={filter === "incomplete"} onClick={() => setFilter("incomplete")} accent="text-indigo-400"  />
          </div>

          {/* Extra stat pills */}
          <div className="flex gap-2 flex-wrap">
            {overdueCount > 0 && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                ⚠ {overdueCount} overdue
              </span>
            )}
            {pinnedCount > 0 && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                📌 {pinnedCount} pinned
              </span>
            )}
            {completedCount > 0 && (
              <button onClick={handleClearCompleted}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/5 text-gray-500 border border-white/10 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-800 transition-all duration-150">
                Clear completed
              </button>
            )}
          </div>

          {/* Form */}
          <div className={`rounded-2xl border p-4 flex flex-col gap-3.5 transition-all duration-200 ${
            editingTask ? "bg-indigo-950/25 border-indigo-500/30" : "bg-white/[0.03] border-white/8"
          }`}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-200">{editingTask ? "✏️ Edit Task" : "+ New Task"}</h2>
              {editingTask && (
                <button onClick={handleCancelEdit} className="text-[11px] text-gray-600 hover:text-gray-300 transition-colors">✕ Cancel</button>
              )}
            </div>

            {/* Title */}
            <div>
              <label className={labelCls}>Title *</label>
              <input ref={titleRef} type="text" placeholder="What needs to be done?" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                className={inputCls} />
            </div>

            {/* Description */}
            <div>
              <label className={labelCls}>Description</label>
              <textarea placeholder="Add more detail…" value={form.description} rows={2}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className={inputCls + " resize-none"} />
            </div>

            {/* Priority */}
            <div>
              <label className={labelCls}>Priority</label>
              <div className="flex gap-1.5">
                {(["low", "medium", "high"] as Priority[]).map(p => (
                  <button key={p} onClick={() => setForm(f => ({ ...f, priority: p }))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                      form.priority === p
                        ? PRIORITY_CFG[p].badge + " " + PRIORITY_CFG[p].ring + " ring-1"
                        : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300 hover:bg-white/10"
                    }`}>
                    {PRIORITY_CFG[p].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category + Due date row */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className={inputCls + " cursor-pointer"}>
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#1a1a1f]">{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Due Date</label>
                <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  className={inputCls + " [color-scheme:dark]"} />
              </div>
            </div>

            {/* Estimate */}
            <div>
              <label className={labelCls}>Time Estimate — {fmtDuration(form.estimatedMinutes)}</label>
              <input type="range" min={5} max={480} step={5} value={form.estimatedMinutes}
                onChange={e => setForm(f => ({ ...f, estimatedMinutes: Number(e.target.value) }))}
                className="w-full accent-indigo-500 cursor-pointer" />
              <div className="flex justify-between text-[10px] text-gray-700 mt-0.5">
                <span>5m</span><span>4h</span><span>8h</span>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className={labelCls}>Tags</label>
              <div className="flex gap-1.5">
                <input type="text" placeholder="Add tag…" value={form.tagInput}
                  onChange={e => setForm(f => ({ ...f, tagInput: e.target.value }))}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
                  className={inputCls + " flex-1"} />
                <button onClick={addTag} className="px-2.5 py-1.5 rounded-lg bg-white/10 text-gray-400 hover:bg-white/15 text-xs transition-colors">+</button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {form.tags.map(t => <Tag key={t} label={t} onRemove={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))} />)}
                </div>
              )}
            </div>

            {/* Subtasks */}
            <div>
              <label className={labelCls}>Subtasks</label>
              <div className="flex gap-1.5">
                <input type="text" placeholder="Add subtask…" value={form.subtaskInput}
                  onChange={e => setForm(f => ({ ...f, subtaskInput: e.target.value }))}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSubtask(); } }}
                  className={inputCls + " flex-1"} />
                <button onClick={addSubtask} className="px-2.5 py-1.5 rounded-lg bg-white/10 text-gray-400 hover:bg-white/15 text-xs transition-colors">+</button>
              </div>
              {form.subtasks.length > 0 && (
                <div className="flex flex-col gap-1 mt-1.5">
                  {form.subtasks.map(s => (
                    <div key={s.id} className="flex items-center gap-2 text-xs text-gray-400 bg-white/5 rounded-lg px-2.5 py-1.5">
                      <span className="text-gray-600">○</span>
                      <span className="flex-1">{s.text}</span>
                      <button onClick={() => setForm(f => ({ ...f, subtasks: f.subtasks.filter(x => x.id !== s.id) }))}
                        className="text-gray-700 hover:text-rose-400 transition-colors">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <button onClick={handleSubmit} disabled={!form.title.trim()}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-bold transition-all duration-150 active:scale-[0.98]">
              {editingTask ? "Save Changes" : "+ Add Task"}
            </button>
          </div>
        </aside>

        {/* ── RIGHT COLUMN ── */}
        <main className="flex-1 flex flex-col gap-3 min-w-0">

          {/* Progress bar */}
          <ProgressBar completed={completedCount} total={totalCount} />

          {/* Search + sort toolbar */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Search tasks, tags, categories…" value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all" />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 text-xs">✕</button>
              )}
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)}
              className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-gray-400 focus:outline-none focus:border-indigo-500/50 cursor-pointer [color-scheme:dark]">
              <option value="created"  className="bg-[#1a1a1f]">Newest</option>
              <option value="dueDate"  className="bg-[#1a1a1f]">Due date</option>
              <option value="priority" className="bg-[#1a1a1f]">Priority</option>
              <option value="title"    className="bg-[#1a1a1f]">A → Z</option>
            </select>
          </div>

          {/* Count label */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600">
              {search ? `${filteredTasks.length} result${filteredTasks.length !== 1 ? "s" : ""} for "${search}"` : `${filteredTasks.length} task${filteredTasks.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          {/* ── LIST VIEW ── */}
          {viewMode === "list" && (
            <div className="flex flex-col gap-2 overflow-y-auto pr-1" style={{ maxHeight: "calc(100vh - 280px)" }}>
              {filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-700">
                  <svg className="w-10 h-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-sm">{search ? "No matching tasks" : "No tasks here"}</p>
                  <p className="text-xs mt-1 text-gray-800">
                    {search ? "Try a different search term" : filter === "completed" ? "Complete a task to see it here" : "Add a task using the form"}
                  </p>
                </div>
              ) : filteredTasks.map(task => (
                <TaskCard key={task.id} task={task}
                  onToggle={handleToggle} onDelete={handleDelete}
                  onEdit={handleEdit} onPin={handlePin} onToggleSubtask={handleToggleSubtask} />
              ))}
            </div>
          )}

          {/* ── BOARD VIEW ── */}
          {viewMode === "board" && (
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ maxHeight: "calc(100vh - 280px)" }}>
              {Object.entries(boardColumns).length === 0 ? (
                <p className="text-sm text-gray-700 py-10 mx-auto">No tasks to display</p>
              ) : Object.entries(boardColumns).map(([cat, catTasks]) => (
                <div key={cat} className="flex-shrink-0 w-60 flex flex-col gap-2">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">{cat}</h3>
                    <span className="text-[10px] text-gray-700 bg-white/5 px-2 py-0.5 rounded-full border border-white/8">{catTasks.length}</span>
                  </div>
                  <div className="flex flex-col gap-2 overflow-y-auto">
                    {catTasks.map(task => (
                      <TaskCard key={task.id} task={task}
                        onToggle={handleToggle} onDelete={handleDelete}
                        onEdit={handleEdit} onPin={handlePin} onToggleSubtask={handleToggleSubtask} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}