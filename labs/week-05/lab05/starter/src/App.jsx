import AppLayout from './pages/AppLayout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

function App() {
  return (
    <AppLayout>
      <DashboardPage />
    </AppLayout>
  );
  // TODO 5A-CP02: เปลี่ยนเป็น <Routes> ที่มี AppLayout เป็นกรอบ
}
export default App;
