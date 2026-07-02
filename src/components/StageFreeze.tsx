'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface StageFreezeProps {
  energyLevel: 'red' | 'yellow' | 'green';
  maxLayers: number;
  onComplete: () => void;
  onRestart: () => void;
  onBackToEnergy: () => void;
  openToolbox: () => void;
}

const ENERGY_META = {
  red:    { badge: '🔴 低能量', tip: '今天已经很累了。只做最基本的——喝水、休息，就够了。' },
  yellow: { badge: '🟡 中等能量', tip: '有点累但还能做一点。先休息15分钟，再看要不要继续。' },
  green:  { badge: '🟢 高能量', tip: '有精神。休息一下恢复后，可以尝试身体启动。' },
};

export default function StageFreeze({
  energyLevel,
  maxLayers,
  onComplete,
  onRestart,
  onBackToEnergy,
  openToolbox,
}: StageFreezeProps) {
  const [layer, setLayer] = useState(1);
  const [safetyDone, setSafetyDone] = useState(false);
  const [timerState, setTimerState] = useState<'idle' | 'running' | 'done'>('idle');
  const [secondsLeft, setSecondsLeft] = useState(900);
  const [bodyChecks, setBodyChecks] = useState([false, false, false, false]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const meta = ENERGY_META[energyLevel];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = () => {
    setTimerState('running');
    setSecondsLeft(900);
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setTimerState('done');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

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

  const timerDisplay = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;
  const progressLabel = layer > 1 ? `第${layer}层 / 共${maxLayers}层` : '';

  return (
    <div className="animate-fadeIn flex flex-col gap-6">
      {/* Energy badge + layer indicator */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium px-3 py-1 rounded-full border border-border/30 bg-card">
          {meta.badge}
        </span>
        <span className="text-xs text-muted-foreground">
          🧠 僵模式{progressLabel && ` · ${progressLabel}`}
        </span>
      </div>
      <p className="text-xs text-muted-foreground -mt-4">{meta.tip}</p>

      {/* ===== Layer 1: 兜底 ===== */}
      {layer === 1 && !safetyDone && (
        <div className="animate-fadeIn text-center">
          <h2 className="text-xl font-semibold mb-4">先确认一件事——你现在安全</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            这里没有危险。你不需要做任何事。
          </p>
          <Button onClick={() => setSafetyDone(true)} className="w-full">
            我感觉这里安全了
          </Button>
        </div>
      )}

      {layer === 1 && safetyDone && (
        <div className="animate-fadeIn">
          <h2 className="text-xl font-semibold mb-4 text-center">只做最基本的事</h2>
          <div className="bg-card border border-border/30 rounded-2xl p-6 mb-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-lg w-6 text-center text-muted-foreground">①</span>
              <span>喝水</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg w-6 text-center text-muted-foreground">②</span>
              <span>休息</span>
            </div>
            <p className="text-sm text-muted-foreground pt-3 border-t border-border/20 mt-3">
              如果不想动，什么都不做也是可以的。
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={advance} className="w-full">
              我已经休息了
            </Button>
            <Button variant="ghost" onClick={goBack} className="text-muted-foreground">
              ← 返回
            </Button>
          </div>
          {maxLayers > 1 && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              恢复一点了？还有第{layer + 1}层可以选
            </p>
          )}
        </div>
      )}

      {/* ===== Layer 2: 允许+限制 ===== */}
      {layer === 2 && timerState !== 'done' && (
        <div className="animate-fadeIn text-center">
          <h2 className="text-xl font-semibold mb-4">给"暂停"设一个时间</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 text-left">
            <p className="text-sm text-blue-800">
              <strong>为什么设15分钟？</strong> 你的身体和大脑现在处于耗竭状态，强行"重启"只会增加压力。
              允许自己暂停15分钟，不是"浪费时间"——是在给神经系统一个恢复的机会。
              闹钟响了之后，做一个物理动作就够了。
            </p>
          </div>
          {timerState === 'idle' ? (
            <Button onClick={startTimer} className="w-full">
              开始15分钟倒计时
            </Button>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-card border border-border/30 rounded-2xl p-8 w-full">
                <div className="text-5xl font-light font-mono tracking-wider">{timerDisplay}</div>
                <p className="text-sm text-muted-foreground mt-3">倒计时中...</p>
                <p className="text-xs text-muted-foreground mt-2">这15分钟里，你可以什么都不做</p>
              </div>
              <Button variant="ghost" size="sm" className="text-muted-foreground"
                onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setTimerState('idle'); }}>
                取消倒计时
              </Button>
            </div>
          )}
          <Button variant="ghost" onClick={goBack} className="text-muted-foreground mt-4 w-full">
            ← 返回
          </Button>
        </div>
      )}

      {layer === 2 && timerState === 'done' && (
        <div className="animate-fadeIn text-center">
          <h2 className="text-xl font-semibold mb-4">⏰ 时间到了</h2>
          <p className="text-muted-foreground mb-8">先站起来。做一个物理动作。</p>
          <div className="flex flex-col gap-3">
            <Button onClick={advance} className="w-full">
              我站起来了
            </Button>
            <Button variant="ghost" onClick={onComplete}>
              还动不了——今天已经够了
            </Button>
          </div>
          <Button variant="ghost" onClick={goBack} className="text-muted-foreground mt-4 w-full">
            ← 返回
          </Button>
        </div>
      )}

      {/* ===== Layer 3: 身体启动 ===== */}
      {layer === 3 && (
        <div className="animate-fadeIn">
          <h2 className="text-xl font-semibold mb-4 text-center">身体先动，思维才会跟上</h2>
          <p className="text-muted-foreground mb-6 text-center text-sm">
            不急着想"接下来做什么"。按这个顺序做：
          </p>
          <div className="bg-card border border-border/30 rounded-2xl p-6 mb-6 space-y-4">
            {['站起来', '伸个懒腰', '走到另一个地方', '碰一下离你最近的东西'].map((action, i) => (
              <label key={i} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={bodyChecks[i]}
                  onChange={() => {
                    const next = [...bodyChecks];
                    next[i] = !next[i];
                    setBodyChecks(next);
                  }}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                />
                <span className={`${bodyChecks[i] ? 'line-through text-muted-foreground' : ''} transition-colors`}>
                  {action}
                </span>
              </label>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={advance} disabled={!bodyChecks.every(Boolean)} className="w-full">
              我完成身体启动了
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
