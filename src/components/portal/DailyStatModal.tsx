import React, { useState, useEffect } from 'react';
import { DailyStatRecord } from '../../types';
import { X, Calendar, FileText, CheckCircle, TrendingUp, Sparkles, Clock, UserCheck } from 'lucide-react';

interface DailyStatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: DailyStatRecord) => void;
  initialData: DailyStatRecord | null;
}

export const DailyStatModal: React.FC<DailyStatModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [dateStr, setDateStr] = useState('');
  const [dayLabel, setDayLabel] = useState('Hôm nay');
  const [totalDossiers, setTotalDossiers] = useState<number>(168);
  const [onlineDossiers, setOnlineDossiers] = useState<number>(154);
  const [offlineDossiers, setOfflineDossiers] = useState<number>(14);
  const [voiceQueries, setVoiceQueries] = useState<number>(118);
  const [avgProcessMinutes, setAvgProcessMinutes] = useState<number>(6.2);
  const [onTimeRate, setOnTimeRate] = useState<number>(100.0);
  const [officerInCharge, setOfficerInCharge] = useState('Quầy 01 - Tiếp nhận & Trả kết quả');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (initialData) {
      setDateStr(initialData.dateStr);
      setDayLabel(initialData.dayLabel);
      setTotalDossiers(initialData.totalDossiers);
      setOnlineDossiers(initialData.onlineDossiers);
      setOfflineDossiers(initialData.offlineDossiers);
      setVoiceQueries(initialData.voiceQueries);
      setAvgProcessMinutes(initialData.avgProcessMinutes);
      setOnTimeRate(initialData.onTimeRate);
      setOfficerInCharge(initialData.officerInCharge || 'Bộ phận Một cửa UBND Phường');
      setNote(initialData.note || '');
    } else {
      const today = new Date().toLocaleDateString('vi-VN');
      setDateStr(today);
      setDayLabel('Hôm nay');
      setTotalDossiers(168);
      setOnlineDossiers(154);
      setOfflineDossiers(14);
      setVoiceQueries(118);
      setAvgProcessMinutes(6.2);
      setOnTimeRate(100.0);
      setOfficerInCharge('Quầy 01 - Tiếp nhận & Trả kết quả');
      setNote('Hồ sơ trực tuyến qua VNeID và Cổng DVC đạt chỉ tiêu cao.');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Auto calculate online percentage
  const calculatedOnlineRate = totalDossiers > 0 
    ? Number(((onlineDossiers / totalDossiers) * 100).toFixed(1))
    : 0;

  const handleOnlineChange = (val: number) => {
    setOnlineDossiers(val);
    const newOffline = Math.max(0, totalDossiers - val);
    setOfflineDossiers(newOffline);
  };

  const handleTotalChange = (val: number) => {
    setTotalDossiers(val);
    const newOffline = Math.max(0, val - onlineDossiers);
    setOfflineDossiers(newOffline);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const record: DailyStatRecord = {
      id: initialData?.id || `daily-${Date.now()}`,
      dateStr: dateStr.trim() || new Date().toLocaleDateString('vi-VN'),
      dayLabel: dayLabel.trim() || 'Hôm nay',
      totalDossiers: Number(totalDossiers) || 0,
      onlineDossiers: Number(onlineDossiers) || 0,
      offlineDossiers: Number(offlineDossiers) || 0,
      onlineRate: calculatedOnlineRate,
      voiceQueries: Number(voiceQueries) || 0,
      avgProcessMinutes: Number(avgProcessMinutes) || 6.0,
      onTimeRate: Number(onTimeRate) || 100.0,
      officerInCharge: officerInCharge.trim() || 'Bộ phận Một cửa UBND Phường',
      note: note.trim()
    };
    onSave(record);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-8 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                SỐ LIỆU HỒ SƠ THỰC TẾ THEO NGÀY
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">
                {initialData ? `Cập nhật số liệu ngày ${initialData.dateStr}` : 'Thêm / Cập nhật số liệu thực tế theo ngày'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Date & Day Label */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Ngày thống kê (DD/MM/YYYY):</span>
              </label>
              <input
                type="text"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                placeholder="21/10/2026"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                Nhãn hiển thị (Thứ / Thời điểm):
              </label>
              <input
                type="text"
                value={dayLabel}
                onChange={(e) => setDayLabel(e.target.value)}
                placeholder="Hôm nay, Hôm qua, Thứ Hai..."
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>
          </div>

          {/* Row 2: Dossier numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200">
            <div>
              <label className="text-xs font-bold text-blue-950 mb-1 block">
                1. Tổng hồ sơ tiếp nhận:
              </label>
              <input
                type="number"
                min={0}
                value={totalDossiers}
                onChange={(e) => handleTotalChange(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl text-base font-mono font-black text-slate-900 focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
              <span className="text-[10px] text-blue-700 mt-0.5 block">Tổng cả trực tuyến & giấy</span>
            </div>

            <div>
              <label className="text-xs font-bold text-emerald-900 mb-1 block">
                2. Hồ sơ Trực tuyến (VNeID/DVC):
              </label>
              <input
                type="number"
                min={0}
                max={totalDossiers}
                value={onlineDossiers}
                onChange={(e) => handleOnlineChange(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-emerald-400 rounded-xl text-base font-mono font-black text-emerald-700 focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
              <span className="text-[10px] text-emerald-700 font-bold mt-0.5 block">
                Tỷ lệ: {calculatedOnlineRate}%
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-amber-900 mb-1 block">
                3. Hồ sơ Giấy tại quầy:
              </label>
              <input
                type="number"
                min={0}
                value={offlineDossiers}
                onChange={(e) => setOfflineDossiers(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-base font-mono font-black text-amber-800 focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
              <span className="text-[10px] text-amber-700 mt-0.5 block">Nộp trực tiếp một cửa</span>
            </div>
          </div>

          {/* Quick Rate Feedback */}
          <div className="bg-slate-900 text-white p-3 rounded-2xl flex items-center justify-between text-xs">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Tỷ lệ trực tuyến tính toán:</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300">({onlineDossiers}/{totalDossiers} hồ sơ)</span>
              <strong className="text-base font-mono font-black text-emerald-400">{calculatedOnlineRate}%</strong>
            </div>
          </div>

          {/* Row 3: Operational metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                Lượt hỏi Trợ lý số:
              </label>
              <input
                type="number"
                min={0}
                value={voiceQueries}
                onChange={(e) => setVoiceQueries(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Tại Kiosk & Cổng thông tin</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                TG giải quyết TB (phút):
              </label>
              <input
                type="number"
                step="0.1"
                min={1}
                value={avgProcessMinutes}
                onChange={(e) => setAvgProcessMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Giảm so với 45 phút</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                Tỷ lệ đúng hạn (%):
              </label>
              <input
                type="number"
                step="0.1"
                min={0}
                max={100}
                value={onTimeRate}
                onChange={(e) => setOnTimeRate(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Đúng & trước hạn</span>
            </div>
          </div>

          {/* Row 4: Officer & Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">
              Cán bộ / Quầy phụ trách:
            </label>
            <input
              type="text"
              value={officerInCharge}
              onChange={(e) => setOfficerInCharge(e.target.value)}
              placeholder="Quầy 01 - Tiếp nhận & Trả kết quả"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">
              Ghi chú nghiệp vụ Một cửa trong ngày:
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Hồ sơ khai sinh và chứng thực điện tử đạt tỷ lệ trực tuyến cao nhờ trợ lý số phát loa hướng dẫn."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Lưu số liệu thực tế</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
