import AppHeader from '../components/AppHeader.jsx';

function AppLayout({ children }) {
  return (
    <div className="app-shell" data-testid="app-layout">
      <AppHeader />
      <main className="container page-content" id="main-content">
        {/* TODO 5A-CP02: เปลี่ยน children เป็น <Outlet /> แล้วเอา prop children ออก */}
        {children}
      </main>
      <footer className="site-footer"><div className="container">LAB environment · ไม่ใช้ข้อมูลส่วนบุคคลจริง</div></footer>
    </div>
  );
}

export default AppLayout;
