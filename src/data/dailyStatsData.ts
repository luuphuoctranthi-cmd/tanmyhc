import { DailyStatRecord } from '../types';

export const DEFAULT_DAILY_STATS: DailyStatRecord[] = [
  {
    id: 'daily-today',
    dateStr: new Date().toLocaleDateString('vi-VN'),
    dayLabel: 'Hôm nay',
    totalDossiers: 168,
    onlineDossiers: 154,
    offlineDossiers: 14,
    onlineRate: 91.7,
    voiceQueries: 118,
    avgProcessMinutes: 6.2,
    onTimeRate: 100.0,
    officerInCharge: 'Quầy 01 - Tiếp nhận & Trả kết quả',
    note: 'Hồ sơ khai sinh, định danh VNeID mức 2 và chứng thực điện tử đạt tỷ lệ trực tuyến cao.'
  },
  {
    id: 'daily-yesterday',
    dateStr: '20/10/2026',
    dayLabel: 'Hôm qua',
    totalDossiers: 182,
    onlineDossiers: 166,
    offlineDossiers: 16,
    onlineRate: 91.2,
    voiceQueries: 125,
    avgProcessMinutes: 6.5,
    onTimeRate: 100.0,
    officerInCharge: 'Bộ phận Một cửa UBND Phường',
    note: 'Tổ chức điểm lưu động hướng dẫn nộp hồ sơ qua VNeID tại Khu phố 3.'
  },
  {
    id: 'daily-mon',
    dateStr: '19/10/2026',
    dayLabel: 'Thứ Hai',
    totalDossiers: 195,
    onlineDossiers: 177,
    offlineDossiers: 18,
    onlineRate: 90.8,
    voiceQueries: 136,
    avgProcessMinutes: 6.8,
    onTimeRate: 99.5,
    officerInCharge: 'Bộ phận Một cửa UBND Phường',
    note: 'Đầu tuần lượng người dân tra cứu thủ tục đất đai và hộ tịch tăng cao, trợ lý số phục vụ liên tục.'
  },
  {
    id: 'daily-sun',
    dateStr: '18/10/2026',
    dayLabel: 'Chủ Nhật',
    totalDossiers: 42,
    onlineDossiers: 40,
    offlineDossiers: 2,
    onlineRate: 95.2,
    voiceQueries: 31,
    avgProcessMinutes: 5.0,
    onTimeRate: 100.0,
    officerInCharge: 'Tổ Trực ban điện tử 24/7',
    note: 'Người dân chủ động nộp hồ sơ trực tuyến tại nhà vào ngày nghỉ cuối tuần.'
  },
  {
    id: 'daily-sat',
    dateStr: '17/10/2026',
    dayLabel: 'Thứ Bảy',
    totalDossiers: 88,
    onlineDossiers: 79,
    offlineDossiers: 9,
    onlineRate: 89.8,
    voiceQueries: 64,
    avgProcessMinutes: 6.2,
    onTimeRate: 100.0,
    officerInCharge: 'Quầy Tư pháp - Hộ tịch',
    note: 'Sáng thứ Bảy Một cửa tiếp nhận và giải quyết chứng thực, sao y cấp bách cho công dân.'
  },
  {
    id: 'daily-fri',
    dateStr: '16/10/2026',
    dayLabel: 'Thứ Sáu',
    totalDossiers: 174,
    onlineDossiers: 157,
    offlineDossiers: 17,
    onlineRate: 90.2,
    voiceQueries: 119,
    avgProcessMinutes: 6.9,
    onTimeRate: 99.4,
    officerInCharge: 'Bộ phận Một cửa UBND Phường',
    note: 'Tổng kết tuần làm việc, 100% hồ sơ thụ lý được giải quyết đúng hạn.'
  },
  {
    id: 'daily-thu',
    dateStr: '15/10/2026',
    dayLabel: 'Thứ Năm',
    totalDossiers: 162,
    onlineDossiers: 146,
    offlineDossiers: 16,
    onlineRate: 90.1,
    voiceQueries: 114,
    avgProcessMinutes: 7.1,
    onTimeRate: 99.4,
    officerInCharge: 'Bộ phận Một cửa UBND Phường',
    note: 'Tăng cường phát loa Trợ lý số hướng dẫn công dân nộp hồ sơ qua điện thoại thông minh.'
  }
];

const DAILY_STATS_STORAGE_KEY = 'tanmy_portal_daily_stats_v1';

export function getStoredDailyStats(): DailyStatRecord[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return DEFAULT_DAILY_STATS;
    }
    const raw = localStorage.getItem(DAILY_STATS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DAILY_STATS_STORAGE_KEY, JSON.stringify(DEFAULT_DAILY_STATS));
      return DEFAULT_DAILY_STATS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_DAILY_STATS;
  } catch (err) {
    console.error('Failed to read daily stats from localStorage:', err);
    return DEFAULT_DAILY_STATS;
  }
}

export function saveStoredDailyStats(records: DailyStatRecord[]): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.setItem(DAILY_STATS_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save daily stats to localStorage:', err);
  }
}
