'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

interface FullModeProps {
  energyLevel: 'red' | 'yellow' | 'green';
  onComplete: () => void;
  onRestart: () => void;
  updateCPTSDState?: (state: Record<string, unknown>) => void;
}

type FullStep = 0 | 1 | 2 | 3 | 4 | 5;
type StuckType = 'new_thought' | 'body_frozen' | 'time_energy' | null;

interface DiagnosisResult {
  action: string;
  willing: boolean | null;
  enough: boolean | null;
  result: 'keep' | 'simplify' | 'delete' | 'postpone' | null;
}

export default function FullMode({ energyLevel, onComplete, onRestart, updateCPTSDState }: FullModeProps) {
  const [step, setStep] = useState<FullStep>(0);
  const [task, setTask] = useState('');
  const [fear, setFear] = useState('');
  const [showRSDCard, setShowRSDCard] = useState(false);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [preparationActions, setPreparationActions] = useState<string[]>(['']);
  const [selectedPreparations, setSelectedPreparations] = useState<string[]>([]);
  const [diagnosisResults, setDiagnosisResults] = useState<DiagnosisResult[]>([]);
  const [currentDiagnosisIndex, setCurrentDiagnosisIndex] = useState(0);
  const [sensoryInputs, setSensoryInputs] = useState({ sounds: '', colors: '', objects: '' });
  const [warmupAction, setWarmupAction] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [actionContent, setActionContent] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [showStuckModal, setShowStuckModal] = useState(false);
  const [expectation, setExpectation] = useState('');
  const [actual, setActual] = useState('');
  const [stuckType, setStuckType] = useState<StuckType>(null);

  // Red light substeps
  const [redSubStep, setRedSubStep] = useState(0);
  const [redCritique, setRedCritique] = useState('');
  // Yellow light substeps
  const [yellowSubStep, setYellowSubStep] = useState(0);
  const [yellowDuration, setYellowDuration] = useState<2 | 5>(5);
  const [yellowAction, setYellowAction] = useState('');

  const rsdKeywords = ['被否定', '被拒绝', '被嘲笑', '被批评', '没人看', '没人回', '被忽略', '被冷落', '被讨厌'];
  const fearKeywords = ['被否定', '被拒绝', '被嘲笑', '被批评', '没人看', '没人回', '被忽略', '被冷落', '不够好', '会失败', '做不到'];

  // RSD detection
  useEffect(() => {
    setShowRSDCard(rsdKeywords.some(k => fear.includes(k)));
  }, [fear]);

  // AI prompt detection
  useEffect(() => {
    setShowAIPrompt(fearKeywords.some(k => fear.includes(k)));
  }, [fear]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Sync state to localStorage
  const syncState = useCallback((updates: Record<string, unknown>) => {
    if (updateCPTSDState) {
      updateCPTSDState({ energyLevel, currentStep: `step${step}`, ...updates });
    }
  }, [energyLevel, step, updateCPTSDState]);

  // Trigger AI chat SDK
  const triggerAI = useCallback((message?: string) => {
    const event = new CustomEvent('openChatSDK', {
      detail: { initialMessage: message || `能量状态：${energyLevel}灯。${fear ? '恐惧内容：' + fear : ''}请帮我识别和驳斥内在批判者。` }
    });
    window.dispatchEvent(event);
  }, [energyLevel, fear]);

  // Set default time window
  const setDefaultTimeWindow = useCallback(() => {
    const now = new Date();
    const start = now.toTimeString().slice(0, 5);
    now.setMinutes(now.getMinutes() + 30);
    const end = now.toTimeString().slice(0, 5);
    setStartTime(start);
    setEndTime(end);
    const durationMinutes = 30;
    setCountdown(durationMinutes * 60);
  }, []);

  // Step label helper
  const getStepLabel = () => {
    if (energyLevel === 'red') {
      return `红灯 · ${redSubStep + 1}/3`;
    }
    if (energyLevel === 'yellow') {
      return `黄灯 · H${yellowSubStep + 1}/5`;
    }
    return `步骤 ${step + 1}/7`;
  };

  const getStepName = () => {
    if (energyLevel === 'red') {
      return ['身体信号确认', 'AI驳斥批判者', '最小休息动作'][redSubStep] || '';
    }
    if (energyLevel === 'yellow') {
      return ['身体介入', 'AI驳斥批判者', '能量分配', '微动作执行', '快速收束'][yellowSubStep] || '';
    }
    return ['感官着陆', '锁定目标+恐惧', '写准备动作', '四象限诊断', '行动启动', '复盘'][step] || '';
  };

  const maxSteps = energyLevel === 'red' ? 3 : energyLevel === 'yellow' ? 5 : 6;
  const currentProgress = energyLevel === 'red' ? redSubStep : energyLevel === 'yellow' ? yellowSubStep : step;

  const canGoNext = () => {
    if (energyLevel === 'red') {
      if (redSubStep === 1) return redCritique.trim().length > 0;
      return true;
    }
    if (energyLevel === 'yellow') {
      if (yellowSubStep === 2) return true;
      if (yellowSubStep === 3) return yellowAction.trim().length > 0;
      return true;
    }
    if (step === 0) return true;
    if (step === 1) return task.trim().length > 0 && fear.trim().length > 0;
    if (step === 2) return preparationActions.some(a => a.trim());
    if (step === 3) return currentDiagnosisIndex >= (selectedPreparations.length || preparationActions.filter(a => a.trim()).length);
    if (step === 4) return startTime && endTime && actionContent.trim();
    return true;
  };

  const goNext = () => {
    if (energyLevel === 'red') {
      if (redSubStep < 2) {
        setRedSubStep(s => s + 1);
        if (redSubStep === 1) {
          triggerAI(`我刚写下了脑子里最响的自我批评：${redCritique}。我现在的能量是红灯。请帮我识别这是不是内在批判者在说话，帮我驳斥它。`);
        }
      } else {
        onComplete();
      }
      return;
    }
    if (energyLevel === 'yellow') {
      if (yellowSubStep < 4) {
        if (yellowSubStep === 1) {
          triggerAI(`用户当前能量：黄灯。请帮用户识别和驳斥内在批判者。`);
        }
        if (yellowSubStep === 2) {
          setCountdown(yellowDuration * 60);
        }
        setYellowSubStep(s => s + 1);
      } else {
        onComplete();
      }
      return;
    }
    if (step < 5) {
      if (step === 1) {
        syncState({ targetAction: task, fearContent: fear });
      }
      if (step === 3) {
        setDefaultTimeWindow();
        const summary = diagnosisResults
          .filter(d => d.result === 'keep')
          .map(d => d.action)
          .join('；');
        setActionContent(summary || task);
      }
      setStep(s => (s + 1) as FullStep);
    } else {
      saveEvidence();
      onComplete();
    }
  };

  const goBack = () => {
    if (energyLevel === 'red') {
      if (redSubStep > 0) setRedSubStep(s => s - 1);
      return;
    }
    if (energyLevel === 'yellow') {
      if (yellowSubStep > 0) setYellowSubStep(s => s - 1);
      return;
    }
    if (step > 0) setStep(s => (s - 1) as FullStep);
  };

  // Handle stuck button
  const handleStuck = (type: StuckType) => {
    setStuckType(type);
    if (type === 'body_frozen') {
      // Show body intervention options inline
    } else if (type === 'new_thought') {
      // Offer AI or self-diagnosis
    } else if (type === 'time_energy') {
      // Show time/energy assessment
    }
  };

  // Save evidence log
  const saveEvidence = () => {
    const state = JSON.parse(localStorage.getItem('cptsd_app_state') || '{}');
    const evidenceLog = state.evidenceLog || [];
    const totalActions = (state.totalActions || 0) + 1;
    let result: 'better' | 'same' | 'worse' = 'same';
    if (expectation && actual) {
      const e = expectation.toLowerCase();
      const a = actual.toLowerCase();
      if (['好', '不错', '顺利', '超出', '更好'].some(w => a.includes(w) && !e.includes(w))) {
        result = 'better';
      } else if (['差', '不好', '失败', '不如'].some(w => a.includes(w))) {
        result = 'worse';
      }
    }
    const brainLiedCount = (state.brainLiedCount || 0) + (result === 'better' ? 1 : 0);
    evidenceLog.push({
      date: new Date().toISOString().slice(0, 10),
      expected: expectation,
      actual: actual,
      result,
    });
    const newState = { ...state, evidenceLog, totalActions, brainLiedCount, energyLevel };
    localStorage.setItem('cptsd_app_state', JSON.stringify(newState));
  };

  // Get review card style
  const getReviewCard = () => {
    const state = JSON.parse(localStorage.getItem('cptsd_app_state') || '{}');
    const evidenceLog = state.evidenceLog || [];
    const totalActions = state.totalActions || 0;
    const brainLiedCount = state.brainLiedCount || 0;
    const lastEntry = evidenceLog[evidenceLog.length - 1];
    const result = lastEntry?.result || 'same';

    if (result === 'better') {
      return {
        bg: 'bg-green-50 border-green-200',
        text: `大脑骗了你！你之前${totalActions}次行动，${brainLiedCount}次结果都比预期好。你的大脑${Math.round(brainLiedCount / Math.max(totalActions, 1) * 100)}%的时候都在骗你。`,
      };
    }
    if (result === 'worse') {
      return {
        bg: 'bg-amber-50 border-amber-200',
        text: '结果不如预期。但天没有塌。你得到了一个可以改进的点。',
      };
    }
    return {
      bg: 'bg-blue-50 border-blue-200',
      text: '和你想的差不多。但你已经处理了。你比你以为的更有能力。',
    };
  };

  // ===== RENDER: Red Light Flow =====
  if (energyLevel === 'red') {
    return (
      <div className="animate-fadeIn flex flex-col gap-4 max-w-md mx-auto px-4 pt-4 pb-24">
        {/* Step Navigation */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm -mx-4 px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{getStepLabel()} · {getStepName()}</span>
            <button onClick={onRestart} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ⏮ 重新开始
            </button>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={cn(
              'w-3 h-3 rounded-full transition-all duration-300',
              i <= redSubStep ? 'bg-primary scale-100' : 'bg-muted scale-75'
            )} />
          ))}
        </div>

        {/* R1: Body signal check */}
        {redSubStep === 0 && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <h2 className="text-xl font-semibold">先感受一下你现在的身体</h2>
            <p className="text-muted-foreground">你的神经系统现在需要休息，不是push。</p>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-3"><span className="text-lg">💪</span>肩膀是紧的还是松的？</div>
              <div className="flex items-center gap-3"><span className="text-lg">🤚</span>手是冷的还是热的？</div>
              <div className="flex items-center gap-3"><span className="text-lg">🌬</span>呼吸是浅的还是深的？</div>
            </div>
            <p className="text-xs text-muted-foreground italic">不需要填空，只是感受一下。感觉到了就继续。</p>
          </div>
        )}

        {/* R2: AI refute critic */}
        {redSubStep === 1 && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <h2 className="text-xl font-semibold">让疗愈助手帮帮你</h2>
            <p className="text-muted-foreground">红灯的时候，内在批判者通常最响——"你又什么都没做""你就是不行"。这不是你的声音，是创伤程序在说话。</p>
            <div className="space-y-3">
              <label className="text-sm font-medium">你脑子里最响的那句自我批评是什么？</label>
              <Input
                value={redCritique}
                onChange={(e) => setRedCritique(e.target.value)}
                placeholder="比如：'我又在浪费时间'"
                className="h-14 text-base"
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              💡 这种感觉有名字：<strong>内在批判者</strong>。它不是事实，是大脑的过度保护程序。
            </div>
            {redCritique.trim() && (
              <Button variant="outline" className="w-full" onClick={() => triggerAI(`我刚写下了脑子里最响的自我批评：${redCritique}。我现在的能量是红灯。请帮我识别这是不是内在批判者在说话，帮我驳斥它。`)}>
                💬 告诉疗愈助手
              </Button>
            )}
          </div>
        )}

        {/* R3: Minimal rest */}
        {redSubStep === 2 && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <h2 className="text-xl font-semibold">选择你的休息方式</h2>
            <div className="space-y-3">
              <Button variant="outline" className="w-full h-16 justify-start gap-3 text-base" onClick={onComplete}>
                <span className="text-2xl">🧊</span> 做一个身体重置（冰块贴脸或冷水洗脸）
              </Button>
              <Button variant="outline" className="w-full h-16 justify-start gap-3 text-base" onClick={onComplete}>
                <span className="text-2xl">🌙</span> 我就是需要休息
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">休息也是行动。你不必证明自己"配休息"。</p>
          </div>
        )}

        {/* Bottom navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 z-10">
          <div className="max-w-md mx-auto flex gap-3">
            {redSubStep > 0 && (
              <Button variant="outline" className="flex-1 h-14" onClick={goBack}>
                ← 上一步
              </Button>
            )}
            <Button className="flex-1 h-14 text-base" onClick={goNext} disabled={!canGoNext()}>
              {redSubStep === 2 ? '完成' : '下一步 →'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">⚠️ 这不是心理咨询。你随时可以停下来。</p>
        </div>
      </div>
    );
  }

  // ===== RENDER: Yellow Light Flow =====
  if (energyLevel === 'yellow') {
    return (
      <div className="animate-fadeIn flex flex-col gap-6 max-w-md mx-auto px-4 pt-12 pb-24">
        {/* Step Navigation */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm -mx-4 px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{getStepLabel()} · {getStepName()}</span>
            <button onClick={onRestart} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ⏮ 重新开始
            </button>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={cn(
              'w-3 h-3 rounded-full transition-all duration-300',
              i <= yellowSubStep ? 'bg-primary scale-100' : 'bg-muted scale-75'
            )} />
          ))}
        </div>

        {/* H1: Body intervention */}
        {yellowSubStep === 0 && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <h2 className="text-xl font-semibold">先给神经系统一个"安全"信号</h2>
            <p className="text-sm text-muted-foreground">杏仁核还在响——我们先让它安静下来。选一个你能做的：</p>
            <div className="space-y-3">
              <Button variant="outline" className="w-full h-16 justify-start gap-3 text-base" onClick={() => { setYellowSubStep(1); }}>
                <span className="text-2xl">🧊</span> 冰块贴脸+屏息 — 15秒重置
                <span className="text-xs text-muted-foreground ml-auto">★推荐</span>
              </Button>
              <Button variant="outline" className="w-full h-16 justify-start gap-3 text-base" onClick={() => { setYellowSubStep(1); }}>
                <span className="text-2xl">💧</span> 冷水冲脸+屏息 — 没有冰块时用
              </Button>
              <Button variant="outline" className="w-full h-16 justify-start gap-3 text-base" onClick={() => { setYellowSubStep(1); }}>
                <span className="text-2xl">🎵</span> 哼唱/Voo声 — 声带振动放松神经
              </Button>
              <Button variant="outline" className="w-full h-16 justify-start gap-3 text-base" onClick={() => { setYellowSubStep(1); }}>
                <span className="text-2xl">🌬</span> 延长呼气呼吸 — 吸4呼6，5轮
              </Button>
              <Button variant="outline" className="w-full h-16 justify-start gap-3 text-base" onClick={() => { setYellowSubStep(1); }}>
                <span className="text-2xl">👀</span> 环境定向 — 慢转头确认安全
              </Button>
              <Button variant="outline" className="w-full h-16 justify-start gap-3 text-base" onClick={() => { setYellowSubStep(1); }}>
                <span className="text-2xl">🤲</span> 抖掉+手放胸口 — 释放+安抚
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">如果什么都不想做——就把手放在胸口，感受呼吸的起伏。这已经是一个身体动作。</p>
          </div>
        )}

        {/* H2: AI refute (skip to H3 via button) */}
        {yellowSubStep === 1 && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <h2 className="text-xl font-semibold">让疗愈助手帮你处理那个声音</h2>
            <p className="text-muted-foreground">你刚才做了一个身体动作。这本身就是"行动"。现在杏仁核的警报音量已经调低了——接下来让疗愈助手帮你处理那个一直在骂你的声音。</p>
            <Button variant="outline" className="w-full" onClick={() => triggerAI('用户当前能量：黄灯（有点累但还能动）。请帮用户识别和驳斥内在批判者。')}>
              💬 打开疗愈助手
            </Button>
            <p className="text-xs text-muted-foreground text-center">和疗愈助手聊完后，点击下方"下一步"继续 →</p>
          </div>
        )}

        {/* H3: Energy allocation (黄灯限定，上限5分钟) */}
        {yellowSubStep === 2 && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <h2 className="text-xl font-semibold">你现在大概还剩多少力气？</h2>
            <div className="grid grid-cols-2 gap-3">
              <Button variant={yellowDuration === 2 ? 'default' : 'outline'} className="py-8 flex-col gap-1" onClick={() => setYellowDuration(2)}>
                <span className="text-lg">2分钟</span>
                <span className="text-xs">微小动作</span>
              </Button>
              <Button variant={yellowDuration === 5 ? 'default' : 'outline'} className="py-8 flex-col gap-1" onClick={() => setYellowDuration(5)}>
                <span className="text-lg">5分钟</span>
                <span className="text-xs">小步骤</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">不设超过5分钟的选项——黄灯用户应降低标准</p>
          </div>
        )}

        {/* H4: Micro action */}
        {yellowSubStep === 3 && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <h2 className="text-xl font-semibold">接下来{yellowDuration}分钟，你只做这一件事</h2>
            <Input
              value={yellowAction}
              onChange={(e) => setYellowAction(e.target.value)}
              placeholder={`${yellowDuration}分钟内要做的事...`}
              className="h-14 text-base"
            />
            {countdown > 0 && (
              <div className="text-center py-6">
                <div className="text-6xl font-mono font-bold text-primary tabular-nums">
                  {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                </div>
                <p className="text-sm text-muted-foreground mt-2">⏰ 闹钟设好了吗？没设的话现在设一个。</p>
              </div>
            )}
          </div>
        )}

        {/* H5: Quick wrap-up */}
        {yellowSubStep === 4 && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <h2 className="text-xl font-semibold text-center">收个尾</h2>
            <div className="flex gap-3">
              <Button variant="default" className="flex-1 h-16 text-base" onClick={onComplete}>
                ✅ 我动了！
              </Button>
              <Button variant="outline" className="flex-1 h-16 text-base" onClick={() => {
                onComplete();
              }}>
                😔 没动……
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">不管动了没动——你都已经做了身体动作。这已经是"做了什么"。想聊聊为什么没动，点右下角疗愈助手。</p>
          </div>
        )}

        {/* Bottom navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 z-10">
          <div className="max-w-md mx-auto flex gap-3">
            {yellowSubStep > 0 && (
              <Button variant="outline" className="flex-1 h-14" onClick={goBack}>
                ← 上一步
              </Button>
            )}
            <Button className="flex-1 h-14 text-base" onClick={goNext} disabled={!canGoNext()}>
              {yellowSubStep === 4 ? '完成' : '下一步 →'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">⚠️ 这不是心理咨询。你随时可以停下来。</p>
        </div>
      </div>
    );
  }

  // ===== RENDER: Green Light Flow =====
  return (
    <div className="animate-fadeIn flex flex-col gap-6 max-w-md mx-auto px-4 pt-12 pb-24">
      {/* Step Navigation */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm -mx-4 px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{getStepLabel()} · {getStepName()}</span>
          <button onClick={onRestart} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ⏮ 重新开始
          </button>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={cn(
            'w-3 h-3 rounded-full transition-all duration-300',
            i <= step ? 'bg-primary scale-100' : 'bg-muted scale-75'
          )} />
        ))}
      </div>

      {/* ===== Step 0: Sensory Landing ===== */}
      {step === 0 && (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h2 className="text-lg font-semibold text-center">花1分钟做个感官着陆</h2>
          <p className="text-xs text-muted-foreground text-center -mt-1">在杏仁核被激活之前先巩固安全感</p>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-background rounded-lg p-3 text-center">
              <span className="text-lg">👁</span>
              <p className="text-xs mt-1">找到5个不同颜色的东西</p>
            </div>
            <div className="bg-background rounded-lg p-3 text-center">
              <span className="text-lg">🤚</span>
              <p className="text-xs mt-1">触碰3个不同质地的东西</p>
            </div>
            <div className="bg-background rounded-lg p-3 text-center">
              <span className="text-lg">🌬</span>
              <p className="text-xs mt-1">吸4憋2呼6，重复3次</p>
            </div>
            <div className="bg-background rounded-lg p-3 text-center">
              <span className="text-lg">🎵</span>
              <p className="text-xs mt-1">低沉"voo——"拉长感受振动</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center italic">
            每个做30秒。挑一个开始就行——不用全做。
          </p>

          {/* Sensory inputs */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">听到的声音</label>
              <Input value={sensoryInputs.sounds} onChange={(e) => setSensoryInputs(prev => ({ ...prev, sounds: e.target.value }))} placeholder="填不出没关系" className="text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">看到的颜色</label>
              <Input value={sensoryInputs.colors} onChange={(e) => setSensoryInputs(prev => ({ ...prev, colors: e.target.value }))} placeholder="填不出没关系" className="text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">触碰的物体</label>
              <Input value={sensoryInputs.objects} onChange={(e) => setSensoryInputs(prev => ({ ...prev, objects: e.target.value }))} placeholder="填不出没关系" className="text-sm" />
            </div>
          </div>
        </div>
      )}

      {/* ===== Step 1: Lock Target + Fear ===== */}
      {step === 1 && (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h2 className="text-xl font-semibold">锁定目标</h2>

          <div className="space-y-2">
            <label className="text-sm font-medium">你一直拖着没做的事是什么？</label>
            <Input value={task} onChange={(e) => setTask(e.target.value)} placeholder="一句话就行" className="h-14 text-base" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">最怕发生什么？</label>
            <Input value={fear} onChange={(e) => setFear(e.target.value)} placeholder="不是'怕做不好'——具体一点，最怕的结果是什么？" className="h-14 text-base" />
          </div>

          {/* RSD Card */}
          {showRSDCard && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 space-y-2">
              <p>💡 你现在的感受有一个名字</p>
              <p>叫<strong>「拒绝敏感性焦虑」(RSD)</strong>。</p>
              <p>它不是事实，是你大脑过度保护你。</p>
              <p>你的大脑把"可能被否定"当成了"一定会被否定"。</p>
              <p className="italic">这个感觉是真的，但它说的不是真的。</p>
            </div>
          )}

          {/* AI Intervention Prompt */}
          {showAIPrompt && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm space-y-2">
              <p>💡 你的恐惧里可能有内在批判者的声音。</p>
              <p>要不要让疗愈助手帮你识别一下？</p>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => triggerAI(`我刚写下了我的目标：${task}。我的恐惧：${fear}。我的能量状态是绿灯。请帮我识别这是不是内在批判者在说话。`)}>
                  💬 和疗愈助手聊聊
                </Button>
                <Button variant="ghost" size="sm">继续下一步</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== Step 2: Preparation Actions ===== */}
      {step === 2 && (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h2 className="text-xl font-semibold">把脑子里"我得先做XX"的念头写下来</h2>
          <p className="text-sm text-muted-foreground">不评判，先写。比如：标题还不够好、还需要查资料……</p>

          <div className="space-y-3">
            {preparationActions.map((action, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={action}
                  onChange={(e) => {
                    const newActions = [...preparationActions];
                    newActions[i] = e.target.value;
                    setPreparationActions(newActions);
                  }}
                  placeholder={`准备动作 ${i + 1}`}
                  className="h-12 text-base"
                />
                {preparationActions.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => {
                    setPreparationActions(preparationActions.filter((_, j) => j !== i));
                    setSelectedPreparations(selectedPreparations.filter(a => a !== action));
                  }}>
                    ✕
                  </Button>
                )}
              </div>
            ))}
          </div>

          {preparationActions.length < 4 && (
            <Button variant="outline" className="w-full" onClick={() => setPreparationActions([...preparationActions, ''])}>
              ＋ 再加一条
            </Button>
          )}

          {preparationActions.filter(a => a.trim()).length >= 3 && selectedPreparations.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
              <p>有点多了。选最重要的2条。其余的做完这事再回头看。</p>
            </div>
          )}
        </div>
      )}

      {/* ===== Step 3: Four Quadrant Diagnosis ===== */}
      {step === 3 && (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h2 className="text-xl font-semibold">逐条诊断</h2>

          {(() => {
            const actionsToDiagnose = selectedPreparations.length > 0
              ? selectedPreparations
              : preparationActions.filter(a => a.trim()).slice(0, 2);

            if (currentDiagnosisIndex >= actionsToDiagnose.length) {
              return (
                <div className="space-y-4">
                  <h3 className="font-medium text-center">诊断完成！汇总：</h3>
                  <div className="space-y-2">
                    {diagnosisResults.map((r, i) => (
                      <div key={i} className={cn(
                        'rounded-lg p-3 text-sm',
                        r.result === 'keep' && 'bg-green-50 border border-green-200',
                        r.result === 'simplify' && 'bg-amber-50 border border-amber-200',
                        r.result === 'postpone' && 'bg-amber-50 border border-amber-200',
                        r.result === 'delete' && 'bg-red-50 border border-red-200'
                      )}>
                        <div className="flex items-center gap-2">
                          <span>{r.result === 'keep' ? '✅' : r.result === 'delete' ? '❌' : '⚠️'}</span>
                          <span className="font-medium">{r.result === 'keep' ? '保留' : r.result === 'delete' ? '删除' : r.result === 'simplify' ? '简化' : '先放放'}</span>
                          <span>— {r.action}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            const currentAction = actionsToDiagnose[currentDiagnosisIndex];
            const currentResult = diagnosisResults[currentDiagnosisIndex];

            return (
              <div className="space-y-4">
                <div className="bg-background rounded-xl p-4">
                  <p className="font-medium">{currentAction}</p>
                </div>

                {!currentResult?.willing !== undefined ? (
                  <>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">做这件事，心里是——</p>
                      <div className="flex gap-3">
                        <Button variant="outline" className="flex-1 h-14" onClick={() => {
                          const newResults = [...diagnosisResults];
                          newResults[currentDiagnosisIndex] = { ...newResults[currentDiagnosisIndex] || { action: currentAction, result: null }, action: currentAction, willing: true, enough: null as boolean | null, result: null };
                          setDiagnosisResults(newResults);
                        }}>
                          我愿意
                        </Button>
                        <Button variant="outline" className="flex-1 h-14" onClick={() => {
                          const newResults = [...diagnosisResults];
                          newResults[currentDiagnosisIndex] = { ...newResults[currentDiagnosisIndex] || { action: currentAction, result: null }, action: currentAction, willing: false, enough: null as boolean | null, result: null };
                          setDiagnosisResults(newResults);
                        }}>
                          我必须
                        </Button>
                      </div>
                    </div>
                  </>
                ) : currentResult?.enough === undefined ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">做完之后，心里冒出来的是——</p>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 h-14" onClick={() => {
                        const newResults = [...diagnosisResults];
                        const willing = newResults[currentDiagnosisIndex].willing!;
                        const enough = true;
                        let result: DiagnosisResult['result'] = null;
                        if (willing && enough) result = 'keep';
                        else if (!willing && enough) result = 'simplify';
                        newResults[currentDiagnosisIndex] = { ...newResults[currentDiagnosisIndex], enough, result };
                        setDiagnosisResults(newResults);
                        setCurrentDiagnosisIndex(i => i + 1);
                      }}>
                        可以继续了
                      </Button>
                      <Button variant="outline" className="flex-1 h-14" onClick={() => {
                        const newResults = [...diagnosisResults];
                        const willing = newResults[currentDiagnosisIndex].willing!;
                        const enough = false;
                        let result: DiagnosisResult['result'] = null;
                        if (willing && !enough) result = 'postpone';
                        else if (!willing && !enough) result = 'delete';
                        newResults[currentDiagnosisIndex] = { ...newResults[currentDiagnosisIndex], enough, result };
                        setDiagnosisResults(newResults);
                        setCurrentDiagnosisIndex(i => i + 1);
                      }}>
                        还不够
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })()}
        </div>
      )}

      {/* ===== Step 4: Action Launch ===== */}
      {step === 4 && (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
          <h2 className="text-xl font-semibold">行动启动</h2>

          {/* Dopamine warm-up */}
          <div className="space-y-3">
            <h3 className="font-medium">🔥 多巴胺预热</h3>
            <p className="text-sm text-muted-foreground">先做一个小动作热个身。和你目标有关，但简单到不可能失败。</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setWarmupAction('打开编辑器，打一行字：我接下来要写的是……')}>
                📝 打开编辑器
              </Button>
              <Button variant="outline" size="sm" onClick={() => setWarmupAction('打开招聘网站首页（不筛选，就看一眼）')}>
                💼 打开招聘网站
              </Button>
              <Button variant="outline" size="sm" onClick={() => setWarmupAction('把文档从桌面拖到工作文件夹')}>
                📁 整理文档
              </Button>
            </div>
            <Input value={warmupAction} onChange={(e) => setWarmupAction(e.target.value)} placeholder="或者自己写一个热身动作" className="h-12 text-base" />
          </div>

          {/* Time window */}
          <div className="space-y-3">
            <h3 className="font-medium">⏱ 设定时间窗</h3>
            <div className="flex gap-3 items-center">
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-12" />
              <span className="text-muted-foreground">至</span>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-12" />
            </div>
            <Textarea value={actionContent} onChange={(e) => setActionContent(e.target.value)} placeholder="行动内容（自动从诊断结果填充）" className="min-h-20" />
          </div>

          {/* Alarm prompt */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm space-y-1">
            <p className="font-medium">⏰ 在手机上设一个闹钟</p>
            <p className="text-muted-foreground">没设闹钟的话，时间盲症会让你在"再过一会儿"中耗掉整个下午。</p>
            <p className="text-muted-foreground">设好了再点继续。</p>
          </div>
        </div>
      )}

      {/* ===== Step 5: Countdown + Review ===== */}
      {step === 5 && (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h2 className="text-xl font-semibold text-center">复盘</h2>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">你原本预期会发生什么？</label>
              <Input value={expectation} onChange={(e) => setExpectation(e.target.value)} placeholder="比如：我觉得会很困难" className="h-12 text-base" />
            </div>
            <div>
              <label className="text-sm font-medium">实际发生了什么？</label>
              <Input value={actual} onChange={(e) => setActual(e.target.value)} placeholder="比如：其实比想的顺利" className="h-12 text-base" />
            </div>
          </div>

          {expectation && actual && (
            <div className={cn('rounded-lg p-4 text-sm border', getReviewCard().bg)}>
              <p>{getReviewCard().text}</p>
              <div className="mt-3">
                <Button variant="outline" size="sm" onClick={() => triggerAI(`我完成了复盘。预期：${expectation}。实际：${actual}。请帮我深入分析这次体验。`)}>
                  💬 打开疗愈助手，深度复盘
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== Stuck Modal ===== */}
      {showStuckModal && step === 5 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowStuckModal(false)}>
          <div className="bg-card rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">你怎么卡住的？</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full h-14 justify-start gap-3 text-base" onClick={() => handleStuck('new_thought')}>
                💭 脑子里冒出新想法
              </Button>
              <Button variant="outline" className="w-full h-14 justify-start gap-3 text-base" onClick={() => handleStuck('body_frozen')}>
                🫂 身体动不了
              </Button>
              <Button variant="outline" className="w-full h-14 justify-start gap-3 text-base" onClick={() => handleStuck('time_energy')}>
                ⏰ 时间/精力不够了
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 z-10">
        <div className="max-w-md mx-auto flex gap-3">
          {step > 0 && energyLevel === 'green' && (
            <Button variant="outline" className="flex-1 h-14" onClick={goBack}>
              ← 上一步
            </Button>
          )}
          <Button className="flex-1 h-14 text-base" onClick={goNext} disabled={!canGoNext()}>
            {step === 5 ? '完成' : '下一步 →'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">⚠️ 这不是心理咨询。你随时可以停下来。</p>
      </div>
    </div>
  );
}
