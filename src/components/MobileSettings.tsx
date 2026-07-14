import React, { useState } from 'react';
import { Settings, Plus, Trash2, Calendar, Check, RotateCcw, ShieldAlert, Heart } from 'lucide-react';
import { FamilyMember, Eye } from '../types';
import { cn } from '../lib/utils';
import { format, addDays } from 'date-fns';

interface MobileSettingsProps {
  member: FamilyMember;
  onUpdateMember: (updated: FamilyMember) => void;
  userId?: string;
  onRestoreUserId?: (id: string) => void;
}

export function MobileSettings({ member, onUpdateMember, userId, onRestoreUserId }: MobileSettingsProps) {
  // Temporary component states that can be saved / reverted
  const [cycleLength, setCycleLength] = useState<number>(member.cycleLength);
  const [pattern, setPattern] = useState<Eye[]>(member.cyclePattern);
  const [startDate, setStartDate] = useState<string>(member.startDate);
  const [targetHours, setTargetHours] = useState<number>(member.targetHours);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Backup & Restore states
  const [inputUserId, setInputUserId] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [restoreError, setRestoreError] = useState('');

  const handleCopyId = () => {
    if (userId) {
      navigator.clipboard.writeText(userId);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleRestore = () => {
    if (!inputUserId.trim()) {
      setRestoreError('请输入备份/恢复 ID');
      return;
    }
    if (inputUserId.trim().length < 10) {
      setRestoreError('无效的备份/恢复 ID');
      return;
    }
    if (onRestoreUserId) {
      onRestoreUserId(inputUserId.trim());
      setRestoreSuccess(true);
      setRestoreError('');
      setInputUserId('');
      setTimeout(() => setRestoreSuccess(false), 3000);
    }
  };

  // Stats calculation for preview
  const leftDaysCount = pattern.filter(e => e === 'left').length;
  const rightDaysCount = pattern.filter(e => e === 'right').length;

  const handleEyeSelect = (index: number, eye: Eye) => {
    const newPattern = [...pattern];
    newPattern[index] = eye;
    setPattern(newPattern);
  };

  const handleAddDay = () => {
    if (cycleLength < 14) {
      setCycleLength(cycleLength + 1);
      setPattern([...pattern, 'left']);
    }
  };

  const handleRemoveDay = (index: number) => {
    if (cycleLength > 1) {
      setCycleLength(cycleLength - 1);
      const newPattern = pattern.filter((_, idx) => idx !== index);
      setPattern(newPattern);
    }
  };

  const handleSaveAll = () => {
    const updated: FamilyMember = {
      ...member,
      cycleLength: cycleLength,
      cyclePattern: pattern,
      startDate: startDate,
      targetHours: targetHours
    };
    onUpdateMember(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleReset = () => {
    setCycleLength(member.cycleLength);
    setPattern(member.cyclePattern);
    setStartDate(member.startDate);
    setTargetHours(member.targetHours);
  };

  const indexWords = ['第一天', '第二天', '第三天', '第四天', '第五天', '第六天', '第七天', '第八天', '第九天', '第十天', '第十一天', '第十二天', '第十三天', '第十四天'];

  return (
    <div className="space-y-4 pb-16">
      {/* Title */}
      <div className="bg-white rounded-xl border border-[#e0e3e5] p-4">
        <h2 className="text-base font-bold text-[#191c1e] flex items-center space-x-1.5">
          <Settings className="w-4.5 h-4.5 text-[#004ac6]" />
          <span>训练设置</span>
        </h2>
        <p className="text-xs text-[#737686] mt-1">
          管理宝贝的眼部遮盖方案、周期循环及医生建议偏好。
        </p>
      </div>

      {/* Dynamic Saving Notification */}
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-700 text-xs font-bold flex items-center space-x-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>保存成功！遮眼方案与日历已重新生成并同步。</span>
        </div>
      )}

      {/* Cloud Backup & Sync Section */}
      {userId && (
        <div className="bg-white rounded-xl border border-[#e0e3e5] p-4 space-y-3">
          <h3 className="text-xs font-bold text-[#191c1e] flex items-center space-x-1.5">
            <span>☁️</span>
            <span>云端同步与备份</span>
          </h3>
          <p className="text-[11px] text-[#737686] leading-relaxed">
            数据已自动同步到云端。为了防止浏览器缓存丢失，或在其他设备上同步，请妥善保存您的备份 ID。
          </p>
          
          {/* Current Backup ID Display */}
          <div className="flex items-center space-x-2 bg-[#f7f9fb] border border-[#e0e3e5] rounded-lg p-2 text-xs">
            <span className="text-[10px] font-mono text-[#434655] select-all flex-1 truncate">
              {userId}
            </span>
            <button
              onClick={handleCopyId}
              className="bg-[#004ac6] hover:bg-[#003ea8] text-white font-bold text-[10px] px-2.5 py-1.5 rounded-md transition-all active:scale-95 flex-shrink-0"
            >
              {copySuccess ? '已复制 ✓' : '复制 ID'}
            </button>
          </div>

          {/* Restore / Load Data From ID */}
          <div className="border-t border-[#e0e3e5]/60 pt-3 space-y-2">
            <label className="block text-[11px] font-bold text-[#434655]">恢复 / 导入云端数据</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputUserId}
                onChange={(e) => {
                  setInputUserId(e.target.value);
                  setRestoreError('');
                }}
                placeholder="请输入其他设备的备份 ID"
                className="flex-1 text-xs border border-[#e0e3e5] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#004ac6] bg-[#f9fafb]"
              />
              <button
                onClick={handleRestore}
                className="bg-white border border-[#004ac6] text-[#004ac6] hover:bg-[#e2eafb]/20 font-bold text-xs px-3 py-2 rounded-lg transition-all active:scale-95"
              >
                导入
              </button>
            </div>
            {restoreSuccess && (
              <p className="text-[10px] text-emerald-600 font-bold">✓ 数据恢复成功！正在重新同步加载...</p>
            )}
            {restoreError && (
              <p className="text-[10px] text-rose-500 font-bold">{restoreError}</p>
            )}
          </div>
        </div>
      )}

      {/* 2nd Screen: Cycle Config Card */}
      <div className="bg-white rounded-xl border border-[#e0e3e5] p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#191c1e] flex items-center space-x-1.5">
            <span>✨</span>
            <span>遮盖周期配置</span>
          </h3>
          <button
            onClick={handleAddDay}
            className="text-[#004ac6] hover:text-[#003ea8] text-xs font-bold flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>添加天数</span>
          </button>
        </div>

        <p className="text-[11px] text-[#737686] leading-relaxed">
          设置您的循环遮盖方案。每一天可以指定遮盖左眼、右眼或休息。
        </p>

        {/* Days Pattern Matrix List */}
        <div className="space-y-2.5">
          {Array.from({ length: cycleLength }).map((_, idx) => {
            const currentEye = pattern[idx] || 'none';
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-[#f7f9fb] border border-[#e0e3e5] rounded-lg text-xs"
              >
                <span className="font-semibold text-[#434655]">
                  {indexWords[idx] || `第 ${idx + 1} 天`}
                </span>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleEyeSelect(idx, 'left')}
                    className={cn(
                      "px-3 py-1.5 rounded-md font-semibold text-[11px] transition-all",
                      currentEye === 'left'
                        ? "bg-[#004ac6] text-white"
                        : "bg-white text-gray-500 border border-gray-200"
                    )}
                  >
                    左眼 [左]
                  </button>

                  <button
                    onClick={() => handleEyeSelect(idx, 'right')}
                    className={cn(
                      "px-3 py-1.5 rounded-md font-semibold text-[11px] transition-all",
                      currentEye === 'right'
                        ? "bg-[#4338d9] text-white"
                        : "bg-white text-gray-500 border border-gray-200"
                    )}
                  >
                    右眼 [右]
                  </button>

                  <button
                    onClick={() => handleEyeSelect(idx, 'none')}
                    className={cn(
                      "px-2 py-1.5 rounded-md font-semibold text-[11px] transition-all",
                      currentEye === 'none'
                        ? "bg-gray-400 text-white"
                        : "bg-white text-gray-400 border border-gray-100"
                    )}
                  >
                    休
                  </button>

                  {cycleLength > 1 && (
                    <button
                      onClick={() => handleRemoveDay(idx)}
                      className="p-1 text-gray-400 hover:text-rose-500 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cycle Start Date Config Card */}
      <div className="bg-white rounded-xl border border-[#e0e3e5] p-4 space-y-3">
        <h3 className="text-xs font-bold text-[#191c1e] flex items-center space-x-1.5">
          <span>📅</span>
          <span>方案开始日期</span>
        </h3>

        <div className="relative">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full text-xs font-medium border border-[#e0e3e5] rounded-lg p-2.5 bg-[#f9fafb] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#004ac6] focus:border-transparent"
          />
        </div>

        <p className="text-[11px] text-[#737686]">
          设置眼科循环方案的基准日期，开始新的遮盖流程。
        </p>
      </div>

      {/* Target Hours */}
      <div className="bg-white rounded-xl border border-[#e0e3e5] p-4 space-y-3">
        <h3 className="text-xs font-bold text-[#191c1e] flex items-center space-x-1.5">
          <span>⏰</span>
          <span>每日目标训练时长</span>
        </h3>

        <div className="flex items-center space-x-4">
          <input
            type="range"
            min={1}
            max={12}
            value={targetHours}
            onChange={(e) => setTargetHours(parseInt(e.target.value))}
            className="flex-1 accent-[#004ac6]"
          />
          <span className="text-sm font-bold text-[#004ac6] w-14 text-right">
            {targetHours} 小时
          </span>
        </div>
      </div>

      {/* Scheme Preview / Overview Panel */}
      <div className="bg-white rounded-xl border border-[#e0e3e5] p-4 space-y-3">
        <h3 className="text-xs font-bold text-[#191c1e]">方案概览</h3>

        <div className="space-y-2 text-xs border-b border-[#e0e3e5]/60 pb-3">
          <div className="flex justify-between items-center text-gray-600">
            <span>周期长度</span>
            <span className="font-bold text-[#191c1e]">{cycleLength} 天</span>
          </div>

          <div className="flex justify-between items-center text-gray-600">
            <span>左眼遮盖</span>
            <span className="font-bold text-[#004ac6]">{leftDaysCount} 天</span>
          </div>

          <div className="flex justify-between items-center text-gray-600">
            <span>右眼遮盖</span>
            <span className="font-bold text-[#4338d9]">{rightDaysCount} 天</span>
          </div>

          <div className="flex justify-between items-center text-gray-600">
            <span>下次更换</span>
            <span className="font-bold text-amber-600">明天</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-2 space-y-2">
          <button
            onClick={handleSaveAll}
            className="w-full bg-[#004ac6] hover:bg-[#003ea8] text-white py-3 rounded-lg text-xs font-bold transition-all active:scale-[0.98]"
          >
            保存所有更改
          </button>
          
          <button
            onClick={handleReset}
            className="w-full bg-white border border-[#e0e3e5] hover:bg-[#f2f4f6] text-[#434655] py-3 rounded-lg text-xs font-bold transition-all active:scale-[0.98]"
          >
            取消并重置
          </button>
        </div>
      </div>

      {/* Doctor Advice Card */}
      <div className="bg-[#e6fcf5] rounded-xl border border-[#86f2e4]/40 p-4">
        <div className="flex items-start space-x-2 text-[#006f66]">
          <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold">医生建议</h4>
            <p className="text-[11px] mt-1 leading-relaxed">
              请遵循眼科医生的具体遮盖指导。如果不慎错过了一天，请勿在第二天加倍遮盖时间，继续按照原方案正常遮盖即可。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
