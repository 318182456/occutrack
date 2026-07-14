import React, { useState } from 'react';
import { Users, UserPlus, Heart, Home, Calendar, BarChart2, Settings, Sparkles } from 'lucide-react';
import { FamilyMember } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface MobileContainerProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  members: FamilyMember[];
  activeMemberId: string;
  onSelectMember: (id: string) => void;
  onAddMember: () => void;
}

export function MobileContainer({
  children,
  activeTab,
  setActiveTab,
  members,
  activeMemberId,
  onSelectMember,
  onAddMember
}: MobileContainerProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const activeMember = members.find(m => m.id === activeMemberId) || members[0];

  const menuItems = [
    { id: 'today', label: '每日打卡', icon: Home },
    { id: 'calendar', label: '遮盖日历', icon: Calendar },
    { id: 'ai', label: 'AI 助手', icon: Sparkles },
    { id: 'stats', label: '荣誉统计', icon: BarChart2 },
    { id: 'settings', label: '方案设置', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-[#eceef0] flex items-center justify-center p-0 sm:p-6 font-sans">
      {/* Smartphone Mockup Wrapping (Enabled on sm: breakpoints, full-viewport on mobile) */}
      <div className="w-full h-screen sm:h-[840px] sm:max-w-[420px] bg-[#f7f9fb] sm:rounded-[36px] sm:shadow-2xl border-0 sm:border-[10px] border-[#191c1e] flex flex-col overflow-hidden relative">
        
        {/* Cute Top Speaker Notch for Smartphone Mockup */}
        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#191c1e] rounded-b-xl z-50"></div>

        {/* Top App Header with Profile Switcher */}
        <header className="bg-white border-b border-[#e0e3e5] px-4 pt-5 sm:pt-8 pb-3 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#004ac6] rounded-lg flex items-center justify-center text-white font-black text-sm">
              👁️
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#191c1e] tracking-tight">OccuTrack</h1>
              <p className="text-[10px] text-[#737686] font-semibold uppercase tracking-wider">家庭护眼日记</p>
            </div>
          </div>

          {/* Active Child Profile Selector Button */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-1.5 bg-[#f2f4f6] hover:bg-[#e6e8ea] px-3 py-1.5 rounded-full border border-[#e0e3e5] transition-colors active:scale-95"
            >
              <span className="text-sm">{activeMember?.avatar}</span>
              <span className="text-xs font-bold text-[#191c1e]">{activeMember?.name}</span>
              <span className="text-[10px] text-gray-400">▼</span>
            </button>

            {/* Profile switching dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-[#e0e3e5] shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 border-b border-gray-100 uppercase">
                  切换小卫士
                </div>
                {members.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSelectMember(m.id);
                      setShowProfileMenu(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-xs flex items-center justify-between hover:bg-gray-50 transition-colors",
                      m.id === activeMemberId ? "text-[#004ac6] font-bold bg-[#e2eafb]/20" : "text-[#434655]"
                    )}
                  >
                    <span className="flex items-center space-x-2">
                      <span>{m.avatar}</span>
                      <span>{m.name} ({m.age}岁)</span>
                    </span>
                    {m.id === activeMemberId && <span className="text-xs">✓</span>}
                  </button>
                ))}
                
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={() => {
                      onAddMember();
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-[#004ac6] hover:bg-[#e2eafb]/20 flex items-center space-x-2 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>添加新成员</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto px-4 py-4 select-none scrollbar-none">
          {children}
        </main>

        {/* Bottom Tab Bar Navigation */}
        <nav className="bg-white border-t border-[#e0e3e5] py-2 px-3 flex justify-around items-center sticky bottom-0 z-40 shadow-lg">
          {menuItems.map((item) => {
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center justify-center w-16 py-1 relative group focus:outline-none"
              >
                {/* Active Indicator bar */}
                {isSelected && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute top-[-8px] w-8 h-1 bg-[#004ac6] rounded-full"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}

                <item.icon
                  className={cn(
                    "w-5 h-5 transition-transform duration-200",
                    isSelected ? "text-[#004ac6] scale-110" : "text-[#737686] group-hover:text-[#191c1e]"
                  )}
                />
                
                <span
                  className={cn(
                    "text-[10px] mt-1 font-semibold transition-colors duration-200",
                    isSelected ? "text-[#004ac6]" : "text-[#737686] group-hover:text-[#191c1e]"
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

      </div>
    </div>
  );
}
