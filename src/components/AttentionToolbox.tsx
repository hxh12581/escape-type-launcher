'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

type ToolType = 'buffer' | 'wander' | 'environment' | 'transition';

interface AttentionToolboxProps {
  open: boolean;
  onClose: () => void;
  stage: string | null;
  energy: 'red' | 'yellow' | 'green' | null;
}

const TOOLS: { id: ToolType; label: string; emoji: string }[] = [
  { id: 'buffer', label: '任务缓冲区', emoji: '📋' },
  { id: 'wander', label: '允许思绪漫游', emoji: '🌊' },
  { id: 'environment', label: '换环境建议', emoji: '🚶' },
  { id: 'transition', label: '过渡缓冲闹钟', emoji: '⏰' },
];

export default function AttentionToolbox({ open, onClose, stage, energy }: AttentionToolboxProps) {
  const [activeTool, setActiveTool] = useState<ToolType>('buffer');
  const [bufferThought, setBufferThought] = useState('');
  const [bufferCount, setBufferCount] = useState(0);
  const [showBufferInput, setShowBufferInput] = useState(false);
  const [wanderDuration, setWanderDuration] = useState<5 | 10 | 15>(5);
  const [wanderState, setWanderState] = useState<'idle' | 'running' | 'done'>('idle');
  const [wanderSecondsLeft, setWanderSecondsLeft] = useState(300);
  const [wanderFeedback, setWanderFeedback] = useState<string | null>(null);
  const [transitionFrom, setTransitionFrom] = useState('');
  const [transitionTo, setTransitionTo] = useState('');
  const [transitionAlerts, setTransitionAlerts] = useState<number[]>([]);
  const [transitionDone, setTransitionDone] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      // Reset all states when closing
      setWanderState('idle');
      setWanderFeedback(null);
      setShowBufferInput(false);
      setTransitionAlerts([]);
      setTransitionDone(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const startWanderTimer = () => {
    const sec = wanderDuration * 60;
    setWanderSecondsLeft(sec);
    setWanderState('running');
    setWanderFeedback(null);
    let remaining = sec;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setWanderSecondsLeft(remaining);
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setWanderState('done');
      }
    }, 1000);
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const startTransitionAlerts = () => {
    // Three alerts: 5min → 3min → 1min
    setTransitionAlerts([5, 3, 1]);
    setTransitionDone(false);
    const times = [300, 180, 60];
    times.forEach((sec, i) => {
      setTimeout(() => {
        setTransitionAlerts(prev => prev.filter((_, idx) => idx !== 0));
      }, sec * 1000);
    });
    // Mark done after all three
    setTimeout(() => {
      setTransitionDone(true);
      setTransitionAlerts([]);
    }, times.reduce((a, b) => a + b) * 1000);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-[#FAFAF9] rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto animate-fadeIn"
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#FAFAF9] z-10 flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/30">
          <h2 className="font-semibold text-lg">🎯 注意力工具箱</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Tool tabs */}
        <div className="flex gap-1 px-4 pt-3 pb-2 overflow-x-auto">
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              onClick={() => { setActiveTool(tool.id); setWanderState('idle'); setShowBufferInput(false); }}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTool === tool.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              {tool.emoji} {tool.label}
            </button>
          ))}
        </div>

        {/* Tool content */}
        <div className="px-5 py-4">
          {/* Tool A: 任务缓冲区 */}
          {activeTool === 'buffer' && (
            <div className="animate-fadeIn">
              <h3 className="font-semibold mb-2">拦截跑掉的念头</h3>
              <p className="text-sm text-muted-foreground mb-4">
                把脑子里的干扰念头写下来，10分钟后统一处理。
              </p>
              {bufferCount > 0 && (
                <div className="text-sm text-muted-foreground mb-3">
                  已拦截 <strong className="text-foreground">{bufferCount}</strong> 个干扰念头
                </div>
              )}
              {!showBufferInput ? (
                <Button variant="outline" className="w-full" onClick={() => setShowBufferInput(true)}>
                  ✍️ 记录一个新念头
                </Button>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={bufferThought}
                    onChange={e => setBufferThought(e.target.value)}
                    placeholder="现在冒出来的念头是..."
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter' && bufferThought.trim()) {
                        setBufferCount(prev => prev + 1);
                        setBufferThought('');
                        setShowBufferInput(false);
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => {
                      if (bufferThought.trim()) {
                        setBufferCount(prev => prev + 1);
                        setBufferThought('');
                        setShowBufferInput(false);
                      }
                    }}>
                      已记录，继续
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowBufferInput(false)}>
                      取消
                    </Button>
                  </div>
                </div>
              )}
              {bufferCount === 0 && !showBufferInput && (
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  没有念头需要拦截？太好了，继续做你的事。
                </p>
              )}
            </div>
          )}

          {/* Tool B: 允许思绪漫游 */}
          {activeTool === 'wander' && (
            <div className="animate-fadeIn">
              <h3 className="font-semibold mb-2">让大脑放空一会儿</h3>
              <p className="text-sm text-muted-foreground mb-4">
                设一个时间，不做任何控制。让想法来，让想法去。
              </p>
              {wanderState === 'idle' && (
                <>
                  <div className="flex gap-2 mb-4">
                    {([5, 10, 15] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => setWanderDuration(d)}
                        className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-colors ${
                          wanderDuration === d
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        {d}分钟
                      </button>
                    ))}
                  </div>
                  <Button onClick={startWanderTimer} className="w-full">
                    开始放空
                  </Button>
                </>
              )}
              {wanderState === 'running' && (
                <div className="text-center">
                  <div className="bg-card border border-border/30 rounded-2xl p-8 mb-4">
                    <div className="text-5xl font-light font-mono tracking-wider mb-3">
                      {formatTime(wanderSecondsLeft)}
                    </div>
                    <p className="text-sm text-muted-foreground">思绪漫游中...</p>
                  </div>
                  <Button variant="ghost" className="text-muted-foreground"
                    onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setWanderState('idle'); }}>
                    提前结束
                  </Button>
                </div>
              )}
              {wanderState === 'done' && !wanderFeedback && (
                <div className="text-center">
                  <p className="text-sm mb-4">⏰ 时间到。你感觉怎么样？</p>
                  <div className="flex flex-col gap-2">
                    {['感觉好点了', '没什么变化', '感觉更糟了'].map(opt => (
                      <Button key={opt} variant="outline" onClick={() => setWanderFeedback(opt)}>
                        {opt}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {wanderFeedback && (
                <div className="bg-card border border-border/30 rounded-2xl p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    好的。不评判，只观察。
                  </p>
                  <Button variant="ghost" className="mt-2" onClick={() => { setWanderState('idle'); setWanderFeedback(null); }}>
                    再做一次
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Tool C: 换环境建议 */}
          {activeTool === 'environment' && (
            <div className="animate-fadeIn">
              <h3 className="font-semibold mb-2">换一个地方试试</h3>
              <p className="text-sm text-muted-foreground mb-4">
                你在一个地方待太久可能会卡住。
              </p>
              <div className="bg-card border border-border/30 rounded-2xl p-5 mb-4">
                <p className="text-sm font-medium mb-3">建议操作：</p>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li>① 站起来</li>
                  <li>② 走到另一个房间/位置</li>
                  <li>③ 重新开始</li>
                </ol>
              </div>
              <div className="bg-card border border-border/30 rounded-2xl p-5">
                <p className="text-sm font-medium mb-3">如果出不了门：</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>□ 从书桌换到沙发</li>
                  <li>□ 从坐着换到站着</li>
                  <li>□ 从室内换到阳台/窗边</li>
                </ul>
              </div>
            </div>
          )}

          {/* Tool D: 过渡缓冲闹钟 */}
          {activeTool === 'transition' && (
            <div className="animate-fadeIn">
              <h3 className="font-semibold mb-2">准备切换了</h3>
              <p className="text-sm text-muted-foreground mb-4">
                设一个过渡闹钟。需要切换到什么？
              </p>
              <div className="space-y-3 mb-4">
                <input
                  type="text"
                  value={transitionFrom}
                  onChange={e => setTransitionFrom(e.target.value)}
                  placeholder="从..."
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <input
                  type="text"
                  value={transitionTo}
                  onChange={e => setTransitionTo(e.target.value)}
                  placeholder="切换到..."
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              {transitionAlerts.length > 0 && (
                <div className="bg-card border border-border/30 rounded-2xl p-4 mb-4 space-y-2">
                  <p className="text-sm font-medium">⏳ 切换进度</p>
                  {transitionAlerts.includes(5) && <p className="text-sm text-muted-foreground">⏰ 还有5分钟 — 该准备切换了</p>}
                  {transitionAlerts.includes(3) && <p className="text-sm text-amber-600">⏰ 还有3分钟 — 开始收尾</p>}
                  {transitionAlerts.includes(1) && <p className="text-sm text-red-600">⏰ 还有1分钟 — 准备离开</p>}
                </div>
              )}
              {transitionDone && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4">
                  <p className="text-sm text-green-800">
                    ⏰ 时间到。先深呼吸3次，再开始新的任务。
                  </p>
                </div>
              )}
              {!transitionDone && (
                <Button onClick={startTransitionAlerts} disabled={!transitionFrom.trim() || !transitionTo.trim()} className="w-full">
                  开始三级预警
                </Button>
              )}
              {transitionDone && (
                <Button variant="outline" onClick={() => { setTransitionAlerts([]); setTransitionDone(false); setTransitionFrom(''); setTransitionTo(''); }} className="w-full">
                  重新设置
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
