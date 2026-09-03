import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ErrorState from '../components/ErrorState.jsx';
import FilterBar from '../components/FilterBar.jsx';
import LoadingState from '../components/LoadingState.jsx';
import RequestList from '../components/RequestList.jsx';
import SummaryPanel from '../components/SummaryPanel.jsx';
import useManualReload from '../hooks/useManualReload.js';
import {
  deleteRequest, getRequests, resetRequests, updateRequestStatus,
} from '../services/requestService.js';

function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const scenario = searchParams.get('scenario') ?? '';
  const [reloadKey, reload] = useManualReload();
  const [loadState, setLoadState] = useState('idle');
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchText, setSearchText] = useState('');// TODO B2: เพิ่ม state สำหรับข้อความค้นหา ที่นี่
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let ignore = false;
    setLoadState('loading');
    setErrorMessage('');
    setNotice('');

    getRequests({
      scenario,
      onRecovery: (message) => { if (!ignore) setNotice(message); },
    }).then((data) => {
      if (ignore) return;
      setRequests(data);
      setLoadState('success');
    }).catch((error) => {
      if (ignore) return;
      setErrorMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
      setLoadState('error');
    });

    return () => { ignore = true; };
  }, [scenario, reloadKey]);

  const summary = useMemo(() => ({
    total: requests.length,
    pending: requests.filter((request) => request.status === 'pending').length,
    inProgress: requests.filter((request) => request.status === 'in-progress').length,
    completed: requests.filter((request) => request.status === 'completed').length,
  }), [requests]);

  const filteredRequests = requests.filter((request) => {
    // 1. เงื่อนไขตัวกรองสถานะ
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    // 2. เงื่อนไขค้นหาประเภทหรือสถานที่ (B2.2)
    const query = searchText.toLowerCase().trim();
    const matchesSearch = query === '' ||
      (request.requestType && request.requestType.toLowerCase().includes(query)) ||
      (request.location && request.location.toLowerCase().includes(query));
    // B2.3
    return matchesStatus && matchesSearch;
  });

  function handleRetry() {
    if (scenario) setSearchParams({});
    else reload();
  }

  async function handleDelete(requestId) {
    try {
      const nextRequests = await deleteRequest(requestId);
      setRequests(nextRequests);
      setNotice(`ลบคำร้อง ${requestId} แล้ว`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'ลบคำร้องไม่สำเร็จ');
    }
  }


  async function handleReset() {
    if (!window.confirm('ต้องการคืนข้อมูลตัวอย่างเริ่มต้นหรือไม่?')) return;
    try {
      setRequests(await resetRequests());
      setStatusFilter('all');
      setSearchText('');
      setNotice('คืนข้อมูลตัวอย่างเริ่มต้นแล้ว');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'คืนข้อมูลไม่สำเร็จ');
    }
  }
  // TODO B3.1: เพิ่มฟังก์ชัน handleAcknowledge ที่เรียก updateRequestStatus เพื่อเปลี่ยนสถานะเป็น in-progress และอัปเดตรายการคำร้อง
  async function handleAcknowledge(requestId) {
    try {
      // เรียก updateRequestStatus เพื่อเปลี่ยนสถานะเป็น in-progress
      const nextRequests = await updateRequestStatus(requestId, 'in-progress');
      // อัปเดตรายการคำร้องใน state
      setRequests(nextRequests);
      setNotice(`รับเรื่องคำร้อง ${requestId} แล้ว`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'รับเรื่องไม่สำเร็จ');
    }
  }

  return (
    <section data-testid="page-dashboard">
      <div className="page-heading">
        <div><p className="eyebrow dark">ROUTED + PERSISTENT</p><h1>Dashboard</h1><p>ติดตามคำร้องจาก URL, Service Layer และ browser storage</p></div>
        <button className="button secondary" data-testid="reset-button" type="button" onClick={handleReset}>Reset Demo Data</button>
      </div>
      {scenario && <p className="lab-scenario" role="status">LAB test scenario: {scenario}</p>}
      {notice && <p className="notice" role="status">{notice}</p>}
      {loadState === 'loading' && <LoadingState />}
      {loadState === 'error' && <ErrorState message={errorMessage} onRetry={handleRetry} />}
      {loadState === 'success' && requests.length === 0 && (
        <section className="state-card" data-testid="empty-state">
          <h2>ยังไม่มีคำร้อง</h2><p>เริ่มสร้างคำร้องแรกของคุณได้เลย</p><Link className="button primary inline" to="/requests/new">สร้างคำร้องใหม่</Link>
        </section>
      )}
      {loadState === 'success' && requests.length > 0 && (
        <>
          <SummaryPanel summary={summary} />
          <section className="panel" aria-labelledby="request-list-title">
            <div className="section-heading">
              <h2 id="request-list-title">รายการคำร้อง</h2>
              <FilterBar value={statusFilter} onFilterChange={setStatusFilter} />
            </div>
            <div className="search-bar" style={{ marginBottom: '1rem' }}>
              {/* TODO B2: วางช่อง <input> ค้นหา ตรงนี้ (เหนือรายการ) แล้วกรองร่วมกับตัวกรองสถานะ ค้นจากประเภท/สถานที่ */}
              <input
                type="text"
                className="input"
                placeholder="ค้นหาจากประเภทหรือสถานที่"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            {/* TODO B3: ส่ง onAcknowledge={handleAcknowledge} ให้ RequestList เพื่อให้การ์ด pending มีปุ่ม "รับเรื่อง" */}

            {filteredRequests.length === 0 ? (
              <p style={{ padding: '1rem 0', color: '#666' }}>ไม่พบคำร้องที่ตรงกับการค้นหา</p>
            ) : (
              <RequestList
                requests={filteredRequests}
                onDeleteRequest={handleDelete}
                onAcknowledge={handleAcknowledge}// B3.1เพิ่ม prop onAcknowledge ให้ RequestList เพื่อให้การ์ด pending มีปุ่ม "รับเรื่อง"
              />
            )}
          </section>
        </>
      )}
    </section>
  );
}

export default DashboardPage;
