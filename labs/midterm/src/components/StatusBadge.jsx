function StatusBadge({ status }) {//B4.2
  const statusMap = {
    'pending': { text: 'รอดำเนินการ', className: 'badge pending' },
    'in-progress': { text: 'กำลังดำเนินการ', className: 'badge in-progress' },
    'completed': { text: 'เสร็จสิ้น', className: 'badge completed' },
  };
// B4.2: เพิ่มการแมปสถานะเป็นข้อความและคลาส CSS
  const currentStatus = statusMap[status] || { text: 'ไม่ระบุ', className: 'badge' };
  return (
    <span className={currentStatus.className}>
      {currentStatus.text}
    </span>
  );
}

export default StatusBadge;