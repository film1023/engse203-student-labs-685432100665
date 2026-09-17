function StatusBadge({ status }) {
  const statusMap = {
    'pending': { text: 'รอดำเนินการ', className: 'badge pending' },
    'in-progress': { text: 'กำลังดำเนินการ', className: 'badge in-progress' },
    'completed': { text: 'เสร็จสิ้น', className: 'badge completed' },
    'cancelled': { text: 'ยกเลิก', className: 'badge cancelled' }
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
