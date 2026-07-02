'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

const WORKFLOW_API = 'https://ws7jqgs82z.coze.site/run';
const WORKFLOW_TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjVmZjdiZDFhLTVmNDUtNGY4Mi04ZTg1LWQ4ZWQwNGFlN2NhNiJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbImk2OUo1U1YzTENsVDhIdU01SHVINHNQUXZJVXBubEQ4Il0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzgyOTYwNDQxLCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NjU3NzU0ODQzOTgwNzU5MDk0Iiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NjU3NzU2Nzg3NDM2NjgzMzE2In0.gX2ifvUaHb_d1r9RxqHcNNpXx99JkJonOy3RZZ2UXRsgZ-_HtIeKq-wFdmaUXQyb-gVhRTBXJm0cF_MaST2TbYto5yZhxd5MyVa1mocm5GRZ4_OsjYXgZtMwO79Hjj0eAzc5bw5dQfLv_cAFM3UpYNxgw0BJ1-J9BMB1Z5w6NXXKkCoSiF_tASLuhvB9VoCYArIm_WgCQynhHDa8IFfCq7wXw1kDgaJp2AFPYPt0jt8BZxWtElBTIyBaBK-e4VlS1xQN73pkxDOcit51MRTlY3ZtX_vl9Yzk77Pa_mUm2jOXvyQWvPPuRZWVTnzsQqMtsNHjtndM4ktCDpPwqirQGA';

interface StageFlightProps {
  energyLevel: 'red' | 'yellow' | 'green';
  maxLayers: number;
  onComplete: () => void;
  onRestart: () => void;
  onBackToEnergy: () => void;
  openToolbox: () => void;
}

interface AIAnalysisResult {
  category: string;
  categoryReason: string;
  topPriority: string;
  minimalAction: {
    action: string;
    duration: string;
    motivation: string;
    howToStart: string;
  };
  alternativeActions: string[];
  energyNote: string;
}

const ENERGY_META = {
  red:    { badge: '🔴 低能量', tip: '把脑子里的想法写出来，然后挑一件最小的碰一下，就够了。' },
  yellow: { badge: '🟡 中等能量', tip: '写下来 → AI分析 → 开始行动。让AI帮你拆第一步。' },
  green:  { badge: '🟢 高能量', tip: '完整流程：写想法 → AI分析分类 → 计时行动 → 碰一下。' },
};

const QUADRANTS = [
  { id: 'urgent_important', emoji: '🔥', label: '重要且紧急', desc: '现在不做会出事' },
  { id: 'important_not_urgent', emoji: '📌', label: '重要不紧急', desc: '对你长期有价值' },
  { id: 'urgent_not_important', emoji: '📞', label: '紧急不重要', desc: '可以交给别人' },
  { id: 'not_urgent_not_important', emoji: '🗑️', label: '不重要不紧急', desc: '可以删掉' },
];

function parseDuration(duration: string): number {
  const match = duration.match(/(\d+)/);
  return match ? Math.max(1, parseInt(match[1])) : 2;
}

