'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface StageSelfBlameProps {
  energyLevel: 'red' | 'yellow' | 'green';
  maxLayers: number;
  onComplete: () => void;
  onRestart: () => void;
  onBackToEnergy: () => void;
  openToolbox: () => void;
}

const ENERGY_META = {
  red:    { badge: '🔴 低能量', tip: '今天很累了。赦免自己，然后关机上床。明天会不一样。' },
  yellow: { badge: '🟡 中等能量', tip: '有些累，但可以记录一件今天做成的事。' },
  green:  { badge: '🟢 高能量', tip: '精力还可以。走完关机仪式，给今天一个明确的结束。' },
};

export default function StageSelfBlame({
  energyLevel,
  maxLayers,
  onComplete,
  onRestart,
  onBackToEnergy,
  openToolbox,
}: StageSelfBlameProps) {
  const [layer, setLayer] = useState(1);
  const [pardonAccepted, setPardonAccepted] = useState(false);
  const [showPeerQuestion, setShowPeerQuestion] = useState(false);
  const [microCompletion, setMicroCompletion] = useState('');
  const [microSaved, setMicroSaved] = useState(false);
  const [cantThink, setCantThink] = useState(false);
  const [tomorrowAction, setTomorrowAction] = useState('');
  const [shutdownDone, setShutdownDone] = useState(false);
  const meta = ENERGY_META[energyLevel];

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

  const saveMicroCompletion = () => {
    if (microCompletion.trim()) {
      try {
        const existing = JSON.parse(localStorage.getItem('cptsd_app_state') || '{}');
        const completions = existing.microCompletions || [];
        completions.push({
          date: new Date().toISOString().split('T')[0],
          content: microCompletion.trim(),
          stage: 'self_blame',
        });
        existing.microCompletions = completions;
        localStorage.setItem('cptsd_app_state', JSON.stringify(existing));
      } catch (e) {
        // localStorage unavailable
      }
    }
    setMicroSaved(true);
  };

  const progressLabel = layer > 1 ? `第${layer}层 / 共${maxLayers}层` : '';

  return (
    <div className="animate-fadeIn flex flex-col gap-6">
      {/* Energy badge + layer indicator */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium px-3 py-1 rounded-full border border-border/30 bg-card">
          {meta.badge}
        </span>
        <span className="text-xs text-muted-foreground">
          🌙 今天又废了{progressLabel && ` · ${progressLabel}`}
        </span>
      </div>
      <p className="text-xs text-muted-foreground -mt-4">{meta.tip}</p>

      {/* ===== Layer 1: 赦免 ===== */}
      {layer === 1 && !pardonAccepted && (
        <div className="animate-fadeIn text-center">
          <div className="bg-card border border-primary/20 rounded-2xl p-8 mb-6">
            <h2 className="text-xl font-semibold mb-4">先停一下——你不需要"挽回"今天</h2>
            <div className="bg-primary/5 rounded-xl p-5 mb-4">
              <p className="text-sm leading-relaxed">
                鉴于我今天的状态（
                {energyLevel === 'red' ? '🔴 红灯' : energyLevel === 'yellow' ? '🟡 黄灯' : '🟢 绿灯'}
                ），
                <br />
                我已经做了我能做的。
                <br />
                <strong>这不是借口，是事实。</strong>
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => setPardonAccepted(true)} className="w-full">
                我接受了
              </Button>
              <Button variant="ghost" onClick={() => setShowPeerQuestion(true)} className="text-muted-foreground">
                不接受
              </Button>
            </div>
          </div>

          {showPeerQuestion && (
            <div className="animate-fadeIn mt-4">
              <div className="bg-card border border-border/30 rounded-2xl p-5 mb-4">
                <p className="text-sm text-muted-foreground">
                  那换个问题：如果朋友今天做了同样的事，你会说"这不算什么"吗？
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={() => setPardonAccepted(true)} className="w-full">
                  我不会对朋友这么说
                </Button>
                <Button variant="ghost" onClick={goBack} className="text-muted-foreground">
                  ← 返回
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {layer === 1 && pardonAccepted && (
        <div className="animate-fadeIn text-center">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6">
            <p className="text-sm text-green-800">
              赦免不是"算了吧"，是承认今天的事实。
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={advance} className="w-full">
              继续
            </Button>
            <Button variant="ghost" onClick={goBack} className="text-muted-foreground">
              ← 返回
            </Button>
          </div>
        </div>
      )}

      {/* ===== Layer 2: 微完成记录 ===== */}
      {layer === 2 && !microSaved && (
        <div className="animate-fadeIn">
          <h2 className="text-xl font-semibold mb-4">今天做成的一件事（任何事都算）</h2>
          <p className="text-muted-foreground text-sm mb-6">
            标准降到极低——打开文档写了一个标题、回了一条消息、坚持了15分钟后站起来……
          </p>
          {!cantThink ? (
            <>
              <div className="bg-card border border-border/30 rounded-2xl p-5 mb-6">
                <input
                  type="text"
                  value={microCompletion}
                  onChange={e => setMicroCompletion(e.target.value)}
                  placeholder="今天我做成了..."
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && microCompletion.trim()) saveMicroCompletion();
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={saveMicroCompletion} disabled={!microCompletion.trim()} className="w-full">
                  保存记录
                </Button>
                <Button variant="ghost" onClick={() => setCantThink(true)} className="text-muted-foreground">
                  确实想不到
                </Button>
                <Button variant="ghost" onClick={goBack} className="text-muted-foreground">
                  ← 返回
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-card border border-border/30 rounded-2xl p-6">
                <p className="text-sm text-muted-foreground">
                  那记得今天累了。累了本身就是信息——你的身体在告诉你需要恢复。
                </p>
              </div>
              <Button variant="ghost" onClick={goBack} className="text-muted-foreground w-full">
                ← 返回
              </Button>
            </div>
          )}
        </div>
      )}

      {layer === 2 && microSaved && (
        <div className="animate-fadeIn text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6">
            <p className="text-sm text-blue-800">
              记下来了。明天如果内在批判者说"你昨天什么都没做"——翻出这条记录。
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={advance} className="w-full">
              继续
            </Button>
            <Button variant="ghost" onClick={goBack} className="text-muted-foreground">
              ← 返回
            </Button>
          </div>
        </div>
      )}

      {layer === 2 && cantThink && !microSaved && (
        <div className="flex flex-col gap-2">
          <Button onClick={advance} className="w-full">
            继续
          </Button>
          <Button variant="ghost" onClick={goBack} className="text-muted-foreground">
            ← 返回
          </Button>
        </div>
      )}

      {/* ===== Layer 3: 不推翻今天 ===== */}
      {layer === 3 && (
        <div className="animate-fadeIn text-center">
          <h2 className="text-xl font-semibold mb-4">明天不要从0开始</h2>
          <div className="bg-card border border-border/30 rounded-2xl p-6 mb-6 text-left">
            <p className="text-sm leading-relaxed">
              如果你今天写了一些东西、做了一些进展——
              <br />
              不要用"明天重新开始"推翻它们。
            </p>
            <div className="bg-primary/5 rounded-xl p-4 mt-4 text-sm">
              "今天写的东西有60分，明天在60分基础上改到70分。
              <br />
              不是从0开始。"
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={advance} className="w-full">
              我记住了
            </Button>
            <Button variant="ghost" onClick={goBack} className="text-muted-foreground">
              ← 返回
            </Button>
          </div>
        </div>
      )}

      {/* ===== Layer 4: 关机仪式 ===== */}
      {layer === 4 && !shutdownDone && (
        <div className="animate-fadeIn">
          <h2 className="text-xl font-semibold mb-4 text-center">给今天画一个句号</h2>
          <div className="bg-card border border-border/30 rounded-2xl p-6 mb-6 space-y-5">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">1</span>
                <span className="text-sm font-medium">写下明天第一件要做的事</span>
              </div>
              <p className="text-xs text-muted-foreground ml-9 mb-2">一个物理动作，不是一个脑力任务</p>
              <input
                type="text"
                value={tomorrowAction}
                onChange={e => setTomorrowAction(e.target.value)}
                placeholder="明天第一件事..."
                className="ml-9 w-[calc(100%-36px)] px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                onKeyDown={e => {
                  if (e.key === 'Enter' && tomorrowAction.trim()) { setShutdownDone(true); advance(); }
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">2</span>
                <span className="text-sm font-medium">做3次深呼吸</span>
              </div>
              <p className="text-xs text-muted-foreground ml-9">吸——呼——吸——呼——吸——呼</p>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">3</span>
                <span className="text-sm font-medium">关机提醒</span>
              </div>
              <p className="text-xs text-muted-foreground ml-9">到点关灯。睡不着就躺着，不碰手机。</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={() => { setShutdownDone(true); advance(); }}
              disabled={!tomorrowAction.trim()} className="w-full">
              关机仪式完成，可以睡了
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
