'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface StageFragmentedProps {
  energyLevel: 'red' | 'yellow' | 'green';
  maxLayers: number;
  onComplete: () => void;
  onRestart: () => void;
  onBackToEnergy: () => void;
  openToolbox: () => void;
}

const ENERGY_META = {
  red:    { badge: '🔴 低能量', tip: '精力不够，先关掉干扰源。做完降噪就够今天用了。' },
  yellow: { badge: '🟡 中等能量', tip: '有点累但能试一下。降噪后做10分钟专注，够了就停。' },
  green:  { badge: '🟢 高能量', tip: '有精神。降噪→专注→锚定，可以走完整流程。' },
};

const NOISE_OPTIONS = [
  { id: 'phone', label: '手机翻面 / 放另一个房间' },
  { id: 'notif', label: '关闭所有非当前任务的通知' },
  { id: 'window', label: '只保留一个窗口（切换到全屏）' },
  { id: 'noise', label: '用白噪音覆盖环境噪音' },
];

const SENSORY_OPTIONS = [
  { id: 'ice', label: '握一个冰袋 / 凉水杯', desc: '温度刺激，让注意力回到身体' },
  { id: 'noise', label: '播放单一频率白噪音', desc: '听觉锚定，降低思维杂音' },
  { id: 'scent', label: '闻一下薄荷/风油精', desc: '嗅觉刺激，激活前额叶' },
  { id: 'touch', label: '握压力球/转笔', desc: '触觉锚定，释放多余能量' },
];

