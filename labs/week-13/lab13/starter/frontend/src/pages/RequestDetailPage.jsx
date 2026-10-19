import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ErrorState from '../components/ErrorState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import useManualReload from '../hooks/useManualReload.js';
import { getRequestById, updateRequestStatus } from '../services/requestService.js';
import { getCurrentUser } from '../services/authService.js';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'รอดำเนินการ' },
  { value: 'in-progress', label: 'กำลังดำเนินการ' },
  { value: 'completed', label: 'เสร็จสิ้น' },
];

function RequestDetailPage() {
  const { requestId } = useParams();
  const [loadState, setLoadState] = useState('loading');
  const [request, setRequest] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadKey, reload] = useManualReload();
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const staff = getCurrentUser();

  // เปลี่ยนสถานะ — ต้องเข้าสู่ระบบเจ้าหน้าที่ (API ตอบ 401/403 ถ้าไม่มีสิทธิ์) · ใช้ค่าที่ API ตอบกลับ
  async function handleChangeStatus(nextStatus) {
    setUpdating(true);
    setUpdateError('');
    try {
      setRequest(await updateRequestStatus(request.id, nextStatus));
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'เปลี่ยนสถานะไม่สำเร็จ');
    } finally {
      setUpdating(false);
    }
  }

  useEffect(() => {
    let ignore = false;
    setLoadState('loading');
    getRequestById(requestId).then((result) => {
      if (ignore) return;
      setRequest(result);
      setLoadState('success');
    }).catch((error) => {
      if (ignore) return;
      setErrorMessage(error instanceof Error ? error.message : 'โหลดรายละเอียดไม่สำเร็จ');
      setLoadState('error');
    });
    return () => { ignore = true; };
  }, [requestId, reloadKey]);

  return (
    <section data-testid="page-request-detail">
      <div className="page-heading"><div><p className="eyebrow dark">DYNAMIC ROUTE</p><h1>รายละเอียดคำร้อง</h1><p>Request ID: <code>{requestId}</code></p></div></div>
      {loadState === 'loading' && <LoadingState message="กำลังโหลดรายละเอียด…" />}
      {loadState === 'error' && <ErrorState message={errorMessage} onRetry={reload} />}
      {loadState === 'success' && !request && (
        <section className="state-card"><h2>ไม่พบคำร้อง</h2><p>ไม่พบข้อมูลสำหรับ ID <code>{requestId}</code></p><Link to="/">กลับ Dashboard</Link></section>
      )}
      {loadState === 'success' && request && (
        <article className="panel detail-card">
          <h2>{request.requestType}</h2>
          <dl><div><dt>ID</dt><dd>{request.id}</dd></div><div><dt>ผู้แจ้ง</dt><dd>{request.requesterName}</dd></div><div><dt>สถานที่</dt><dd>{request.location}</dd></div><div><dt>รายละเอียด</dt><dd>{request.details}</dd></div><div><dt>ความเร่งด่วน</dt><dd>{request.priority}</dd></div><div><dt>สถานะ</dt><dd><span className={`badge ${request.status}`}>{request.status}</span></dd></div></dl>
          {staff ? (
            <div className="status-actions" role="group" aria-label="เปลี่ยนสถานะคำร้อง">
              {STATUS_OPTIONS.map((option) => (
                <button key={option.value} type="button" className="button secondary"
                  onClick={() => handleChangeStatus(option.value)}
                  disabled={updating || request.status === option.value}
                  aria-pressed={request.status === option.value}>
                  {option.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="status"><Link to="/login">เข้าสู่ระบบเจ้าหน้าที่</Link> เพื่อเปลี่ยนสถานะ</p>
          )}
          {updateError && <p className="status error" role="alert">{updateError}</p>}
          <Link to="/">กลับ Dashboard</Link>
        </article>
      )}
    </section>
  );
}

export default RequestDetailPage;
