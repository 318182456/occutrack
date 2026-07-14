import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Info, Calendar as CalIcon } from 'lucide-react';
import { FamilyMember, Eye } from '../types';
import { getEyeForDate } from '../lib/patchUtils';
import { cn, formatLocalDate } from '../lib/utils';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isBefore,
  addMonths,
  subMonths,
  addDays,
  parseISO
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface MobileCalendarProps {
  member: FamilyMember;
  onUpdateMember: (updated: FamilyMember) => void;
}

export function MobileCalendar({ member, onUpdateMember }: MobileCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(new Date());
  };

  // Toggle completion on historical days clicking
  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
  };

  const handleToggleDayCompletion = (day: Date) => {
    const dayStr = formatLocalDate(day);
    const existing = member.completedDates[dayStr] || { completed: false, hours: member.targetHours, remarks: '' };
    
    const updatedDates = {
      ...member.completedDates,
      [dayStr]: {
        ...existing,
        completed: !existing.completed
      }
    };

    onUpdateMember({
      ...member,
      completedDates: updatedDates
    });
  };

  // Calculate upcoming 3 days list ("下周预览") matching the original screenshot perfectly
  const getUpcomingDays = () => {
    const list = [];
    const baseDate = new Date();
    
    for (let i = 1; i <= 3; i++) {
      const nextDay = addDays(baseDate, i);
      const eye = getEyeForDate(nextDay, member);
      
      let dayLabel = '';
      if (i === 1) {
        dayLabel = `明天 - ${format(nextDay, 'M月d日')}`;
      } else {
        const weekDayStr = format(nextDay, 'eeee', { locale: zhCN });
        dayLabel = `${weekDayStr} - ${format(nextDay, 'M月d日')}`;
      }

      list.push({
        date: nextDay,
        label: dayLabel,
        eye: eye
      });
    }
    return list;
  };

  const selectedDayStr = selectedDay ? formatLocalDate(selectedDay) : '';
  const selectedDaySession = selectedDayStr ? member.completedDates[selectedDayStr] : null;
  const selectedDayEye = selectedDay ? getEyeForDate(selectedDay, member) : 'none';

  return (
    <div className="space-y-4 pb-16">
      {/* Calendar Header with navigation */}
      <div className="bg-white rounded-xl border border-[#e0e3e5] p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-[#191c1e] flex items-center space-x-1.5">
              <CalIcon className="w-4.5 h-4.5 text-[#004ac6]" />
              <span>{format(currentDate, 'yyyy年 M月', { locale: zhCN })}</span>
            </h2>
            <p className="text-xs text-[#737686] mt-0.5">基准日期: {member.startDate}</p>
          </div>
          <div className="flex space-x-1">
            <button onClick={prevMonth} className="p-1.5 border border-[#e0e3e5] rounded-lg hover:bg-[#f2f4f6] text-[#434655]">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={goToToday} className="px-3 py-1.5 border border-[#e0e3e5] rounded-lg hover:bg-[#f2f4f6] text-xs text-[#434655] font-semibold">
              今天
            </button>
            <button onClick={nextMonth} className="p-1.5 border border-[#e0e3e5] rounded-lg hover:bg-[#f2f4f6] text-[#434655]">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 7-column Calendar grid */}
        <div className="grid grid-cols-7 gap-1 border-t border-[#e0e3e5]/60 pt-3">
          {weekDays.map((day, i) => (
            <div key={i} className="text-center text-xs font-semibold text-[#737686] py-1">
              {day}
            </div>
          ))}

          {days.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isDayToday = isToday(day);
            const dayStr = formatLocalDate(day);
            const session = member.completedDates[dayStr];
            const eye = getEyeForDate(day, member);
            const isSelected = selectedDay && dayStr === selectedDayStr;

            return (
              <button
                key={day.toString()}
                onClick={() => handleDayClick(day)}
                className={cn(
                  "aspect-square rounded-lg flex flex-col justify-between p-1 border border-transparent transition-all relative overflow-hidden select-none active:scale-95",
                  !isCurrentMonth && "opacity-30",
                  isDayToday && "bg-[#e2eafb] border-[#004ac6]/30",
                  isSelected && "border-2 border-[#004ac6] shadow-xs"
                )}
              >
                {/* Date digit */}
                <span className={cn(
                  "text-xs font-semibold",
                  isDayToday ? "text-[#004ac6]" : "text-[#191c1e]"
                )}>
                  {format(day, 'd')}
                </span>

                {/* Eye and completion dot indicator */}
                <div className="w-full flex justify-center items-center h-4">
                  {eye !== 'none' && (
                    <div className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-extrabold text-white",
                      eye === 'left' ? "bg-[#004ac6]" : "bg-[#4338d9]",
                      session?.completed && "ring-2 ring-emerald-400"
                    )}>
                      {eye === 'left' ? 'L' : 'R'}
                    </div>
                  )}
                </div>

                {/* Micro completion checkmark */}
                {session?.completed && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white rounded-bl-sm p-[1px]">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Calendar Legend */}
        <div className="mt-4 pt-3 border-t border-[#e0e3e5]/60 flex items-center justify-between text-[11px] text-[#434655]">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#004ac6]"></span>
            <span>左眼 (L)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4338d9]"></span>
            <span>右眼 (R)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e2eafb] border border-[#004ac6]/20"></span>
            <span>今天</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>已打卡</span>
          </div>
        </div>
      </div>

      {/* Selected Day Details Panel */}
      {selectedDay && (
        <div className="bg-white rounded-xl border border-[#e0e3e5] p-4">
          <div className="flex items-center justify-between border-b border-[#e0e3e5]/60 pb-2 mb-3">
            <h3 className="text-xs font-bold text-[#191c1e]">
              🔍 选中详情: {format(selectedDay, 'yyyy年 M月 d日', { locale: zhCN })}
            </h3>
            {isToday(selectedDay) && <span className="bg-[#004ac6] text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">今天</span>}
          </div>

          <div className="flex items-center justify-between text-xs">
            <div>
              <p className="text-[#434655]">
                需遮盖眼: <span className="font-bold text-[#004ac6]">{selectedDayEye === 'left' ? '左眼 (L)' : selectedDayEye === 'right' ? '右眼 (R)' : '休息日'}</span>
              </p>
              {selectedDaySession?.completed && (
                <p className="text-emerald-600 mt-1 font-semibold flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  已完成 ({selectedDaySession.hours} 小时)
                </p>
              )}
              {selectedDaySession?.remarks && (
                <p className="text-[#737686] mt-1 italic text-[11px]">
                  " {selectedDaySession.remarks} "
                </p>
              )}
            </div>

            {selectedDayEye !== 'none' && (
              <button
                onClick={() => handleToggleDayCompletion(selectedDay)}
                className={cn(
                  "px-3 py-2 rounded-lg font-semibold text-xs active:scale-95 transition-all",
                  selectedDaySession?.completed
                    ? "bg-rose-50 text-rose-600 border border-rose-200"
                    : "bg-[#e2eafb] text-[#004ac6] border border-[#004ac6]/20"
                )}
              >
                {selectedDaySession?.completed ? '取消完成' : '标记完成'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Agenda Section ("下周预览") matching original mock exactly */}
      <div className="bg-white rounded-xl border border-[#e0e3e5] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#191c1e]">下周预览</h3>
          <span className="text-xs text-[#737686]">···</span>
        </div>

        <div className="space-y-2.5">
          {getUpcomingDays().map((dayItem, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-center justify-between p-3.5 rounded-xl border transition-all",
                dayItem.eye === 'left'
                  ? "bg-[#e2eafb]/20 border-[#c3c6d7] hover:bg-[#e2eafb]/30"
                  : dayItem.eye === 'right'
                  ? "bg-[#f2eeff]/30 border-purple-100"
                  : "bg-gray-50 border-gray-200"
              )}
            >
              <div>
                <div className="text-xs font-semibold text-[#191c1e]">{dayItem.label}</div>
                <div className="text-[11px] text-[#434655] mt-1">
                  {dayItem.eye === 'left' ? '左眼遮盖 (第1天)' : dayItem.eye === 'right' ? '右眼遮盖 (第1天)' : '休息日'}
                </div>
              </div>

              {/* Eye Symbol Indicator Badge */}
              <div className={cn(
                "w-6 h-6 rounded-md flex items-center justify-center border",
                dayItem.eye === 'left'
                  ? "border-[#004ac6] text-[#004ac6] bg-[#e2eafb]"
                  : dayItem.eye === 'right'
                  ? "border-[#4338d9] text-[#4338d9] bg-[#f2eeff]"
                  : "border-gray-300 text-gray-400"
              )}>
                <span className="text-[10px] font-bold">
                  {dayItem.eye === 'left' ? 'L' : dayItem.eye === 'right' ? 'R' : '-'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
