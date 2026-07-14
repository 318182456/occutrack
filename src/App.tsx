import React, { useState, useEffect } from 'react';
import { FamilyMember, Eye } from './types';
import { MobileContainer } from './components/MobileContainer';
import { MobileToday } from './components/MobileToday';
import { MobileCalendar } from './components/MobileCalendar';
import { MobileStats } from './components/MobileStats';
import { MobileSettings } from './components/MobileSettings';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, Heart, Sparkles } from 'lucide-react';
import { cn, formatLocalDate } from './lib/utils';

const LOCAL_STORAGE_KEY = 'occutrack_family_members';

// Default mock family data has been removed.
const DEFAULT_MEMBERS: FamilyMember[] = [];

export default function App() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string>('1');
  const [activeTab, setActiveTab] = useState<string>('today');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal input states
  const [newName, setNewName] = useState('');
  const [newBirthDate, setNewBirthDate] = useState('2021-01-01');
  const [newAvatar, setNewAvatar] = useState('👦');
  const [newCycleLength, setNewCycleLength] = useState(3);
  const [newTargetHours, setNewTargetHours] = useState(6);

  // Load and initialize userId
  useEffect(() => {
    let id = localStorage.getItem('occutrack_user_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('occutrack_user_id', id);
    }
    setUserId(id);
  }, []);

  // Fetch data from KV when userId changes
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/data?userId=${userId}`);
        if (res.ok) {
          const parsed = await res.json();
          if (parsed && Array.isArray(parsed)) {
            setMembers(parsed);
            if (parsed.length > 0) {
              setActiveMemberId(parsed[0].id);
            }
            setIsLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error('Error fetching data from KV:', e);
      }

      // Local fallback
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.length > 0) {
            setMembers(parsed);
            setActiveMemberId(parsed[0].id);
          }
        } catch (e) {
          console.error('Error loading saved members', e);
        }
      }
      setIsLoading(false);
    };

    fetchData();
  }, [userId]);

  const handleRestoreUserId = (newId: string) => {
    localStorage.setItem('occutrack_user_id', newId);
    setUserId(newId);
  };

  // Save to local storage and KV sync
  const saveMembers = async (updated: FamilyMember[]) => {
    setMembers(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    if (userId) {
      try {
        await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, data: updated })
        });
      } catch (e) {
        console.error('Error syncing data to KV:', e);
      }
    }
  };

  const handleUpdateMember = (updatedMember: FamilyMember) => {
    const nextMembers = members.map(m => m.id === updatedMember.id ? updatedMember : m);
    saveMembers(nextMembers);
  };

  const handleSelectMember = (id: string) => {
    setActiveMemberId(id);
  };

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    // Default cycle pattern is left, left, right... matching the default cycle length
    const pattern: Eye[] = [];
    for (let i = 0; i < newCycleLength; i++) {
      pattern.push(i % 3 < 2 ? 'left' : 'right');
    }

    const calculatedAge = newBirthDate 
      ? String(Math.max(0, new Date().getFullYear() - new Date(newBirthDate).getFullYear()))
      : '5';

    const newMember: FamilyMember = {
      id: Date.now().toString(),
      name: newName,
      age: calculatedAge,
      birthDate: newBirthDate,
      avatar: newAvatar,
      cycleLength: newCycleLength,
      cyclePattern: pattern,
      startDate: formatLocalDate(new Date()),
      targetHours: newTargetHours,
      completedDates: {}
    };

    const nextMembers = [...members, newMember];
    saveMembers(nextMembers);
    setActiveMemberId(newMember.id);
    setShowAddModal(false);

    // Reset fields
    setNewName('');
    setNewBirthDate('2021-01-01');
    setNewAvatar('👦');
    setNewCycleLength(3);
    setNewTargetHours(6);
  };

  const activeMember = members.find(m => m.id === activeMemberId) || members[0];

  const renderActiveScreen = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-6 py-24 bg-white rounded-2xl border border-[#e0e3e5] shadow-xs space-y-4">
          <div className="w-10 h-10 border-4 border-[#004ac6] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-gray-500 font-semibold">正在同步云端数据...</p>
        </div>
      );
    }

    if (members.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-6 py-16 bg-white rounded-2xl border border-[#e0e3e5] shadow-xs space-y-6">
          <div className="w-16 h-16 bg-[#e2eafb] rounded-full flex items-center justify-center text-3xl">
            👋
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800">欢迎使用 OccuTrack</h2>
            <p className="text-xs text-gray-500 mt-2 max-w-[240px] leading-relaxed">
              目前还没有添加宝贝。请立即添加您的第一个宝贝，开启弱视遮盖与视力训练的记录之旅吧！
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#004ac6] hover:bg-[#003ea8] text-xs font-bold text-white px-6 py-3 rounded-full shadow-md active:scale-95 transition-all flex items-center justify-center space-x-1.5"
          >
            <UserPlus className="w-4 h-4 text-white" />
            <span>添加第一个宝贝</span>
          </button>
        </div>
      );
    }

    if (!activeMember) return null;

    switch (activeTab) {
      case 'today':
        return <MobileToday member={activeMember} onUpdateMember={handleUpdateMember} />;
      case 'calendar':
        return <MobileCalendar member={activeMember} onUpdateMember={handleUpdateMember} />;
      case 'stats':
        return <MobileStats member={activeMember} />;
      case 'settings':
        return (
          <MobileSettings
            member={activeMember}
            onUpdateMember={handleUpdateMember}
            userId={userId}
            onRestoreUserId={handleRestoreUserId}
          />
        );
      default:
        return <MobileToday member={activeMember} onUpdateMember={handleUpdateMember} />;
    }
  };

  const avatarsList = ['👦', '👧', '👶', '🦁', '🐨', '🐼', '🐱', '🐶', '🦄', '🐰'];

  return (
    <div className="relative w-full h-full">
      <MobileContainer
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        members={members}
        activeMemberId={activeMemberId}
        onSelectMember={handleSelectMember}
        onAddMember={() => setShowAddModal(true)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeMemberId}-${activeTab}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {renderActiveScreen()}
          </motion.div>
        </AnimatePresence>
      </MobileContainer>

      {/* Cute in-app Modal to Add New Family Members */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-5 shadow-2xl max-w-sm w-full border border-[#e0e3e5]"
            >
              <div className="flex items-center justify-between border-b border-[#e0e3e5]/60 pb-3 mb-4">
                <h3 className="text-sm font-bold text-[#191c1e] flex items-center space-x-1.5">
                  <UserPlus className="w-4 h-4 text-[#004ac6]" />
                  <span>添加新的宝贝/家庭成员</span>
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-[#737686] hover:text-[#191c1e] rounded-md transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleCreateMember} className="space-y-4 text-xs">
                {/* Name */}
                <div>
                  <label className="block text-[#434655] font-bold mb-1.5">宝贝昵称/名字</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="如：小主、妹妹"
                    className="w-full border border-[#e0e3e5] rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#004ac6] bg-[#f9fafb]"
                  />
                </div>

                {/* Birth Date */}
                <div>
                  <label className="block text-[#434655] font-bold mb-1.5">出生日期</label>
                  <input
                    type="date"
                    required
                    value={newBirthDate}
                    onChange={(e) => setNewBirthDate(e.target.value)}
                    className="w-full border border-[#e0e3e5] rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#004ac6] bg-[#f9fafb]"
                  />
                </div>

                {/* Avatar selection list */}
                <div>
                  <label className="block text-[#434655] font-bold mb-1.5">选择专属头像/标识</label>
                  <div className="grid grid-cols-5 gap-2">
                    {avatarsList.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setNewAvatar(av)}
                        className={cn(
                          "h-10 text-xl flex items-center justify-center rounded-lg border transition-all active:scale-95",
                          newAvatar === av
                            ? "bg-[#e2eafb] border-[#004ac6]"
                            : "bg-[#f9fafb] border-gray-100 hover:bg-gray-50"
                        )}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cycle and Target configuration */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[#434655] font-bold mb-1.5">默认周期天数</label>
                    <select
                      value={newCycleLength}
                      onChange={(e) => setNewCycleLength(parseInt(e.target.value))}
                      className="w-full border border-[#e0e3e5] rounded-lg p-2.5 bg-[#f9fafb]"
                    >
                      <option value={2}>2天循环</option>
                      <option value={3}>3天循环 (2左/1右)</option>
                      <option value={4}>4天循环</option>
                      <option value={5}>5天循环</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#434655] font-bold mb-1.5">每日目标小时</label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={newTargetHours}
                      onChange={(e) => setNewTargetHours(parseInt(e.target.value))}
                      className="w-full border border-[#e0e3e5] rounded-lg p-2.5 bg-[#f9fafb]"
                    />
                  </div>
                </div>

                {/* Action button */}
                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full bg-[#004ac6] hover:bg-[#003ea8] text-white py-3 rounded-lg font-bold transition-all flex items-center justify-center space-x-1"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>立即创建</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
