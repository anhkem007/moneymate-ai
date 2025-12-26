import React, { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { DayPicker, DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import 'react-day-picker/style.css';

interface DateRangePickerModalProps {
    startDate: string;
    endDate: string;
    onApply: (start: string, end: string) => void;
    onClose: () => void;
    accentColor?: string;
}

const DateRangePickerModal: React.FC<DateRangePickerModalProps> = ({
    startDate,
    endDate,
    onApply,
    onClose,
    accentColor = '#10b981'
}) => {
    const [range, setRange] = useState<DateRange | undefined>({
        from: new Date(startDate),
        to: new Date(endDate)
    });

    const quickOptions = [
        { label: 'Hôm nay', getDates: () => { const d = new Date(); return { from: d, to: d }; } },
        { label: '7 ngày qua', getDates: () => { const d = new Date(); const w = new Date(); w.setDate(d.getDate() - 6); return { from: w, to: d }; } },
        { label: '30 ngày qua', getDates: () => { const d = new Date(); const m = new Date(); m.setDate(d.getDate() - 29); return { from: m, to: d }; } },
        { label: 'Tháng này', getDates: () => { const d = new Date(); return { from: new Date(d.getFullYear(), d.getMonth(), 1), to: d }; } },
    ];

    const formatLocalDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleApply = () => {
        if (range?.from && range?.to) {
            onApply(formatLocalDate(range.from), formatLocalDate(range.to));
        } else if (range?.from) {
            onApply(formatLocalDate(range.from), formatLocalDate(range.from));
        }
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Chọn khoảng thời gian</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="p-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {quickOptions.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => setRange(opt.getDates())}
                                className="px-3 py-1.5 text-xs font-medium rounded-full border border-slate-200 hover:border-slate-300 transition-colors"
                                style={{
                                    backgroundColor: range?.from?.getTime() === opt.getDates().from.getTime() ? `${accentColor}20` : undefined,
                                    borderColor: range?.from?.getTime() === opt.getDates().from.getTime() ? accentColor : undefined,
                                    color: range?.from?.getTime() === opt.getDates().from.getTime() ? accentColor : undefined
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-center">
                        <DayPicker
                            mode="range"
                            selected={range}
                            onSelect={setRange}
                            locale={vi}
                            numberOfMonths={1}
                            showOutsideDays
                            styles={{
                                day: { borderRadius: '8px' },
                            }}
                            modifiersStyles={{
                                selected: { backgroundColor: accentColor },
                                range_start: { backgroundColor: accentColor },
                                range_end: { backgroundColor: accentColor },
                                range_middle: { backgroundColor: `${accentColor}30` }
                            }}
                        />
                    </div>

                    {range?.from && (
                        <div className="text-center text-sm text-slate-600 mt-2">
                            <span className="font-medium">{format(range.from, 'dd/MM/yyyy', { locale: vi })}</span>
                            {range.to && range.to.getTime() !== range.from.getTime() && (
                                <> - <span className="font-medium">{format(range.to, 'dd/MM/yyyy', { locale: vi })}</span></>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                        Huỷ
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={!range?.from}
                        className="flex-1 py-3 rounded-xl font-medium text-white transition-colors disabled:opacity-50"
                        style={{ backgroundColor: accentColor }}
                    >
                        Áp dụng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DateRangePickerModal;
