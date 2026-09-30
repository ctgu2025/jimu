import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Trophy, Swords, X, Sparkles, Send } from 'lucide-react';
import { FriendRankItem, WeChatMomentsPost } from '../../types/game';
import { sound } from '../../services/sound';

interface MomentsFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: WeChatMomentsPost[];
  onLikePost: (postId: string) => void;
  onCommentPost: (postId: string, commentText: string) => void;
  onChallengeLevel: (levelId: number) => void;
  currentLevelLeaderboard: FriendRankItem[];
  currentLevelId: number;
}

export const MomentsFeedModal: React.FC<MomentsFeedModalProps> = ({
  isOpen,
  onClose,
  posts,
  onLikePost,
  onCommentPost,
  onChallengeLevel,
  currentLevelLeaderboard,
  currentLevelId,
}) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'rank'>('feed');
  const [commentInputId, setCommentInputId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  if (!isOpen) return null;

  const handleSendComment = (postId: string) => {
    if (!commentText.trim()) return;
    sound.playClick();
    onCommentPost(postId, commentText.trim());
    setCommentText('');
    setCommentInputId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full h-[88vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Top Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/60">
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('feed');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'feed'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              朋友圈圈子
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('rank');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'rank'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              本关好友PK榜
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab 1: Moments Feed */}
        {activeTab === 'feed' && (
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
            {/* Top Moments Banner */}
            <div className="relative h-28 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 p-4 flex flex-col justify-end text-white">
              <div className="absolute top-3 right-3 text-[11px] bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-sm">
                微信好友圈 · 空间比拼
              </div>
              <h3 className="text-lg font-bold">空间极客圈</h3>
              <p className="text-xs text-amber-100">晒出你的极限通关步数，向好友发起高难度挑战！</p>
            </div>

            {/* Post Feed */}
            {posts.map((post) => (
              <div key={post.id} className="p-4 bg-slate-900/60 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start gap-3">
                  {/* User Avatar */}
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-lg shrink-0">
                    {post.authorAvatar}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* User & Time */}
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-amber-300">{post.authorName}</span>
                      <span className="text-[10px] text-slate-500">{post.timestamp}</span>
                    </div>

                    {/* Post Caption */}
                    <p className="text-xs text-slate-200 mt-1 leading-relaxed">{post.caption}</p>

                    {/* Score / Level Highlight Card */}
                    <div className="mt-2.5 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
                          {post.levelNumber}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-slate-200">{post.levelTitle}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            用时: <span className="text-sky-400 font-semibold">{post.timeSeconds.toFixed(1)}s</span> · 步数: <span className="text-amber-400 font-semibold">{post.moves}</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Challenge Button */}
                      <button
                        onClick={() => {
                          sound.playClick();
                          onChallengeLevel(post.levelNumber);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                      >
                        <Swords className="w-3 h-3" />
                        <span>挑战TA</span>
                      </button>
                    </div>

                    {/* Post Image Snapshot if available */}
                    {post.snapshotUrl && (
                      <div className="mt-2.5 rounded-lg overflow-hidden border border-slate-800 max-h-40 bg-slate-950">
                        <img src={post.snapshotUrl} alt="通关截图" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Interaction Bar (Like & Comment) */}
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => {
                            sound.playClick();
                            onLikePost(post.id);
                          }}
                          className="flex items-center gap-1 hover:text-rose-400 transition-colors"
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              post.likes.length > 0 ? 'fill-rose-500 text-rose-500' : ''
                            }`}
                          />
                          <span className="text-[11px] font-mono">{post.likes.length}</span>
                        </button>

                        <button
                          onClick={() => {
                            sound.playClick();
                            setCommentInputId(commentInputId === post.id ? null : post.id);
                          }}
                          className="flex items-center gap-1 hover:text-sky-400 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-mono">{post.comments.length}</span>
                        </button>
                      </div>

                      <span className="text-[10px] text-slate-500">微信朋友圈公开</span>
                    </div>

                    {/* Likes List */}
                    {post.likes.length > 0 && (
                      <div className="mt-2 text-[11px] text-slate-400 bg-slate-950/40 px-2 py-1 rounded flex items-center gap-1">
                        <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500 shrink-0" />
                        <span className="truncate">{post.likes.join('、')} 觉得很赞</span>
                      </div>
                    )}

                    {/* Comments List */}
                    {post.comments.length > 0 && (
                      <div className="mt-1.5 space-y-1 bg-slate-950/40 p-2 rounded text-[11px]">
                        {post.comments.map((c, idx) => (
                          <div key={idx} className="leading-snug">
                            <span className="text-amber-400/90 font-medium">{c.user}: </span>
                            <span className="text-slate-300">{c.text}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Inline Comment Input Box */}
                    {commentInputId === post.id && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendComment(post.id)}
                          placeholder="写下对好友战绩的评价..."
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                        />
                        <button
                          onClick={() => handleSendComment(post.id)}
                          className="p-1.5 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 font-medium"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Friends Leaderboard */}
        {activeTab === 'rank' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-white">第 {currentLevelId} 关 · 微信好友极速榜</h4>
                <p className="text-[11px] text-slate-400">实时同步微信群好友空间挑战用时与步数</p>
              </div>
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>

            <div className="space-y-2">
              {currentLevelLeaderboard.map((item, idx) => {
                const isTop1 = idx === 0;
                const isTop2 = idx === 1;
                const isTop3 = idx === 2;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      item.isSelf
                        ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank Medal / Number */}
                      <div className="w-7 text-center font-bold font-mono">
                        {isTop1 ? '🥇' : isTop2 ? '🥈' : isTop3 ? '🥉' : <span className="text-slate-400 text-xs">{idx + 1}</span>}
                      </div>

                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-base">
                        {item.avatar}
                      </div>

                      {/* Name & Date */}
                      <div>
                        <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {item.isSelf && (
                            <span className="text-[9px] bg-amber-500 text-slate-950 px-1 rounded font-bold">我</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">{item.date}</div>
                      </div>
                    </div>

                    {/* Stats & PK button */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-bold font-mono text-sky-400">{item.timeSeconds.toFixed(1)}s</div>
                        <div className="text-[10px] text-slate-400">{item.moves} 步</div>
                      </div>

                      <button
                        onClick={() => {
                          sound.playClick();
                          onChallengeLevel(currentLevelId);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-amber-300 border border-slate-700"
                      >
                        挑战
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
