export const statuses=['Chưa xác định','Chưa bắt đầu','Đang thực hiện','Xem xét','Chờ duyệt','Tạm dừng','Hoàn thành','Đã hủy'];
export const priorities=['Chưa xác định','Thấp','Trung bình','Cao','Khẩn cấp'];
export const localDay=(d=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
export const overdue=(t:any,day=localDay())=>!!t.due&&t.due<day&&!['Hoàn thành','Đã hủy'].includes(t.status)&&!t.archived;
export const dateText=(v:string)=>v?v.split('-').reverse().join('/'):'Chưa có hạn';

export function isValidLocalDate(value: unknown): boolean {
  if (typeof value !== 'string') return false;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 100 || year > 9999) return false;

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
}

export function validateTask(t: any) {
  if (
    typeof t.title !== 'string' ||
    !t.title.trim() ||
    t.title.length > 1000
  ) {
    throw Error('Tên công việc cần có từ 1 đến 1.000 ký tự.');
  }

  if (!statuses.includes(t.status) || !priorities.includes(t.priority)) {
    throw Error('Trạng thái hoặc ưu tiên không hợp lệ.');
  }

  // Kiem tra ngay bat dau va han chot
  for (const field of ['start', 'due']) {
    const value = t[field];

    if (
      value !== undefined &&
      value !== null &&
      value !== '' &&
      !isValidLocalDate(value)
    ) {
      throw Error(
        `${field === 'start' ? 'Ngày bắt đầu' : 'Hạn chót'} không hợp lệ.`
      );
    }
  }

  if (t.start && t.due && t.start > t.due) {
    throw Error('Hạn chót không được trước ngày bắt đầu.');
  }

  if (!Number.isFinite(t.progress) || t.progress < 0 || t.progress > 100) {
    throw Error('Tiến độ phải từ 0 đến 100.');
  }

  if (t.status === 'Hoàn thành' && !t.result?.trim()) {
    throw Error('Vui lòng ghi kết quả trước khi hoàn thành.');
  }

  if (t.status === 'Đã hủy' && !t.cancelReason?.trim()) {
    throw Error('Vui lòng ghi lý do hủy.');
  }

  if (t.status === 'Chờ duyệt' && !t.result?.trim()) {
    throw Error('Vui lòng ghi kết quả trước khi trình duyệt.');
  }
}