export default function StageFragmented({
  energyLevel,
  maxLayers,
  onComplete,
  onRestart,
  onBackToEnergy,
  openToolbox,
}: StageFragmentedProps) {
  const [layer, setLayer] = useState(1);
  const [noiseChecks, setNoiseChecks] = useState<Record<string, boolean>>(
    Object.fromEntries(NOISE_OPTIONS.map(o => [o.id, false]))
  );
  const [showSimplified, setShowSimplified] = useState(false);
  const [focusSecondsLeft, setFocusSecondsLeft] = useState(600);
  const [breakSecondsLeft, setBreakSecondsLeft] = useState(120);
  const [focusState, setFocusState] = useState<'idle' | 'focus' | 'break' | 'done'>('idle');
  const [focusCycles, setFocusCycles] = useState(0);
  const [interceptedCount, setInterceptedCount] = useState(0);
  const [currentThought, setCurrentThought] = useState('');
  const [showInterceptInput, setShowInterceptInput] = useState(false);
  const [sensoryChecks, setSensoryChecks] = useState<Record<string, boolean>>(
    Object.fromEntries(SENSORY_OPTIONS.map(o => [o.id, false]))
  );
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const meta = ENERGY_META[energyLevel];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const advance = () => {
    if (layer < maxLayers) {
      setLayer(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const goBack = () => {
    if (layer > 1) {
      setLayer(prev => prev - 1);
    } else {
      onBackToEnergy();
    }
  };

  const startFocusCycle = () => {
    setFocusState('focus');
    setFocusSecondsLeft(600);
    let remaining = 600;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setFocusSecondsLeft(remaining);
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setFocusState('break');
        setBreakSecondsLeft(120);
        let breakRemaining = 120;
        timerRef.current = setInterval(() => {
          breakRemaining -= 1;
          setBreakSecondsLeft(breakRemaining);
          if (breakRemaining <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            setFocusCycles(prev => prev + 1);
            setFocusState('idle');
          }
        }, 1000);
      }
    }, 1000);
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const progressLabel = layer > 1 ? `第${layer}层 / 共${maxLayers}层` : '';
  const allNoiseDone = NOISE_OPTIONS.every(o => noiseChecks[o.id]);

  return (
    <div className="animate-fadeIn flex flex-col gap-6">
      {/* Energy badge + layer indicator */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium px-3 py-1 rounded-full border border-border/30 bg-card">
          {meta.badge}
        </span>
        <span className="text-xs text-muted-foreground">
          📱 注意力失调{progressLabel && ` · ${progressLabel}`}
        </span>
      </div>
      <p className="text-xs text-muted-foreground -mt-4">{meta.tip}</p>

      {/* ===== Layer 1: 环境降噪 ===== */}
      {layer === 1 && (
        <div className="animate-fadeIn">
          <h2 className="text-xl font-semibold mb-2">关掉那些在"抢"你注意力的东西</h2>
          <p className="text-sm text-muted-foreground mb-5">
            注意力失调不是你的错——是外界干扰信号太多，你的大脑在同时处理"任务"和"威胁监控"两套系统。
            先把外部干扰源减少，减少大脑的负担。
          </p>
          <div className="bg-card border border-border/30 rounded-2xl p-6 mb-6 space-y-4">
            {NOISE_OPTIONS.map(opt => (
              <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={noiseChecks[opt.id]}
                  onChange={() => setNoiseChecks(prev => ({ ...prev, [opt.id]: !prev[opt.id] }))}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                />
                <span className={`${noiseChecks[opt.id] ? 'line-through text-muted-foreground' : ''} transition-colors`}>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>

          {!showSimplified ? (
            <div className="flex flex-col gap-2">
              <Button onClick={advance} className="w-full">
                做完降噪了，继续
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setShowSimplified(true)} className="text-muted-foreground flex-1">
                  不知道怎么选，帮我简化
                </Button>
                <Button variant="ghost" onClick={goBack} className="text-muted-foreground flex-1">
                  ← 返回
                </Button>
              </div>
            </div>
          ) : (
            <div className="animate-fadeIn space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <p className="text-sm text-amber-800">
                  建议你先做这一件：<strong>把手机翻面或放远</strong>。
                  <br />
                  做完这一件如果已经感觉好了一些，就可以继续了。
                </p>
              </div>
              <Button variant="ghost" onClick={goBack} className="text-muted-foreground w-full">
                ← 返回
              </Button>
            </div>
          )}

          {allNoiseDone && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              如果降噪后已经能专注了——直接去做事。不用往下走。
            </p>
          )}
        </div>
      )}

      {/* ===== Layer 2: 10分钟专注 + 任务缓冲区 ===== */}
      {layer === 2 && (
        <div className="animate-fadeIn">
          <h2 className="text-xl font-semibold mb-2 text-center">10分钟就够了</h2>
          <p className="text-muted-foreground text-sm text-center mb-5">
            设10分钟闹钟，只做一件事。有念头冒出来？写下来，10分钟后再处理。
          </p>

          {/* Focus timer section */}
          {focusState === 'idle' && (
            <div className="text-center mb-5">
              <div className="bg-card border border-border/30 rounded-2xl p-8 mb-4">
                <div className="text-5xl font-light font-mono tracking-wider mb-3">10:00</div>
                <p className="text-sm text-muted-foreground">
                  {focusCycles > 0 ? `已完成 ${focusCycles} 个循环` : '准备开始第一个10分钟'}
                </p>
              </div>
              <Button onClick={startFocusCycle} className="w-full">
                开始10分钟专注
              </Button>
            </div>
          )}

          {focusState === 'focus' && (
            <div className="text-center mb-5">
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 mb-4">
                <div className="text-5xl font-light font-mono tracking-wider mb-3 text-primary">
                  {formatTime(focusSecondsLeft)}
                </div>
                <p className="text-sm text-muted-foreground mb-3">专注中...</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" className="text-muted-foreground flex-1"
                  onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setFocusState('idle'); }}>
                  中断专注
                </Button>
                {!showInterceptInput && (
                  <Button variant="outline" size="sm" onClick={() => setShowInterceptInput(true)}>
                    ✍️ 有干扰念头
                  </Button>
                )}
              </div>
            </div>
          )}

          {focusState === 'break' && (
            <div className="text-center mb-5">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-8 mb-4">
                <div className="text-5xl font-light font-mono tracking-wider mb-3 text-green-600">
                  {formatTime(breakSecondsLeft)}
                </div>
                <p className="text-sm text-green-700 mb-2">休息一下 🙌</p>
                <p className="text-xs text-green-600">让思绪漫游——不刷手机，不控制想法</p>
              </div>
            </div>
          )}

          {/* Task buffer: intercept thoughts */}
          {showInterceptInput && (
            <div className="animate-fadeIn bg-card border border-border/30 rounded-2xl p-5 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium">已拦截 {interceptedCount} 个干扰念头</span>
                <span className="text-xs text-muted-foreground">当前任务没有被劫持</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentThought}
                  onChange={e => setCurrentThought(e.target.value)}
                  placeholder="现在冒出来的念头是..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && currentThought.trim()) {
                      setInterceptedCount(prev => prev + 1);
                      setCurrentThought('');
                      setShowInterceptInput(false);
                    }
                  }}
                  autoFocus
                />
                <Button size="sm" onClick={() => {
                  if (currentThought.trim()) {
                    setInterceptedCount(prev => prev + 1);
                    setCurrentThought('');
                    setShowInterceptInput(false);
                  }
                }}>
                  记录
                </Button>
              </div>
            </div>
          )}

          {/* Continue button after cycle */}
          {focusState === 'idle' && focusCycles > 0 && (
            <div className="flex flex-col gap-2 mt-2">
              <Button onClick={startFocusCycle} variant="outline" className="w-full">
                再做10分钟（循环 {focusCycles + 1}）
              </Button>
              <Button onClick={advance} className="w-full">
                完成了{focusCycles}个循环，继续
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={onComplete} className="text-muted-foreground flex-1">
                  够了，去做事
                </Button>
                <Button variant="ghost" onClick={goBack} className="text-muted-foreground flex-1">
                  ← 返回
                </Button>
              </div>
            </div>
          )}

          {focusState === 'idle' && focusCycles === 0 && (
            <div className="flex gap-2 mt-4">
              <Button variant="ghost" onClick={onComplete} className="text-muted-foreground flex-1">
                先不做专注了
              </Button>
              <Button variant="ghost" onClick={goBack} className="text-muted-foreground flex-1">
                ← 返回
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ===== Layer 3: 感官锚定 ===== */}
      {layer === 3 && (
        <div className="animate-fadeIn">
          <h2 className="text-xl font-semibold mb-2">用感官把注意力拉回来</h2>
          <p className="text-muted-foreground text-sm mb-5">
            如果注意力还是在飘，用感官刺激让大脑回到当下。
            选一个你手边能做的：
          </p>
          <div className="bg-card border border-border/30 rounded-2xl p-6 mb-6 space-y-4">
            {SENSORY_OPTIONS.map(opt => (
              <label key={opt.id} className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={sensoryChecks[opt.id]}
                  onChange={() => setSensoryChecks(prev => ({ ...prev, [opt.id]: !prev[opt.id] }))}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary mt-0.5"
                />
                <div>
                  <span className={`${sensoryChecks[opt.id] ? 'line-through text-muted-foreground' : ''} transition-colors`}>
                    {opt.label}
                  </span>
                  <span className="text-xs text-muted-foreground block">{opt.desc}</span>
                </div>
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
            当注意力飘走时，回到这个感官信号。不需要"赶走"飘走的念头，只需要回到感官。
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={advance} className="w-full">
              锚定完成，继续工作
            </Button>
            <Button variant="ghost" onClick={openToolbox} className="w-full">
              🎯 打开注意力工具箱
            </Button>
            <Button variant="ghost" onClick={goBack} className="text-muted-foreground">
              ← 返回
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
