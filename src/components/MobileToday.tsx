import React, { useState } from 'react';
import { Eye as EyeIcon, Check, Smile, Clock, Sparkles, BookOpen, PenTool, Award, Plus, Minus } from 'lucide-react';
import { FamilyMember, Eye } from '../types';
import { getEyeForDate, getCycleDayIndex, getStreak } from '../lib/patchUtils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

interface MobileTodayProps {
  member: FamilyMember;
  onUpdateMember: (updated: FamilyMember) => void;
}

export function MobileToday({ member, onUpdateMember }: MobileTodayProps) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const session = member.completedDates[todayStr] || { completed: false, hours: 0, remarks: '' };

  const eyeToPatch = getEyeForDate(today, member);
  const cycleInfo = getCycleDayIndex(today, member);
  const streak = getStreak(member);

  const [hours, setHours] = useState(session.hours || member.targetHours);
  const [remarks, setRemarks] = useState(session.remarks || '');
  const [showCelebrate, setShowCelebrate] = useState(false);

  // Quick remarks helper tags
  const quickTags = [
    { label: '配合度棒 ⭐', icon: Smile },
    { label: '看绘本遮盖 📖', icon: BookOpen },
    { label: '户外活动 🚴', icon: Sparkles },
    { label: '画画手工 🎨', icon: PenTool }
  ];

  const handleSaveSession = (isCompleted: boolean) => {
    const updatedDates = {
      ...member.completedDates,
      [todayStr]: {
        completed: isCompleted,
        hours: hours,
        remarks: remarks
      }
    };

    onUpdateMember({
      ...member,
      completedDates: updatedDates
    });

    if (isCompleted && !session.completed) {
      setShowCelebrate(true);
      setTimeout(() => setShowCelebrate(false), 3000);
    }
  };

  const handleQuickTagClick = (tagLabel: string) => {
    const newRemarks = remarks ? `${remarks} | ${tagLabel}` : tagLabel;
    setRemarks(newRemarks);
    // Auto-update in state
    const updatedDates = {
      ...member.completedDates,
      [todayStr]: {
        ...session,
        remarks: newRemarks
      }
    };
    onUpdateMember({
      ...member,
      completedDates: updatedDates
    });
  };

  const adjustHours = (val: number) => {
    const newH = Math.max(0, Math.min(24, hours + val));
    setHours(newH);
    if (session.completed) {
      // If already saved, update immediately
      const updatedDates = {
        ...member.completedDates,
        [todayStr]: {
          ...session,
          hours: newH
        }
      };
      onUpdateMember({
        ...member,
        completedDates: updatedDates
      });
    }
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Dynamic Celebration Pop-up */}
      <AnimatePresence>
        {showCelebrate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4 bg-black/25 backdrop-blur-xs"
          >
            <div className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center max-w-xs border-2 border-amber-400">
              <motion.div
                animate={{ rotate: [0, 15, -15, 10, -10, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1 }}
                className="text-5xl mb-3"
              >
                🎉
              </motion.div>
              <h4 className="text-xl font-bold text-[#004ac6]">太棒啦！</h4>
              <p className="text-sm text-[#434655] mt-1">宝贝今天完成了遮盖任务，继续保持哦！获得 1 颗守护之星 ⭐</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak Banner */}
      <div className="bg-[#e2eafb] rounded-xl p-4 border border-[#c3c6d7] flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="text-xl">🔥</div>
          <div>
            <div className="text-sm font-semibold text-[#004ac6]">连续守护计划</div>
            <p className="text-xs text-[#434655]">已连续打卡 <span className="font-bold text-base text-[#004ac6]">{streak}</span> 天</p>
          </div>
        </div>
        <div className="bg-white text-xs text-[#004ac6] font-semibold px-2.5 py-1 rounded-full border border-[#004ac6]/20 flex items-center space-x-1">
          <Award className="w-3.5 h-3.5" />
          <span>健康小卫士</span>
        </div>
      </div>

      {/* Eye Patch Focus Card */}
      <div className="bg-white rounded-xl border border-[#e0e3e5] p-5 shadow-xs">
        <div className="flex items-center space-x-2 text-[#004ac6] font-semibold mb-4 text-sm tracking-wide">
          <EyeIcon className="w-4 h-4" />
          <span>今日眼部遮盖方案</span>
        </div>

        {eyeToPatch !== 'none' ? (
          <div className="bg-[#f7f9fb] rounded-xl border border-[#e0e3e5] py-8 text-center flex flex-col items-center justify-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#737686] mb-1">当前需遮盖</span>
            <div className="flex items-center justify-center space-x-2 mb-2">
              <h2 className="text-4xl font-extrabold text-[#004ac6]">
                {eyeToPatch === 'left' ? '左眼' : '右眼'}
              </h2>
              <span className="text-2xl text-gray-400">({eyeToPatch === 'left' ? 'L' : 'R'})</span>
            </div>
            <p className="text-sm text-[#434655] font-medium">
              第 ({cycleInfo.indexInCycle}/{cycleInfo.totalInPattern}天周期)
            </p>
          </div>
        ) : (
          <div className="bg-[#f7f9fb] rounded-xl border border-[#e0e3e5] py-8 text-center flex flex-col items-center justify-center">
            <h2 className="text-3xl font-extrabold text-[#006a61] mb-2">休息日</h2>
            <p className="text-sm text-[#434655]">今天无需进行眼部遮盖训练，放松一下眼睛吧！</p>
          </div>
        )}

        {/* Hour adjustment controller */}
        {eyeToPatch !== 'none' && (
          <div className="mt-5 border-t border-[#e0e3e5] pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#737686] flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-[#004ac6]" />
                <span>遮盖时长 (目标: {member.targetHours}小时)</span>
              </span>
              <span className="text-sm font-bold text-[#004ac6]">{hours} 小时</span>
            </div>
            <div className="flex items-center justify-between bg-[#f2f4f6] rounded-lg p-2.5">
              <button
                onClick={() => adjustHours(-1)}
                className="w-10 h-10 bg-white border border-[#e0e3e5] rounded-lg flex items-center justify-center hover:bg-[#eceef0] active:scale-95 transition-transform"
              >
                <Minus className="w-4 h-4 text-[#191c1e]" />
              </button>
              
              {/* Simple progress bar */}
              <div className="flex-1 mx-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#004ac6] transition-all duration-300"
                  style={{ width: `${Math.min(100, (hours / member.targetHours) * 100)}%` }}
                ></div>
              </div>

              <button
                onClick={() => adjustHours(1)}
                className="w-10 h-10 bg-white border border-[#e0e3e5] rounded-lg flex items-center justify-center hover:bg-[#eceef0] active:scale-95 transition-transform"
              >
                <Plus className="w-4 h-4 text-[#191c1e]" />
              </button>
            </div>
          </div>
        )}

        {/* Action Button */}
        {eyeToPatch !== 'none' && (
          <div className="mt-5 space-y-3">
            {session.completed ? (
              <button
                onClick={() => handleSaveSession(false)}
                className="w-full bg-[#006a61] hover:bg-[#005049] text-white py-3.5 rounded-lg font-bold flex items-center justify-center space-x-2 transition-colors active:scale-[0.98]"
              >
                <Check className="w-5 h-5" />
                <span>已打卡 (点击取消打卡)</span>
              </button>
            ) : (
              <button
                onClick={() => handleSaveSession(true)}
                className="w-full bg-[#004ac6] hover:bg-[#003ea8] text-white py-3.5 rounded-lg font-bold flex items-center justify-center space-x-2 transition-all shadow-md active:scale-[0.98]"
              >
                <span>标记已完成 (记录 {hours} 小时)</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Parental Quick Remarks & Tags */}
      <div className="bg-white rounded-xl border border-[#e0e3e5] p-5">
        <h3 className="text-sm font-semibold text-[#191c1e] mb-3 flex items-center space-x-1.5">
          <span>📝</span>
          <span>今日训练反馈</span>
        </h3>

        {/* Quick Tags Scroll */}
        <div className="flex space-x-2 overflow-x-auto pb-3 -mx-2 px-2 scrollbar-none">
          {quickTags.map((tag, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickTagClick(tag.label)}
              className="flex-shrink-0 flex items-center space-x-1 bg-[#f2f4f6] text-xs font-medium text-[#434655] px-3 py-2 rounded-full border border-[#e0e3e5] hover:bg-[#e6e8ea] active:scale-95 transition-transform"
            >
              <tag.icon className="w-3.5 h-3.5 text-[#004ac6]" />
              <span>{tag.label}</span>
            </button>
          ))}
        </div>

        {/* Text Input */}
        <div className="mt-2">
          <textarea
            value={remarks}
            onChange={(e) => {
              setRemarks(e.target.value);
              // Save on key change directly
              const updatedDates = {
                ...member.completedDates,
                [todayStr]: {
                  ...session,
                  remarks: e.target.value
                }
              };
              onUpdateMember({
                ...member,
                completedDates: updatedDates
              });
            }}
            placeholder="今天遮眼时做了什么？配合度怎么样？（记录点滴进步）"
            rows={3}
            className="w-full text-sm border border-[#e0e3e5] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#004ac6] focus:border-transparent resize-none placeholder:text-gray-400 bg-[#f9fafb]"
          />
        </div>
      </div>
    </div>
  );
}
