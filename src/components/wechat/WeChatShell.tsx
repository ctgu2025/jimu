import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, RotateCcw, HelpCircle, Info, Smartphone, Monitor, X, Flame } from 'lucide-react';
import { sound } from '../../services/sound';

interface WeChatShellProps {
  children: React.ReactNode;
  levelTitle?: string;
  onResetLevel?: () => void;
  onOpenTutorial?: () => void;
  onOpenDailyChallenge?: () => void;
}

export const WeChatShell: React.FC<WeChatShellProps> = ({
  children,
  levelTitle = '方块筑梦师',
  onResetLevel,
  onOpenTutorial,
  onOpenDailyChallenge,
}) => {
  const [timeStr, setTimeStr] = useState('09:41');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.isMuted);
  const [isDesktopMode, setIsDesktopMode] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setTimeStr(`${h}:${m}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    setIsMenuOpen(false);
  };

  return (
    <div className="w-full h-screen bg-slate-950 flex items-center justify-center overflow-hidden">
      {/* Container wrapper: on desktop displays as a sleek mobile device or expanded */}
      <div
        className={`relative flex flex-col h-full bg-slate-900 overflow-hidden shadow-2xl transition-all duration-300 ${
          isDesktopMode ? 'w-full max-w-5xl rounded-none' : 'w-full max-w-[440px] md:max-h-[920px] md:rounded-[40px] md:border-[10px] md:border-slate-800'
        }`}
      >
        {/* WeChat Mini-Program Top Bar */}
        <header className="relative z-30 flex items-center justify-between px-4 pt-2.5 pb-2 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 shrink-0 select-none">
          {/* Status info */}
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
            <span>{timeStr}</span>
            <span className="text-[10px] text-slate-500 font-sans hidden sm:inline">5G</span>
          </div>

          {/* Title in center */}
          <div className="text-xs font-semibold text-slate-200 truncate max-w-[150px] text-center">
            {levelTitle}
          </div>

          {/* Authentic WeChat Capsule Button (胶囊按钮) */}
          <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-full px-2.5 py-1 gap-2 shadow-sm">
            {/* More menu button (···) */}
            <button
              onClick={() => {
                sound.playClick();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              title="微信小程序菜单"
            >
              <span className="text-sm font-bold tracking-tighter leading-none">···</span>
            </button>

            {/* Capsule Divider */}
            <div className="w-[1px] h-3 bg-slate-700" />

            {/* Close/Minimize button (⨀) */}
            <button
              onClick={() => {
                sound.playClick();
                if (onResetLevel) onResetLevel();
              }}
              className="flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              title="重置当前关卡"
            >
              <span className="text-xs leading-none">⨀</span>
            </button>
          </div>

          {/* WeChat Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute top-12 right-4 z-50 bg-slate-900/95 border border-slate-700 rounded-2xl p-1.5 shadow-2xl w-48 text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={handleToggleSound}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors text-left"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                <span>{isMuted ? '开启音效' : '关闭音效'}</span>
              </button>

              {onOpenDailyChallenge && (
                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenDailyChallenge();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors text-left text-amber-300 font-medium"
                >
                  <Flame className="w-4 h-4 text-rose-400 fill-rose-500/30" />
                  <span>🔥 每日全服挑战榜</span>
                </button>
              )}

              {onResetLevel && (
                <button
                  onClick={() => {
                    sound.playClick();
                    onResetLevel();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors text-left"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span>重新推演本关</span>
                </button>
              )}

              {onOpenTutorial && (
                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenTutorial();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors text-left"
                >
                  <HelpCircle className="w-4 h-4 text-sky-400" />
                  <span>空间三维思维指南</span>
                </button>
              )}

              <button
                onClick={() => {
                  sound.playClick();
                  setIsDesktopMode(!isDesktopMode);
                  setIsMenuOpen(false);
                }}
                className="w-full hidden md:flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors text-left"
              >
                {isDesktopMode ? <Smartphone className="w-4 h-4 text-purple-400" /> : <Monitor className="w-4 h-4 text-purple-400" />}
                <span>{isDesktopMode ? '切换手机竖屏' : '切换全景大屏'}</span>
              </button>

              <div className="my-1 border-t border-slate-800" />

              <button
                onClick={() => {
                  sound.playClick();
                  setShowAbout(true);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors text-left text-slate-400"
              >
                <Info className="w-4 h-4" />
                <span>关于方块筑梦师</span>
              </button>
            </div>
          )}
        </header>

        {/* Main Content Area */}
        <main className="relative flex-1 w-full h-full overflow-hidden">
          {children}
        </main>
      </div>

      {/* About Dialog */}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-2xl mx-auto mb-3">
              🧱
            </div>
            <h3 className="text-base font-bold text-white">方块筑梦师</h3>
            <p className="text-xs text-amber-400 font-mono mt-0.5">Voxel Architect Quest v1.0</p>
            <p className="text-xs text-slate-300 mt-3 leading-relaxed text-left">
              一款专为微信打造的3D空间逻辑与三视图积木解谜小游戏。挑战空间认知、悬臂重力平衡与通道路由，随时一键生成朋友圈战报与好友发起PK比拼！
            </p>
            <button
              onClick={() => setShowAbout(false)}
              className="mt-4 w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
