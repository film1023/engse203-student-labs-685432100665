import { useMemo, useState } from 'react';
import initialRequests from '../../public/data/initialRequests.json';
import FilterBar from '../components/FilterBar.jsx';
import RequestForm from '../components/RequestForm.jsx';
import RequestList from '../components/RequestList.jsx';
import SummaryPanel from '../components/SummaryPanel.jsx';

function DashboardPage() {
  const [requests, setRequests] = useState(initialRequests);
  const [statusFilter, setStatusFilter] = useState('all');
  const [notice, setNotice] = useState('');

  const summary = useMemo(() => ({
    total: requests.length,
    pending: requests.filter((request) => request.status === 'pending').length,
    inProgress: requests.filter((request) => request.status === 'in-progress').length,
    completed: requests.filter((request) => request.status === 'completed').length,
  }), [requests]);

  const filteredRequests = statusFilter === 'all'
    ? requests
    : requests.filter((request) => request.status === statusFilter);

  async function handleAdd(input) {
    setRequests((current) => [...current, { ...input, id: `REQ-W4-${Date.now()}`, status: 'pending' }]);
    setNotice('เพิ่มคำร้องในหน่วยความจำแล้ว — กด refresh แล้วจะหาย นี่คือโจทย์ของคาบ 5B');
  }

  function handleDelete(requestId) {
    setRequests((current) => current.filter((request) => request.id !== requestId));
    setNotice(`ลบคำร้อง ${requestId} จาก memory แล้ว`);
  }

  return (
    <section data-testid="page-dashboard">
      <div className="page-heading">
        <div>
          <p className="eyebrow dark">CP01 · PAGE REFACTOR</p>
          <h1>Campus Service Request</h1>
          <p>ตรวจ add, filter, delete และ validation ว่ายังทำงานเหมือนเดิม</p>
        </div>
      </div>

      {notice && <p className="notice" role="status">{notice}</p>}

      <SummaryPanel summary={summary} />

      <div className="workspace-grid">
        <section className="panel form-panel">
          <RequestForm onAddRequest={handleAdd} />
        </section>
        <section className="panel" aria-labelledby="request-list-title">
          <div className="section-heading">
            <h2 id="request-list-title">รายการคำร้อง</h2>
            <FilterBar value={statusFilter} onFilterChange={setStatusFilter} />
          </div>
          <RequestList requests={filteredRequests} onDeleteRequest={handleDelete} />
        </section>
      </div>
    </section>
  );
}

export default DashboardPage;