export default function StageFlight({
  energyLevel,
  maxLayers,
  onComplete,
  onRestart,
  onBackToEnergy,
  openToolbox,
}: StageFlightProps) {
  const [layer, setLayer] = useState(1);
  const [timerState, setTimerState] = useState<'idle' | 'running' | 'done'>('idle');
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [thoughts, setThoughts] = useState('');
  const [quadrant, setQuadrant] = useState<string | null>(null);
  const [targetAction, setTargetAction] = useState('');
  const [touchedDone, setTouchedDone] = useState(false);

  // AI workflow states
  const [aiState, setAiState] = useState<'idle' | 'loading' | 'result' | 'acting'>('idle');
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [actionSecondsLeft, setActionSecondsLeft] = useState(0);
  const [actionTimerDone, setActionTimerDone] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showNewThought, setShowNewThought] = useState(false);
  const [newThoughtText, setNewThoughtText] = useState('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const actionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const meta = ENERGY_META[energyLevel];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (actionTimerRef.current) clearInterval(actionTimerRef.current);
    };
  }, []);

  const startTimer = () => {
    setTimerState('running');
    setSecondsLeft(300);
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

  // ===== AI Workflow =====
  const callAI = async (thoughtText: string) => {
    setAiState('loading');
    setAiError(null);
    setAiResult(null);
    try {
      const res = await fetch(WORKFLOW_API, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WORKFLOW_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_thoughts: thoughtText,
          energy_level: energyLevel,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`API ${res.status}: ${err.slice(0, 100)}`);
      }

      const text = await res.text();
      const data = JSON.parse(text);
      // result 是字符串，需要二次解析
      const result: AIAnalysisResult = typeof data.result === 'string'
        ? JSON.parse(data.result)
        : data.result;

      setAiResult(result);
      setAiState('result');
    } catch (e: any) {
      console.error('AI workflow error:', e);
      setAiError(e.message || '请求失败，请稍后重试');
      setAiState('idle');
    }
  };

  const startAction = () => {
    if (!aiResult) return;
    setAiState('acting');
    setActionTimerDone(false);
    const minutes = parseDuration(aiResult.minimalAction.duration);
    setActionSecondsLeft(minutes * 60);

    actionTimerRef.current = setInterval(() => {
      setActionSecondsLeft(prev => {
        if (prev <= 1) {
          if (actionTimerRef.current) clearInterval(actionTimerRef.current);
          setActionTimerDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleNewThought = () => {
    if (actionTimerRef.current) clearInterval(actionTimerRef.current);
    setShowNewThought(true);
    setAiState('idle');
  };

  const submitNewThought = () => {
    if (newThoughtText.trim()) {
      setThoughts(prev => prev + '\n' + newThoughtText.trim());
      setShowNewThought(false);
      setNewThoughtText('');
      callAI(newThoughtText.trim());
    }
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const progressLabel = layer > 1 ? `第${layer}层 / 共${maxLayers}层` : '';

  return (
    <div className="animate-fadeIn flex flex-col gap-6">
      {/* Energy badge + layer indicator */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium px-3 py-1 rounded-full border border-border/30 bg-card">
          {meta.badge}
        </span>
        <span className="text-xs text-muted-foreground">
          🏔️ 重要的事一直拖{progressLabel && ` · ${progressLabel}`}
        </span>
      </div>
      <p className="text-xs text-muted-foreground -mt-4">{meta.tip}</p>

      {/* ===== Layer 1: 5分钟上限 + 身体软着陆 + 想法输出 ===== */}
      {layer === 1 && (
        <div className="animate-fadeIn">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-5">
            <p className="text-sm text-blue-800">
              <strong>先做一个身体软着陆：</strong>站起来，走两步，深呼吸3次。
              <br />
              身体先动，大脑才会跟着动。
            </p>
          </div>

          <h2 className="text-xl font-semibold mb-2">把脑子里的事情写下来</h2>
          <p className="text-muted-foreground text-sm mb-4">
            设一个5分钟闹钟。在这5分钟里，把脑子里在想的、在担心的、在准备的事情都写出来。
            <br />
            不需要整理，不需要分类，写下来就行。
          </p>

          {timerState === 'idle' ? (
            <Button onClick={startTimer} variant="outline" className="w-full mb-4">
              开始5分钟倒计时
            </Button>
          ) : timerState === 'running' ? (
            <div className="flex items-center justify-between bg-card border border-border/30 rounded-xl px-4 py-3 mb-4">
              <span className="text-sm text-muted-foreground">倒计时</span>
              <span className="text-2xl font-mono font-light tracking-wider">{formatTime(secondsLeft)}</span>
              <Button variant="ghost" size="sm" className="text-muted-foreground"
                onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setTimerState('idle'); }}>
                取消
              </Button>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-center">
              <p className="text-sm text-amber-800 font-medium">⏰ 时间到了</p>
              <p className="text-xs text-amber-700">还没写完也没关系，写多少算多少</p>
            </div>
          )}

          <div className="bg-card border border-border/30 rounded-2xl p-5 mb-5">
            <textarea
              value={thoughts}
              onChange={e => setThoughts(e.target.value)}
              placeholder="我现在脑子里在想的是..."
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {thoughts.length > 0 ? `已写 ${thoughts.length} 字` : '写什么都行，不用管逻辑'}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={() => advance()}
              disabled={!thoughts.trim()} className="w-full">
              写下来了，继续
            </Button>
            <Button variant="ghost" onClick={goBack} className="text-muted-foreground">
              ← 返回
            </Button>
          </div>
        </div>
      )}

      {/* ===== Layer 2: 四象限 + AI分析 + 行动循环 ===== */}
      {layer === 2 && (
        <div className="animate-fadeIn">
          <h2 className="text-xl font-semibold mb-2">
            {aiState === 'acting' ? '👟 正在行动' :
             aiState === 'result' ? '🤖 AI分析结果' :
             '把写下来的事情分个类'}
          </h2>

          {/* Show original thoughts summary unless acting */}
          {aiState !== 'acting' && (
            <p className="text-muted-foreground text-sm mb-5">
              你写了：<span className="text-foreground">"{thoughts.slice(0, 80)}{thoughts.length > 80 ? '...' : ''}"</span>
            </p>
          )}

          {/* ===== AI State: idle — show quadrants + AI button ===== */}
          {aiState === 'idle' && !showNewThought && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {QUADRANTS.map(q => (
                  <button
                    key={q.id}
                    onClick={() => setQuadrant(q.id)}
                    className={`p-4 rounded-xl border text-left transition-all hover:shadow-sm active:scale-[0.98] ${
                      quadrant === q.id
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className="text-lg mb-1">{q.emoji}</div>
                    <div className="font-medium text-sm">{q.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{q.desc}</div>
                  </button>
                ))}
              </div>

              {energyLevel !== 'red' && (
                <div className="bg-card border border-border/30 rounded-2xl p-4 mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">🤖</span>
                    <span className="text-sm font-medium">让AI帮你分析</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    AI会根据你的想法做四象限分类，并按福格行为模型给出最小行动建议。
                    <br />
                    然后你可以直接在页面里开始行动，有计时器跟着。
                  </p>
                  <Button size="sm" onClick={() => callAI(thoughts)} className="w-full">
                    🚀 AI分析并给出建议
                  </Button>
                </div>
              )}

              {aiError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5">
                  <p className="text-sm text-red-700">{aiError}</p>
                  <Button variant="ghost" size="sm" onClick={() => callAI(thoughts)} className="text-red-600 mt-1">
                    重试
                  </Button>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button onClick={advance} className="w-full" disabled={!quadrant}>
                  已分类，继续
                </Button>
                <Button variant="ghost" onClick={advance} className="text-muted-foreground text-xs">
                  跳过分类也行
                </Button>
                <Button variant="ghost" onClick={goBack} className="text-muted-foreground">
                  ← 返回
                </Button>
              </div>
            </>
          )}

          {/* ===== AI State: loading ===== */}
          {aiState === 'loading' && (
            <div className="text-center py-12">
              <div className="animate-spin text-4xl mb-4">⏳</div>
              <p className="text-muted-foreground text-sm">AI正在分析你的想法...</p>
              <p className="text-xs text-muted-foreground mt-2">按四象限分类 + 设计最小行动</p>
            </div>
          )}

          {/* ===== AI State: result — show analysis ===== */}
          {aiState === 'result' && aiResult && (
            <div className="space-y-4">
              {/* Category card */}
              <div className="bg-card border-2 border-primary/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">
                    {aiResult.category === '重要且紧急' ? '🔥' :
                     aiResult.category === '重要不紧急' ? '📌' :
                     aiResult.category === '紧急不重要' ? '📞' : '🗑️'}
                  </span>
                  <span className="font-semibold">{aiResult.category}</span>
                </div>
                <p className="text-sm text-muted-foreground">{aiResult.categoryReason}</p>
              </div>

              {/* Priority */}
              <div className="bg-card border border-border/30 rounded-2xl p-5">
                <p className="text-xs text-muted-foreground mb-1">优先事项</p>
                <p className="font-medium">{aiResult.topPriority}</p>
              </div>

              {/* Minimal action */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
                <p className="text-xs text-muted-foreground mb-1">最小行动</p>
                <p className="text-lg font-semibold mb-2">{aiResult.minimalAction.action}</p>
                <p className="text-sm text-muted-foreground mb-1">{aiResult.minimalAction.motivation}</p>
                <p className="text-xs text-muted-foreground">
                  ⏱ {aiResult.minimalAction.duration}
                </p>
              </div>

              {/* How to start */}
              <div className="bg-card border border-border/30 rounded-2xl p-5">
                <p className="text-xs text-muted-foreground mb-1">启动指令</p>
                <p className="text-sm">{aiResult.minimalAction.howToStart}</p>
              </div>

              {/* Alternative actions */}
              {aiResult.alternativeActions.length > 0 && (
                <div className="bg-card border border-border/30 rounded-2xl p-5">
                  <p className="text-xs text-muted-foreground mb-2">备选方案（如果动不了）</p>
                  <ul className="space-y-1">
                    {aiResult.alternativeActions.map((alt, i) => (
                      <li key={i} className="text-sm">• {alt}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Energy note */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
                <p className="text-xs text-amber-800">{aiResult.energyNote}</p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <Button onClick={startAction} className="w-full text-base py-6">
                  🎯 开始行动 — {aiResult.minimalAction.duration}
                </Button>
                <Button variant="ghost" onClick={advance} className="text-muted-foreground">
                  先不行动，去碰一下
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setAiState('idle')} className="text-muted-foreground flex-1">
                    ← 返回分类
                  </Button>
                  <Button variant="ghost" size="sm" onClick={goBack} className="text-muted-foreground flex-1">
                    ← 返回
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ===== AI State: acting — timer + action loop ===== */}
          {aiState === 'acting' && aiResult && !showNewThought && (
            <div className="text-center space-y-5">
              {/* Action text */}
              <div className="bg-primary/5 border-2 border-primary/30 rounded-2xl p-6">
                <p className="text-sm text-muted-foreground mb-1">现在做这个：</p>
                <p className="text-xl font-semibold mb-3">{aiResult.minimalAction.action}</p>
                <p className="text-sm text-muted-foreground">{aiResult.minimalAction.motivation}</p>
              </div>

              {/* Timer */}
              <div className={`rounded-2xl p-6 ${actionTimerDone ? 'bg-green-50 border border-green-200' : 'bg-card border border-border/30'}`}>
                {!actionTimerDone ? (
                  <>
                    <div className="text-6xl font-light font-mono tracking-wider mb-2">
                      {formatTime(actionSecondsLeft)}
                    </div>
                    <p className="text-sm text-muted-foreground">倒计时中... 专注做上面那件事</p>
                  </>
                ) : (
                  <>
                    <div className="text-4xl mb-2">✅</div>
                    <p className="text-lg font-medium text-green-700 mb-1">时间到！</p>
                    <p className="text-sm text-green-600">
                      你已经行动了{aiResult.minimalAction.duration}，这就是成果。
                    </p>
                  </>
                )}
              </div>

              {/* Action buttons during/after timer */}
              <div className="flex flex-col gap-2">
                {!actionTimerDone ? (
                  <>
                    <Button variant="outline" onClick={handleNewThought} className="w-full">
                      💭 有新想法冒出来了
                    </Button>
                    <Button variant="ghost" onClick={() => {
                      if (actionTimerRef.current) clearInterval(actionTimerRef.current);
                      setActionTimerDone(true);
                    }} className="text-muted-foreground">
                      提前完成
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={advance} className="w-full">
                      碰一下，完成这个回合 →
                    </Button>
                    <Button variant="outline" onClick={handleNewThought} className="w-full">
                      💭 还有新想法，再分析一次
                    </Button>
                  </>
                )}
                <Button variant="ghost" onClick={goBack} className="text-muted-foreground">
                  ← 返回
                </Button>
              </div>
            </div>
          )}

          {/* ===== New thought input ===== */}
          {showNewThought && (
            <div className="animate-fadeIn space-y-4">
              <div className="bg-card border border-border/30 rounded-2xl p-5">
                <p className="text-sm font-medium mb-3">把新想法写下来：</p>
                <textarea
                  value={newThoughtText}
                  onChange={e => setNewThoughtText(e.target.value)}
                  placeholder="刚冒出来的新念头是..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={submitNewThought} disabled={!newThoughtText.trim()} className="flex-1">
                  让AI重新分析
                </Button>
                <Button variant="ghost" onClick={() => { setShowNewThought(false); setAiState('acting'); }} className="text-muted-foreground">
                  取消
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== Layer 3: 碰一下（最终动作） ===== */}
      {layer === 3 && !touchedDone && (
        <div className="animate-fadeIn">
          {/* Show AI suggestion if available */}
          {aiResult && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-5">
              <p className="text-xs text-muted-foreground mb-1">AI建议你碰这个：</p>
              <p className="font-medium">{aiResult.minimalAction.action}</p>
            </div>
          )}

          <h2 className="text-xl font-semibold mb-4">不需要做什么，只需要碰一下</h2>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            你已经写下来了，也分析过了。现在选一件最小的事——只碰一下。
            <br />
            打开文档、点开编辑器、拿起手机——就碰一下。
          </p>
          <div className="bg-card border border-border/30 rounded-2xl p-5 mb-6">
            <input
              type="text"
              value={targetAction}
              onChange={e => setTargetAction(e.target.value)}
              placeholder={aiResult ? aiResult.minimalAction.action : "我要碰的是..."}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              onKeyDown={e => {
                if (e.key === 'Enter' && targetAction.trim()) setTouchedDone(true);
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={() => setTouchedDone(true)} disabled={!targetAction.trim()} className="w-full">
              碰了它了
            </Button>
            <Button variant="ghost" onClick={goBack} className="text-muted-foreground">
              ← 返回
            </Button>
          </div>
        </div>
      )}

      {layer === 3 && touchedDone && (
        <div className="animate-fadeIn text-center">
          <div className="bg-card border border-border/30 rounded-2xl p-6 mb-6">
            <div className="text-3xl mb-3">👏</div>
            <p className="text-muted-foreground mb-4">
              如果碰完之后觉得还可以继续一点——就继续。
              <br />
              如果不行，碰一下本身就是今天的成果。
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={advance} className="w-full">
              完成
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
