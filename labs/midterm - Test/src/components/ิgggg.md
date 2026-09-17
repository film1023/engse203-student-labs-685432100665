function StatusBadge({ status }) {
  const statusTextMap = {
    'pending': 'รอดำเนินการ',
    'in-progress': 'กำลังดำเนินการ',
    'completed': 'เสร็จสิ้น',
  };

  const text = statusTextMap[status] || status;

  return (
    <span className={`badge ${status}`}>
      {text}
    </span>
  );
}
export default StatusBadge;






function StatusBadge({ status }) {
  const statusMap = {
  'pending': { text: 'รอดำเนินการ', className: 'badge pending' },
    'in-progress': { text: 'กำลังดำเนินการ', className: 'badge in-progress' },
    'completed': { text: 'เสร็จสิ้น', className: 'badge completed' },
  };

  const currentStatus = statusMap[status] || {
    text: 'ไม่ทราบสถานะ',
    className: 'badge status-unknown',
  };

  return (
    <span className={currentStatus.className}>
      {currentStatus.text}
    </span>
  );
}
export default StatusBadge;





