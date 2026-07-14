import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, MessageSquare, BookOpen, FileText, Send, 
  Loader2, Copy, Volume2, RotateCcw, Check, Brain, 
  HelpCircle, ArrowRight, UserCheck, Flame 
} from 'lucide-react';
import { FamilyMember } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface MobileAIProps {
  member: FamilyMember;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function MobileAI({ member }: MobileAIProps) {
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'story' | 'report'>('chat');
  
  // --- Chat States ---
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `你好！我是 ${member.name} 的 AI 护眼导师。你可以问我任何关于儿童弱视训练、遮盖治疗、或者如何引导宝贝配合遮眼的问题。我会结合宝贝当前的训练方案为你量身定制建议哦！🌸`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Story States ---
  const [story, setStory] = useState<string>('');
  const [isStoryLoading, setIsStoryLoading] = useState(false);
  const [storyCopied, setStoryCopied] = useState(false);
  const [showStoryReader, setShowStoryReader] = useState(false);

  // --- Report States ---
  const [report, setReport] = useState<string>('');
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [reportCopied, setReportCopied] = useState(false);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset messages when child member changes
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `您好！我是 ${member.name} 的 AI 护眼导师。我会随时根据宝贝的周期方案（当前是：${member.cyclePattern.map(e => e === 'left' ? '左眼' : e === 'right' ? '右眼' : '休息').join('→')}）提供科学的精细视觉训练与引导策略。今天想咨询些什么呢？🦉`,
        timestamp: new Date()
      }
    ]);
    setStory('');
    setReport('');
  }, [member.id]);

  // Quick Chat suggestions
  const chatSuggestions = [
    "孩子不愿戴眼罩怎么引导？",
    "精细动作训练有哪些游戏？",
    "遮盖时可以看电视玩手机吗？",
    "眼罩周围发红过敏了怎么办？"
  ];

  // --- API handlers ---
  
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isChatLoading) return;

    if (!textToSend) {
      setInputMessage('');
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          memberContext: member
        })
      });

      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: '⚠️ 抱歉，连接服务器失败。请确保后端服务正常运行且配置了 API Key。',
        timestamp: new Date()
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleGenerateStory = async () => {
    if (isStoryLoading) return;
    setIsStoryLoading(true);

    // Get today's tracking data from member
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySession = member.completedDates[todayStr] || { completed: false, hours: 0, remarks: '' };

    try {
      const response = await fetch('/api/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberContext: member,
          todayRemarks: todaySession.remarks,
          todayHours: todaySession.hours
        })
      });

      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      setStory(data.story);
    } catch (error) {
      console.error(error);
      setStory('⚠️ 生成故事失败，请稍后再试。');
    } finally {
      setIsStoryLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (isReportLoading) return;
    setIsReportLoading(true);

    try {
      const response = await fetch('/api/analyze-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberContext: member })
      });

      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      setReport(data.report);
    } catch (error) {
      console.error(error);
      setReport('⚠️ 生成评估报告失败，请稍后再试。');
    } finally {
      setIsReportLoading(false);
    }
  };

  // Utility to copy text
  const handleCopyText = (text: string, type: 'story' | 'report') => {
    navigator.clipboard.writeText(text);
    if (type === 'story') {
      setStoryCopied(true);
      setTimeout(() => setStoryCopied(false), 2000);
    } else {
      setReportCopied(true);
      setTimeout(() => setReportCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-[700px] bg-[#f7f9fb] select-none text-xs relative">
      {/* Sub-tab navigation */}
      <div className="bg-white px-3 py-2 border-b border-[#e0e3e5] flex space-x-1 sticky top-0 z-10 shrink-0">
        <button
          onClick={() => setActiveSubTab('chat')}
          className={cn(
            "flex-1 py-2 rounded-lg font-bold flex items-center justify-center space-x-1 transition-all",
            activeSubTab === 'chat' 
              ? "bg-[#e2eafb] text-[#004ac6]" 
              : "text-[#737686] hover:bg-gray-50"
          )}
        >
          <MessageSquare className="w-4 h-4" />
          <span>智能咨询</span>
        </button>

        <button
          onClick={() => setActiveSubTab('story')}
          className={cn(
            "flex-1 py-2 rounded-lg font-bold flex items-center justify-center space-x-1 transition-all",
            activeSubTab === 'story' 
              ? "bg-[#e2eafb] text-[#004ac6]" 
              : "text-[#737686] hover:bg-gray-50"
          )}
        >
          <BookOpen className="w-4 h-4" />
          <span>激励故事</span>
        </button>

        <button
          onClick={() => setActiveSubTab('report')}
          className={cn(
            "flex-1 py-2 rounded-lg font-bold flex items-center justify-center space-x-1 transition-all",
            activeSubTab === 'report' 
              ? "bg-[#e2eafb] text-[#004ac6]" 
              : "text-[#737686] hover:bg-gray-50"
          )}
        >
          <FileText className="w-4 h-4" />
          <span>报告评估</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-none flex flex-col min-h-0">
        
        {/* TAB 1: Chatbot */}
        {activeSubTab === 'chat' && (
          <div className="flex flex-col h-full justify-between">
            {/* Conversation Log */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-none mb-3">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[85%] rounded-2xl p-3.5 leading-relaxed text-xs shadow-3xs",
                    msg.role === 'user'
                      ? "bg-[#004ac6] text-white self-end ml-auto rounded-tr-xs"
                      : "bg-white border border-[#e0e3e5] text-[#191c1e] self-start rounded-tl-xs"
                  )}
                >
                  {msg.content}
                </div>
              ))}
              
              {isChatLoading && (
                <div className="bg-white border border-[#e0e3e5] text-[#191c1e] max-w-[85%] rounded-2xl rounded-tl-xs p-3.5 flex items-center space-x-2 self-start shadow-3xs">
                  <Loader2 className="w-4 h-4 text-[#004ac6] animate-spin" />
                  <span className="text-gray-400 font-semibold">导师正在思考中...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Suggestions Chips */}
            {messages.length === 1 && (
              <div className="mb-3">
                <span className="text-[10px] font-bold text-gray-400 block mb-1.5 uppercase flex items-center">
                  <HelpCircle className="w-3.5 h-3.5 text-[#004ac6] mr-1" />
                  热门咨询主题
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {chatSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(suggestion)}
                      className="text-left bg-white border border-[#e0e3e5] hover:bg-gray-50 text-[11px] text-[#434655] p-2.5 rounded-xl font-semibold flex items-center justify-between group active:scale-98 transition-transform"
                    >
                      <span className="truncate mr-1">{suggestion}</span>
                      <ArrowRight className="w-3 h-3 text-[#004ac6] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Input box */}
            <div className="bg-white border border-[#e0e3e5] rounded-xl p-1.5 flex items-center space-x-1 mb-2 shrink-0">
              <input
                type="text"
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder={`向AI导师咨询关于 ${member.name} 的问题...`}
                className="flex-1 bg-transparent border-0 outline-none p-2 text-xs placeholder:text-gray-400"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isChatLoading}
                className={cn(
                  "p-2.5 rounded-lg transition-all",
                  inputMessage.trim() && !isChatLoading
                    ? "bg-[#004ac6] text-white active:scale-95"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                )}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Kid Incentive Story */}
        {activeSubTab === 'story' && (
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-[#e0e3e5] p-4 text-center">
                <span className="text-3xl">📖</span>
                <h3 className="text-sm font-bold text-[#191c1e] mt-2">AI 宝贝睡前激励故事</h3>
                <p className="text-xs text-[#737686] mt-1 leading-relaxed">
                  把宝贝今天的眼罩打卡（如戴眼罩画画、玩乐高）转化成充满魔力、夸张好玩的专属睡前冒险故事，激励宝贝明天继续配合！
                </p>
                <div className="mt-3.5 bg-gray-50 rounded-xl p-2.5 border border-dashed border-gray-200 text-left">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">今日宝贝训练记录</span>
                  <div className="flex items-center justify-between text-xs font-semibold text-[#191c1e] mt-1">
                    <span className="flex items-center text-[#004ac6]">
                      <Flame className="w-3.5 h-3.5 mr-1" />
                      今天打卡：{member.completedDates[new Date().toISOString().split('T')[0]]?.hours || 0} 小时
                    </span>
                    <span className="text-gray-500 truncate max-w-[200px]">
                      反馈：{member.completedDates[new Date().toISOString().split('T')[0]]?.remarks || '表现棒棒！'}
                    </span>
                  </div>
                </div>
              </div>

              {story ? (
                <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-xl p-4 shadow-sm relative text-[#78350f] leading-relaxed">
                  <div className="absolute right-3 top-3 flex space-x-1.5">
                    <button
                      onClick={() => handleCopyText(story, 'story')}
                      className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-amber-800 transition-colors border border-[#fef3c7]"
                      title="复制故事"
                    >
                      {storyCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setShowStoryReader(true)}
                      className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-amber-800 transition-colors border border-[#fef3c7] flex items-center space-x-0.5"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">读给宝贝</span>
                    </button>
                  </div>
                  <h4 className="font-bold text-sm text-amber-900 border-b border-amber-200/60 pb-1.5 mb-3 flex items-center">
                    <Sparkles className="w-4 h-4 text-amber-500 mr-1.5" />
                    今日冒险故事：《{member.name}与魔法眼罩》
                  </h4>
                  <p className="whitespace-pre-line text-xs font-medium">{story}</p>
                </div>
              ) : (
                !isStoryLoading && (
                  <div className="text-center py-8 text-gray-400 font-semibold border-2 border-dashed border-gray-200 rounded-xl">
                    还没有生成今天的故事哦
                  </div>
                )
              )}

              {isStoryLoading && (
                <div className="bg-white border border-[#e0e3e5] rounded-xl p-8 flex flex-col items-center justify-center space-y-3 shadow-xs">
                  <Loader2 className="w-8 h-8 text-[#004ac6] animate-spin" />
                  <span className="text-xs font-bold text-gray-500 animate-pulse">正在魔法构思宝贝的专属冒险...</span>
                </div>
              )}
            </div>

            <button
              onClick={handleGenerateStory}
              disabled={isStoryLoading}
              className={cn(
                "w-full py-3.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-md mt-4",
                isStoryLoading
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-amber-500 to-[#004ac6] hover:from-amber-600 hover:to-[#003ea8] text-white active:scale-98"
              )}
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>{story ? '重新生成今日故事' : '生成今日专属童话故事'}</span>
            </button>
          </div>
        )}

        {/* TAB 3: Professional Health Report */}
        {activeSubTab === 'report' && (
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-[#e0e3e5] p-4 text-center">
                <span className="text-3xl">📊</span>
                <h3 className="text-sm font-bold text-[#191c1e] mt-2">AI 遮盖训练报告与评估</h3>
                <p className="text-xs text-[#737686] mt-1 leading-relaxed">
                  通过 Gemini 深度分析宝贝的历史打卡时间、配合度以及家长备注，输出阶段性专业建议、精细视力练习方案及日常眼部护理提醒。
                </p>
              </div>

              {report ? (
                <div className="bg-[#eefcf7] border border-[#a7f3d0]/60 rounded-xl p-4 shadow-sm relative text-[#064e3b] leading-relaxed">
                  <div className="absolute right-3 top-3">
                    <button
                      onClick={() => handleCopyText(report, 'report')}
                      className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-emerald-800 transition-colors border border-[#a7f3d0]/40"
                      title="复制报告"
                    >
                      {reportCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <h4 className="font-bold text-sm text-emerald-950 border-b border-[#a7f3d0] pb-1.5 mb-3 flex items-center">
                    <Brain className="w-4 h-4 text-emerald-500 mr-1.5" />
                    智能诊断与阶段方案
                  </h4>
                  <p className="whitespace-pre-line text-[11px] font-medium leading-relaxed font-sans">{report}</p>
                </div>
              ) : (
                !isReportLoading && (
                  <div className="text-center py-8 text-gray-400 font-semibold border-2 border-dashed border-gray-200 rounded-xl">
                    暂无训练诊断评估
                  </div>
                )
              )}

              {isReportLoading && (
                <div className="bg-white border border-[#e0e3e5] rounded-xl p-8 flex flex-col items-center justify-center space-y-3 shadow-xs">
                  <Loader2 className="w-8 h-8 text-[#006a61] animate-spin" />
                  <span className="text-xs font-bold text-gray-500 animate-pulse">AI 护眼医生正在阅读历史数据...</span>
                </div>
              )}
            </div>

            <button
              onClick={handleGenerateReport}
              disabled={isReportLoading}
              className={cn(
                "w-full py-3.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-md mt-4",
                isReportLoading
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-[#006a61] hover:bg-[#005049] text-white active:scale-98"
              )}
            >
              <Brain className="w-4 h-4" />
              <span>{report ? '重新生成评估报告' : '一键评估当前眼部打卡数据'}</span>
            </button>
          </div>
        )}

      </div>

      {/* Fullscreen Story Reader modal for Kids */}
      <AnimatePresence>
        {showStoryReader && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#1e1b4b] text-yellow-50 p-6 flex flex-col justify-between select-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-yellow-500/20 pb-3">
              <span className="text-sm font-bold flex items-center space-x-1">
                <span>🌟</span>
                <span>故事绘本模式</span>
              </span>
              <button
                onClick={() => setShowStoryReader(false)}
                className="px-3 py-1 bg-yellow-500 text-[#1e1b4b] rounded-full font-bold text-xs hover:bg-yellow-400 transition-colors"
              >
                返回
              </button>
            </div>

            {/* Magic story board */}
            <div className="flex-1 my-6 overflow-y-auto px-2 py-4 scrollbar-none flex flex-col justify-center items-center text-center">
              <div className="text-5xl mb-4 animate-bounce">{member.avatar}</div>
              <h2 className="text-lg font-black text-yellow-300 mb-4">《{member.name}与魔法眼罩》</h2>
              <p className="text-sm leading-relaxed text-yellow-100/90 whitespace-pre-line font-medium max-w-sm">
                {story}
              </p>
            </div>

            {/* Footer advice */}
            <div className="border-t border-yellow-500/20 pt-3 text-center text-[10px] text-yellow-300/60 font-semibold flex items-center justify-center space-x-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              <span>爸爸妈妈朗读完后，别忘了给宝贝盖上勇气红星哦！</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
