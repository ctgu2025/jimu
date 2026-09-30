import React, { useState } from 'react';
import { MessageSquare, Users, Image as ImageIcon, Link as LinkIcon, Check, X } from 'lucide-react';
import { sound } from '../../services/sound';

interface WeChatShareActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPoster: () => void;
  onPostToMoments: () => void;
  levelTitle: string;
  levelNumber: number;
  timeSeconds: number;
}

export const WeChatShareActionSheet: React.FC<WeChatShareActionSheetProps> = ({
  isOpen,
  onClose,
  onOpenPoster,
  onPostToMoments,
  levelTitle,
  levelNumber,
  timeSeconds,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 2200);
  };

  const handleShareFriend = () => {
    sound.playClick();
    triggerToast('已模拟发送到当前微信对话');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleCopyLink = () => {
    sound.playClick();
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(
      `【方块筑梦师】我在第${levelNumber}关《${levelTitle}》跑出${timeSeconds.toFixed(1)}秒！点击直接开玩：${shareUrl}`
    );
    setCopiedLink(true);
    triggerToast('链接与挑战信息已复制到剪贴板！');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border-t border-slate-700/80 rounded-t-3xl max-w-md w-full p-5 shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Grab Handle */}
        <div className="w-10 h-1.5 bg-slate-700 rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-white">分享空间挑战</h3>
            <p className="text-xs text-slate-400">邀请微信群友与朋友圈好友一同解谜</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Share Destination Grid */}
        <div className="grid grid-cols-4 gap-3 py-2 text-center">
          {/* Share to WeChat Friend */}
          <button
            onClick={handleShareFriend}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-800/80 active:scale-95 transition-all group"
          >
            <div className="w-13 h-13 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <span className="text-[11px] text-slate-300 font-medium">发送给朋友</span>
          </button>

          {/* Share to Moments Poster */}
          <button
            onClick={() => {
              onClose();
              onOpenPoster();
            }}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-800/80 active:scale-95 transition-all group"
          >
            <div className="w-13 h-13 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ImageIcon className="w-6 h-6" />
            </div>
            <span className="text-[11px] text-slate-300 font-medium">朋友圈海报</span>
          </button>

          {/* Share to In-Game Moments Feed */}
          <button
            onClick={() => {
              onPostToMoments();
              onClose();
            }}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-800/80 active:scale-95 transition-all group"
          >
            <div className="w-13 h-13 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-[11px] text-slate-300 font-medium">朋友圈动态</span>
          </button>

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-800/80 active:scale-95 transition-all group"
          >
            <div className="w-13 h-13 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              {copiedLink ? <Check className="w-6 h-6 text-emerald-400" /> : <LinkIcon className="w-6 h-6" />}
            </div>
            <span className="text-[11px] text-slate-300 font-medium">复制链接</span>
          </button>
        </div>

        {/* WeChat Mini-Program Card Mock Preview */}
        <div className="mt-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-xl shrink-0">
            🧱
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold text-slate-100 truncate">
              《方块筑梦师》第{levelNumber}关 · {levelTitle}
            </h4>
            <p className="text-[11px] text-slate-400 truncate">
              空间思维IQ大挑战，点击挑战好友极速通关纪录！
            </p>
          </div>
          <span className="text-[10px] text-emerald-400 font-medium bg-emerald-950/80 px-2 py-1 rounded border border-emerald-800/50 shrink-0">
            小程序卡片
          </span>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onClose}
          className="w-full mt-4 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
        >
          取消
        </button>

        {/* Toast */}
        {showToast && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-60 bg-slate-950/90 text-white border border-slate-700 px-4 py-2 rounded-xl text-xs shadow-xl animate-in zoom-in-95">
            {showToast}
          </div>
        )}
      </div>
    </div>
  );
};
