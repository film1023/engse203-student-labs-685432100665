import { useEffect, useState } from 'react';
import { NavLink, Outlet, Route, Routes, useParams } from 'react-router-dom';

const tasks = [
  { id: 'TASK-101', title: 'ทบทวน Component Tree', status: 'ready' },
  { id: 'TASK-102', title: 'ทำนาย Route จาก URL', status: 'doing' },
  { id: 'TASK-103', title: 'อธิบาย Effect', status: 'ready' },
];

const PREFERENCE_KEY = 'engse203-prelab05-preference';

function readPreference() {
  try {
    return JSON.parse(localStorage.getItem(PREFERENCE_KEY))?.compact === true;
  } catch {
    return false;
  }
}

function PageTitle({ title }) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} · Pre-LAB05`;
    return () => { document.title = previousTitle; };
  }, [title]);
  return null;
}

function DemoLayout() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div>
          <p className="eyebrow">ENGSE203 · PRE-LAB05</p>
          <strong>Study Task Board</strong>
        </div>
        <nav aria-label="Pre-LAB navigation">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/about">About</NavLink>
        </nav>
      </header>
      <main className="container"><Outlet /></main>
    </div>
  );
}

function DashboardPage() {
  const [compact, setCompact] = useState(readPreference);

  function updatePreference() {
    const next = !compact;
    setCompact(next);
    localStorage.setItem(PREFERENCE_KEY, JSON.stringify({ compact: next }));
  }

  function resetPreference() {
    localStorage.removeItem(PREFERENCE_KEY);
    setCompact(false);
  }

  return (
    <section>
      <PageTitle title="Dashboard" />
      <p className="eyebrow dark">STATIC ROUTE · #/</p>
      <h1>Task Dashboard</h1>
      <p className="lead">สังเกต URL, active navigation และ demo preference หลัง refresh</p>
      <div className="actions">
        <button type="button" onClick={updatePreference}>Compact: {compact ? 'ON' : 'OFF'}</button>
        <button type="button" className="secondary" onClick={resetPreference}>Reset Demo Preference</button>
      </div>
      <ul className={compact ? 'task-list compact' : 'task-list'}>
        {tasks.map((task) => (
          <li key={task.id}>
            <NavLink to={`/tasks/${task.id}`}>{task.id} · {task.title}</NavLink>
            <span>{task.status}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TaskDetailPage() {
  const { taskId } = useParams();
  const task = tasks.find((item) => item.id === taskId);
  return (
    <section>
      <PageTitle title={task ? task.id : 'Task not found'} />
      <p className="eyebrow dark">DYNAMIC ROUTE · tasks/:taskId</p>
      {task ? (
        <>
          <h1>{task.title}</h1>
          <dl><dt>ID</dt><dd>{task.id}</dd><dt>Status</dt><dd>{task.status}</dd></dl>
        </>
      ) : (
        <><h1>ไม่พบ Task</h1><p>Route ตรง แต่ไม่มี resource ID นี้</p><NavLink to="/">กลับ Dashboard</NavLink></>
      )}
    </section>
  );
}

function AboutPage() {
  return <section><PageTitle title="About" /><p className="eyebrow dark">STATIC ROUTE · about</p><h1>About this demo</h1><p>ตัวอย่างนี้ใช้ Task domain เพื่อฝึก Route, Effect และ Storage โดยไม่ใช่เฉลย LAB05</p></section>;
}

function NotFoundPage() {
  return <section><PageTitle title="Route not found" /><p className="eyebrow dark">WILDCARD ROUTE</p><h1>ไม่พบ Route</h1><p>URL นี้ไม่ตรงกับ route ใด</p><NavLink to="/">กลับ Dashboard</NavLink></section>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DemoLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="tasks/:taskId" element={<TaskDetailPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

