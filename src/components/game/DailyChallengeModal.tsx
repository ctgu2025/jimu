import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Trophy, 
  Clock, 
  Play, 
  Share2, 
  X, 
  Sparkles, 
  CheckCircle2, 
  Medal, 
  Users, 
  Globe, 
  Calendar,
  RotateCcw,
  ChevronRight
} from 'lucide-react';
import { DailyChallengeRecord, DailyGlobalLeaderboardItem, LevelData } from '../../types/game';
import { getTodayDateString, getTimeUntilMidnight, generateDailyGlobalLeaderboard, getDailyStreak } from '../../utils/dailyChallenge';
import { sound } from '../../services/sound';

interface DailyChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyLevel: LevelData;
  todayRecord?: DailyChallengeRecord;
  dailyRecords: Record<string, DailyChallengeRecord>;
  onStartDailyChallenge: () => void;
  onShareDailyChallenge: () => void;
}

export const DailyChallengeModal: React.FC<DailyChallengeModalProps> = ({
  isOpen,
  onClose,
  dailyLevel,
  todayRecord,
  dailyRecords,
  onStartDailyChallenge,
  onShareDailyChallenge,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard'>('overview');
  const [countdown, setCountdown] = useState<string>(getTimeUntilMidnight());

  const todayStr = getTodayDateString();
  const streak = getDailyStreak(dailyRecords);
  const leaderboard = generateDailyGlobalLeaderboard(todayStr, todayRecord);

  // Live countdown timer until midnight
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCountdown(getTimeUntilMidnight());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  // Find player's rank if completed
  const userRankItem = leaderboard.find((item) => item.isSelf);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-md w-full h-[88vh] overflow-hidden shadow-2xl flex flex-col relative">
        {/* Top Flame Ambient Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/70 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/30">
              <Flame className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white">每日全服空间挑战</h3>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  {todayStr}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">每日统一题谱 · 决战全球极速榜</p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Countdown & Streak Sub-bar */}
        <div className="px-4 py-2 bg-gradient-to-r from-amber-950/40 via-slate-900 to-rose-950/30 border-b border-slate-800 flex items-center justify-between text-[11px] shrink-0">
          <div className="flex items-center gap-1.5 text-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>刷新倒计时:</span>
            <span className="font-mono font-bold text-white bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800">
              {countdown}
            </span>
          </div>

          <div className="flex items-center gap-1 text-slate-300 font-mono">
            <span>🔥 连续挑战:</span>
            <span className="text-amber-400 font-bold">{streak}</span>
            <span>天</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center px-4 py-2 bg-slate-950/50 border-b border-slate-800 gap-2 shrink-0">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('overview');
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>今日关卡总览</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('leaderboard');
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 relative ${
              activeTab === 'leaderboard'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>全服通关榜 ({leaderboard.length})</span>
            {userRankItem && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1.5 right-2" />
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {activeTab === 'overview' && (
            <div className="space-y-3.5">
              {/* Daily Level Hero Card */}
              <div className="p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950/30 relative overflow-hidden shadow-lg">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block">
                      全服统一题谱 · {todayStr}
                    </span>
                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>{dailyLevel.title}</span>
                    </h4>
                    <p className="text-xs text-slate-400">{dailyLevel.concept}</p>
                  </div>

                  {todayRecord?.completed ? (
                    <div className="px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>已通关</span>
                    </div>
                  ) : (
                    <div className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>待挑战</span>
                    </div>
                  )}
                </div>

                {/* Level parameters */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800 text-center">
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">空间网格</span>
                    <span className="text-xs font-mono font-bold text-slate-200">
                      {dailyLevel.gridSize.x}×{dailyLevel.gridSize.y}×{dailyLevel.gridSize.z}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">标准步数</span>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      ≤ {dailyLevel.targetMoves} 步
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">标准用时</span>
                    <span className="text-xs font-mono font-bold text-sky-400">
                      ≤ {dailyLevel.targetSeconds}s
                    </span>
                  </div>
                </div>

                {/* Hint excerpt */}
                <p className="text-[11px] text-slate-300 mt-3 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                  💡 {dailyLevel.hint}
                </p>
              </div>

              {/* Player's Today Result Card */}
              {todayRecord?.completed ? (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/40 shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white">我的今日战报</span>
                    </div>
                    {userRankItem && (
                      <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                        全球第 {userRankItem.rank} 名
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400">通关最佳用时</span>
                      <div className="text-base font-bold font-mono text-sky-400">
                        {todayRecord.timeSeconds.toFixed(1)}s
                      </div>
                    </div>
                    <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400">消耗积木步数</span>
                      <div className="text-base font-bold font-mono text-amber-400">
                        {todayRecord.moves} 步
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-emerald-300/90 text-center mt-2.5">
                    🎉 已击败全服 96.8% 的空间解谜者，可随时重新推演刷新极速！
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-center space-y-1.5">
                  <span className="text-xs font-semibold text-slate-300 block">今日挑战尚未完成</span>
                  <p className="text-[11px] text-slate-400">
                    所有玩家今日挑战同一随机生成的空间考题，通关后即可登顶全球通关榜！
                  </p>
                </div>
              )}

              {/* Rules & Retention Incentive */}
              <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/80 space-y-2 text-[11px] text-slate-300">
                <span className="font-semibold text-amber-400 block">每日规则说明：</span>
                <ul className="space-y-1 text-slate-400 list-disc list-inside">
                  <li>每日零点（00:00）全服自动生成全新解谜关卡，全球玩家共用同一关卡题谱。</li>
                  <li>通关后记录个人最快用时与最少步数，并计入全球极速榜。</li>
                  <li>连续通关可累加连续挑战天数，解锁限定微信专属徽章与成就。</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="space-y-2.5">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white">今日全球通关榜单</h4>
                  <p className="text-[10px] text-slate-400">实时展示全服最精炼步数与极速解法</p>
                </div>
                <Globe className="w-5 h-5 text-sky-400" />
              </div>

              {/* Leaderboard list */}
              <div className="space-y-1.5">
                {leaderboard.map((item) => {
                  const isTop1 = item.rank === 1;
                  const isTop2 = item.rank === 2;
                  const isTop3 = item.rank === 3;

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        item.isSelf
                          ? 'bg-amber-500/15 border-amber-500/60 shadow-md ring-1 ring-amber-400/40'
                          : 'bg-slate-950/70 border-slate-800/90'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Rank indicator */}
                        <div className="w-7 text-center font-bold font-mono text-sm shrink-0">
                          {isTop1 ? '🥇' : isTop2 ? '🥈' : isTop3 ? '🥉' : <span className="text-slate-400 text-xs">{item.rank}</span>}
                        </div>

                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm shrink-0">
                          {item.avatar}
                        </div>

                        {/* Name and City */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-white truncate">
                              {item.name}
                            </span>
                            {item.isSelf && (
                              <span className="text-[9px] bg-amber-500 text-slate-950 px-1 rounded font-bold shrink-0">
                                我
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {item.city} · {item.date}
                          </span>
                        </div>
                      </div>

                      {/* Score: Time and Moves */}
                      <div className="text-right shrink-0 ml-2">
                        <div className="text-xs font-bold font-mono text-sky-400">
                          {item.timeSeconds.toFixed(1)}s
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.moves} 步
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              sound.playClick();
              onShareDailyChallenge();
            }}
            className="h-11 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
            title="生成今日专属挑战海报"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-400" />
            <span>分享</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onStartDailyChallenge();
              onClose();
            }}
            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-98 transition-all"
          >
            {todayRecord?.completed ? (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>再次挑战刷新极速</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>立即开启今日挑战</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
