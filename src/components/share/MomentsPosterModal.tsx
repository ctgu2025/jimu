import React, { useRef, useState, useEffect } from 'react';
import { X, Download, Share2, Copy, Check, Sparkles, Trophy, QrCode } from 'lucide-react';
import { sound } from '../../services/sound';

interface MomentsPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  levelNumber: number;
  levelTitle: string;
  timeSeconds: number;
  moves: number;
  screenshotUrl: string;
  challengeCode: string;
  userName?: string;
  onShareToFeed?: () => void;
}

export const MomentsPosterModal: React.FC<MomentsPosterModalProps> = ({
  isOpen,
  onClose,
  levelNumber,
  levelTitle,
  timeSeconds,
  moves,
  screenshotUrl,
  challengeCode,
  userName = '空间极客小木',
  onShareToFeed,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [posterDataUrl, setPosterDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);

  // Compute beats percentile
  const beatsPercent = Math.min(99.6, Math.max(82.4, 100 - (moves * 1.5 + timeSeconds * 0.4))).toFixed(1);

  useEffect(() => {
    if (!isOpen) return;
    setIsGenerating(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High-resolution poster dimensions (e.g., 750 x 1200 - standard WeChat poster size)
    canvas.width = 750;
    canvas.height = 1200;

    // 1. Background gradient (Deep elegant navy to dark slate)
    const bgGrad = ctx.createLinearGradient(0, 0, 750, 1200);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.4, '#1e293b');
    bgGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 750, 1200);

    // Subtle decorative grid circles
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let r = 80; r < 600; r += 90) {
      ctx.beginPath();
      ctx.arc(375, 480, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 2. WeChat User Header Bar
    // User avatar circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(80, 80, 36, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('🧑‍🚀', 80, 82);
    ctx.restore();

    // User name & App subtitle
    ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(userName, 134, 70);

    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('正在玩《方块筑梦师》空间解谜', 134, 102);

    // WeChat Mini Program badge in top right
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.roundRect(530, 56, 170, 48, 24);
    ctx.fill();
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText('微信小游戏 ⚡', 615, 87);

    // 3. Main Level & Achievement Title
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'center';
    ctx.fillText(`第 ${levelNumber} 关 · 空间战报`, 375, 175);

    ctx.font = 'bold 44px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(levelTitle, 375, 230);

    // 4. Render 3D Snapshot with glowing card frame
    const cardX = 55;
    const cardY = 275;
    const cardW = 640;
    const cardH = 460;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 24);
    ctx.fill();
    ctx.stroke();
    ctx.clip();

    // Draw snapshot image if available
    if (screenshotUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, cardX, cardY, cardW, cardH);

        // Continue rendering overlay after image loads
        renderPosterBottom(ctx);
        setPosterDataUrl(canvas.toDataURL('image/png'));
        setIsGenerating(false);
      };
      img.src = screenshotUrl;
      return;
    } else {
      // Placeholder illustration if image not ready
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cardX, cardY, cardW, cardH);
      ctx.font = 'bold 32px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText('3D 空间积木造型', 375, 500);
      ctx.restore();

      renderPosterBottom(ctx);
      setPosterDataUrl(canvas.toDataURL('image/png'));
      setIsGenerating(false);
    }
  }, [isOpen, levelNumber, levelTitle, timeSeconds, moves, screenshotUrl, beatsPercent, userName]);

  const renderPosterBottom = (ctx: CanvasRenderingContext2D) => {
    ctx.restore();

    // 5. Stat Badge row
    const statsY = 770;
    const statW = 190;
    const stats = [
      { label: '通关用时', val: `${timeSeconds.toFixed(1)}s`, color: '#38bdf8' },
      { label: '搭建步数', val: `${moves} 步`, color: '#f59e0b' },
      { label: '击败全国', val: `${beatsPercent}%`, color: '#10b981' },
    ];

    stats.forEach((s, idx) => {
      const sx = 65 + idx * (statW + 35);
      ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(sx, statsY, statW, 100, 16);
      ctx.fill();
      ctx.stroke();

      ctx.font = '18px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText(s.label, sx + statW / 2, statsY + 36);

      ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = s.color;
      ctx.fillText(s.val, sx + statW / 2, statsY + 76);
    });

    // 6. Viral Catchphrase
    ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.beginPath();
    ctx.roundRect(65, 895, 620, 56, 28);
    ctx.fill();

    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'center';
    ctx.fillText('“我的空间三维解法无懈可击，谁敢来破纪录？！”', 375, 930);

    // 7. Bottom QR / Sun Code & Challenge Token Area
    const bottomY = 975;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(65, bottomY, 620, 175, 24);
    ctx.fill();

    // Simulated WeChat Sun Code / Circular Mini Game QR
    const qrCenter = 155;
    ctx.save();
    ctx.beginPath();
    ctx.arc(qrCenter, bottomY + 87, 56, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    // Ring patterns
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(qrCenter, bottomY + 87, 44, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('🧱', qrCenter, bottomY + 88);
    ctx.restore();

    // Right text
    ctx.font = 'bold 26px sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'left';
    ctx.fillText('长按识别微信小游戏', 240, bottomY + 54);

    ctx.font = '19px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('与百万微信好友在线比拼空间逻辑', 240, bottomY + 90);

    // Challenge Code Token pill
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.roundRect(240, bottomY + 110, 360, 42, 8);
    ctx.fill();

    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#0284c7';
    ctx.fillText(`挑战口令: ${challengeCode}`, 256, bottomY + 137);
  };

  const handleDownload = () => {
    sound.playClick();
    sound.triggerHaptic('medium');
    if (!posterDataUrl) return;

    const link = document.createElement('a');
    link.download = `方块筑梦师_第${levelNumber}关战报.png`;
    link.href = posterDataUrl;
    link.click();
  };

  const handleCopyCode = () => {
    sound.playClick();
    navigator.clipboard.writeText(
      `【空间积木挑战】我在《方块筑梦师》第${levelNumber}关仅用${timeSeconds.toFixed(1)}秒通关！快输入口令 ${challengeCode} 来挑战我！`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-sm text-slate-100">朋友圈战报生成</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Poster Preview */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center">
          <canvas ref={canvasRef} className="hidden" />

          {isGenerating ? (
            <div className="w-full aspect-[9/14] rounded-xl bg-slate-950 flex flex-col items-center justify-center border border-slate-800">
              <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-xs text-slate-400 mt-2">正在合成微信高清水印战报...</p>
            </div>
          ) : (
            <div className="relative group w-full rounded-xl overflow-hidden shadow-2xl border border-slate-700/50">
              <img
                src={posterDataUrl}
                alt="朋友圈战报"
                className="w-full h-auto object-cover rounded-xl"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 backdrop-blur-sm py-1.5 px-3 rounded-lg text-center text-[11px] text-slate-300 pointer-events-none">
                长按可直接保存或发送给微信朋友
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2 shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>保存高清海报</span>
            </button>

            <button
              onClick={() => {
                if (onShareToFeed) onShareToFeed();
                onClose();
              }}
              className="h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>发至模拟朋友圈</span>
            </button>
          </div>

          <button
            onClick={handleCopyCode}
            className="w-full h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">口令已复制，快发到微信群PK！</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>复制微信好友PK挑战口令</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
