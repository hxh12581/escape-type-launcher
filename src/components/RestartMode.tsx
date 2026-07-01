'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type RestartStep = 'activation' | 'grounding' | 'confirmation';
type ActivationMethod =
  | 'ice_face'
  | 'cold_face'
  | 'voo_sound'
  | 'orienting'
  | 'shake_out'
  | 'walk_out'
  | null;

interface RestartState {
  step: RestartStep;
  method: ActivationMethod;
  countdown: number;
  visualItems: string[];
  location: string;
  methodCompleted: boolean;
}

interface RestartModeProps {
  onComplete: () => void;
  onRestart?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateCPTSDState?: (newState: Record<string, unknown>) => void;
  energyLevel?: 'red' | 'yellow' | 'green';
}

// 方法定义 - 通俗易懂的描述
const METHODS = [
  {
    id: 'ice_face' as const,
    icon: '🧊',
    title: '冰块贴脸 + 屏住呼吸',
    subtitle: '最快恢复 — 30秒见效',
    category: 'cold',
    categoryLabel: '冷敷法（需要冰块）',
    science: '脸部遇冷 + 屏住呼吸 → 身体自动放松',
    description: '用薄毛巾包住冰块，贴在脸颊或额头上，同时屏住呼吸15秒。拿下来后深深呼一口气。',
    duration: 15,
    completionText: '感受身体的变化——心跳有没有慢一点？肩膀有没有松一点？',
    recommended: true,
  },
  {
    id: 'cold_face' as const,
    icon: '💧',
    title: '冷水冲脸 + 屏住呼吸',
    subtitle: '没有冰块时用这个',
    category: 'cold',
    categoryLabel: '冷敷法（有自来水就行）',
    science: '冷水 + 屏住呼吸 → 同样能让身体放松',
    description: '用手捧冷水拍脸10次，拍的时候屏住呼吸。然后擦干脸，慢慢呼一口气。',
    duration: 10,
    completionText: '感觉到冷水的刺激了吗？',
  },
  {
    id: 'voo_sound' as const,
    icon: '🎵',
    title: '哼唱 / 发出"呜——"声',
    subtitle: '零道具 · 随时能做 · 最温和',
    category: 'vagus',
    categoryLabel: '声音放松法（零道具）',
    science: '声带振动 → 通过喉咙的神经 → 告诉大脑"安全了"',
    description: '深吸一口气，用低沉的声音发出"呜——"（像念"voo"），尽量拉长。感受喉咙和胸口的微微振动。重复3次。',
    duration: 30,
    completionText: '感受到喉咙和胸口的振动了吗？',
  },
  {
    id: 'orienting' as const,
    icon: '👀',
    title: '慢慢转头看看周围',
    subtitle: '解离感强的时候最管用',
    category: 'vagus',
    categoryLabel: '声音放松法（零道具）',
    science: '慢慢转头 → 让大脑确认"这里没有危险"',
    description: '慢慢地把头转向左边，眼睛扫一遍看到的东西。再慢慢转向右边，扫一遍。回到中间。问问自己："这个房间里有实际的危险吗？"',
    duration: 30,
    completionText: '确认了——这里没有危险。',
  },
  {
    id: 'shake_out' as const,
    icon: '🤲',
    title: '抖一抖身体',
    subtitle: '像动物抖掉水一样',
    category: 'movement',
    categoryLabel: '身体运动法（需要站起来）',
    science: '抖掉身体的紧张 → 释放压力 → 身体松一口气',
    description: '站起来，双手自然下垂。先轻轻抖手腕，慢慢扩展到手臂、肩膀、上半身，最后到腿。像把身上的水抖掉一样。持续30秒后停下来，深呼吸。',
    duration: 30,
    completionText: '感受到身体放松了吗？',
  },
  {
    id: 'walk_out' as const,
    icon: '🚶',
    title: '出门走5分钟',
    subtitle: '边走边看远处',
    category: 'movement',
    categoryLabel: '身体运动法（需要出门）',
    science: '左右脚交替走 + 看远处 → 打破卡住的状态',
    description: '穿着现在这身直接出门。走5分钟，不设目标。边走边看远处——天空、树、远处的建筑。关键是看远不看近。',
    duration: 0,
    completionText: '感受到身体的移动和视野的开阔了吗？',
  },
];

// 步骤导航组件
function StepNav({
  currentStep,
  totalSteps,
  onPrev,
  onNext,
  nextDisabled = false,
}: {
  currentStep: number;
  totalSteps: number;
  onPrev?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="w-20">
        {onPrev && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrev}
            className="text-muted-foreground hover:text-foreground gap-1"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            上一步
          </Button>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-2 h-2 rounded-full transition-all duration-300',
              i < currentStep - 1
                ? 'bg-primary/40'
                : i === currentStep - 1
                  ? 'bg-primary scale-125'
                  : 'bg-border'
            )}
          />
        ))}
      </div>

      <div className="w-20 flex justify-end">
        {onNext && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onNext}
            disabled={nextDisabled}
            className="text-primary hover:text-primary/80 gap-1 font-medium"
          >
            下一步
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Button>
        )}
      </div>
    </div>
  );
}

// 倒计时圆圈
function CountdownCircle({ countdown, total }: { countdown: number; total: number }) {
  const progress = countdown / total;
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="6" className="text-border" />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          className="text-primary transition-all duration-1000 ease-linear"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-4xl font-bold text-primary">{countdown}</span>
      </div>
    </div>
  );
}

export default function RestartMode({ onComplete, onRestart, energyLevel = 'yellow' }: RestartModeProps) {
  const [state, setState] = useState<RestartState>({
    step: 'activation',
    method: null,
    countdown: 0,
    visualItems: ['', '', ''],
    location: '',
    methodCompleted: false,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // 倒计时逻辑
  useEffect(() => {
    if (state.countdown > 0) {
      timerRef.current = setInterval(() => {
        setState(prev => {
          if (prev.countdown <= 1) {
            clearInterval(timerRef.current!);
            return { ...prev, countdown: 0, methodCompleted: true };
          }
          return { ...prev, countdown: prev.countdown - 1 };
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [state.countdown]);

  // 打开Chat SDK
  const openChatSDK = () => {
    const event = new CustomEvent('openChatSDK', {
      detail: {
        energyLevel: 'red',
        currentStep: 'restart_stuck',
      },
    });
    window.dispatchEvent(event);
  };

  const handleMethodSelect = (method: ActivationMethod) => {
    setState(prev => ({ ...prev, method, countdown: 0, methodCompleted: false }));
  };

  const startCountdown = (seconds: number) => {
    setState(prev => ({ ...prev, countdown: seconds, methodCompleted: false }));
  };

  const handleMethodComplete = () => {
    setState(prev => ({ ...prev, method: null, countdown: 0, methodCompleted: false }));
  };

  const goToNextStep = () => {
    if (state.step === 'activation') {
      setState(prev => ({ ...prev, step: 'grounding' }));
    } else if (state.step === 'grounding') {
      setState(prev => ({ ...prev, step: 'confirmation' }));
    }
  };

  const goToPrevStep = () => {
    if (state.step === 'grounding') {
      setState(prev => ({ ...prev, step: 'activation', method: null, countdown: 0, methodCompleted: false }));
    } else if (state.step === 'confirmation') {
      setState(prev => ({ ...prev, step: 'grounding' }));
    }
  };

  const currentMethod = state.method ? METHODS.find(m => m.id === state.method) : null;
  const stepNumber = state.step === 'activation' ? 1 : state.step === 'grounding' ? 2 : 3;

  // 按类别分组（去掉硬编码的recommended，改为按能量级动态决定）
  const coldMethods = METHODS.filter(m => m.category === 'cold');
  const vagusMethods = METHODS.filter(m => m.category === 'vagus');
  const movementMethods = METHODS.filter(m => m.category === 'movement');

  // 根据能量级确定推荐策略
  const getRecommendedIds = (): string[] => {
    switch (energyLevel) {
      case 'red':
        return ['orienting', 'voo_sound']; // 手放胸口(兜底) > Voo声 > 环境定向
      case 'yellow':
        return ['ice_face', 'voo_sound', 'shake_out']; // 冰块贴脸（主推）> Voo声 > 抖掉
      case 'green':
        return ['walk_out', 'ice_face', 'shake_out']; // 出门走5分钟（主推）> 冰块 > 抖掉
      default:
        return ['ice_face'];
    }
  };
  const recommendedIds = getRecommendedIds();
  const isRecommended = (methodId: string) => recommendedIds.includes(methodId);

  return (
    <div className="animate-fadeIn">
      <p className="text-center text-xs text-muted-foreground mb-3 tracking-wide">
        步骤 {stepNumber}/3
      </p>
      <StepNav
        currentStep={stepNumber}
        totalSteps={3}
        onPrev={stepNumber > 1 ? goToPrevStep : undefined}
        onNext={
          state.step === 'activation'
            ? goToNextStep
            : state.step === 'grounding'
              ? goToNextStep
              : undefined
        }
      />

      {/* B1: 身体激活 */}
      {state.step === 'activation' && !state.method && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-center mb-1">
            你的大脑没有坏
          </h2>
          <p className="text-center text-sm text-muted-foreground mb-6">
            它只是暂时关机了。我们先唤醒身体。
          </p>

          {/* 冷敷法 */}
          <div className="mb-5">
            <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-blue-400" />
              {coldMethods[0]?.categoryLabel}
            </p>
            <div className="space-y-2.5">
              {coldMethods.map(method => (
                <button
                  key={method.id}
                  className={cn(
                    'w-full text-left rounded-xl p-4 border-2 transition-all duration-200 active:scale-[0.98]',
                    isRecommended(method.id)
                      ? 'border-primary/60 bg-primary/5 hover:border-primary hover:shadow-sm'
                      : 'border-border bg-card hover:border-primary/30'
                  )}
                  onClick={() => handleMethodSelect(method.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl flex-shrink-0">{method.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-base">{method.title}</span>
                        {isRecommended(method.id) && (
                          <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-medium">
                            推荐
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{method.subtitle}</p>
                      <p className="text-xs text-primary/70 mt-1 font-medium">{method.science}</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 text-muted-foreground">
                      <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 声音放松法 */}
          <div className="mb-5">
            <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-green-400" />
              {vagusMethods[0]?.categoryLabel}
            </p>
            <div className="space-y-2.5">
              {vagusMethods.map(method => (
                <button
                  key={method.id}
                  className="w-full text-left rounded-xl p-4 border border-border bg-card hover:border-primary/30 transition-all duration-200 active:scale-[0.98]"
                  onClick={() => handleMethodSelect(method.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl flex-shrink-0">{method.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-base">{method.title}</span>
                      <p className="text-xs text-muted-foreground">{method.subtitle}</p>
                      <p className="text-xs text-primary/70 mt-1 font-medium">{method.science}</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 text-muted-foreground">
                      <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 身体运动法 */}
          <div>
            <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-orange-400" />
              {movementMethods[0]?.categoryLabel}
            </p>
            <div className="space-y-2.5">
              {movementMethods.map(method => (
                <button
                  key={method.id}
                  className="w-full text-left rounded-xl p-4 border border-border bg-card hover:border-primary/30 transition-all duration-200 active:scale-[0.98]"
                  onClick={() => handleMethodSelect(method.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl flex-shrink-0">{method.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-base">{method.title}</span>
                      <p className="text-xs text-muted-foreground">{method.subtitle}</p>
                      <p className="text-xs text-primary/70 mt-1 font-medium">{method.science}</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 text-muted-foreground">
                      <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 兜底提示 */}
          <div className="mt-5 p-3 bg-muted/30 rounded-xl border border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              💡 如果什么都不想做——把手放在胸口，感受手掌的温度和呼吸的起伏。
            </p>
          </div>
        </div>
      )}

      {/* 方法执行中 */}
      {state.step === 'activation' && state.method && currentMethod && (
        <div className="bg-card border border-border rounded-2xl p-6 text-center">
          <span className="text-4xl block mb-3">{currentMethod.icon}</span>
          <h3 className="text-xl font-semibold mb-1">{currentMethod.title}</h3>
          <p className="text-sm text-muted-foreground mb-2">{currentMethod.science}</p>

          <div className="p-4 bg-muted/30 rounded-xl mb-6">
            <p className="text-sm leading-relaxed">{currentMethod.description}</p>
          </div>

          {currentMethod.duration > 0 ? (
            <>
              {state.countdown === 0 && !state.methodCompleted ? (
                <button
                  className="w-32 h-32 rounded-full border-4 border-primary text-5xl font-bold text-primary mx-auto flex items-center justify-center hover:bg-primary/5 transition-all active:scale-95"
                  onClick={() => startCountdown(currentMethod.duration)}
                >
                  {currentMethod.duration}
                </button>
              ) : state.countdown > 0 ? (
                <CountdownCircle countdown={state.countdown} total={currentMethod.duration} />
              ) : null}

              {state.methodCompleted && (
                <div className="animate-fadeIn">
                  <p className="text-sm text-muted-foreground mb-4">{currentMethod.completionText}</p>
                  <button
                    className="w-full py-3 rounded-xl font-semibold text-white active:scale-[0.98] transition-all"
                    style={{ backgroundColor: '#4A90D9' }}
                    onClick={handleMethodComplete}
                  >
                    感觉到了，继续 →
                  </button>
                </div>
              )}
            </>
          ) : (
            <button
              className="w-full py-3 rounded-xl font-semibold text-white active:scale-[0.98] transition-all"
              style={{ backgroundColor: '#4A90D9' }}
              onClick={handleMethodComplete}
            >
              {currentMethod.completionText}
            </button>
          )}
        </div>
      )}

      {/* B2: 回到当下 */}
      {state.step === 'grounding' && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-center mb-1">回到当下</h2>
          <p className="text-center text-sm text-muted-foreground mb-6">
            快速扫描一下周围，帮大脑重新定位
          </p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block">
                👁 你能看到的3样东西是什么？
              </label>
              <p className="text-xs text-muted-foreground mb-3">不写也可以，在心里回答就好</p>
              <div className="space-y-2">
                {[0, 1, 2].map(i => (
                  <Input
                    key={i}
                    value={state.visualItems[i]}
                    onChange={(e) => {
                      const newItems = [...state.visualItems];
                      newItems[i] = e.target.value;
                      setState(prev => ({ ...prev, visualItems: newItems }));
                    }}
                    placeholder={`第${i + 1}样...`}
                    className="h-12"
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                📍 你现在在哪里？
              </label>
              <p className="text-xs text-muted-foreground mb-2">一句话就好</p>
              <Input
                value={state.location}
                onChange={(e) => setState(prev => ({ ...prev, location: e.target.value }))}
                placeholder="比如：在家里的沙发上"
                className="h-12"
              />
            </div>
          </div>

          <div className="space-y-3">
            <button
              className="w-full py-3 rounded-xl font-semibold text-white active:scale-[0.98] transition-all"
              style={{ backgroundColor: '#4A90D9' }}
              onClick={goToNextStep}
            >
              🔄 我感觉好些了，继续
            </button>

            <button
              className="w-full py-3 rounded-xl border-2 border-border font-semibold text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all active:scale-[0.98]"
              onClick={openChatSDK}
            >
              💬 还是动不了，和疗愈助手聊聊
            </button>
          </div>
        </div>
      )}

      {/* B3: 最小确认 */}
      {state.step === 'confirmation' && (
        <div className="bg-card border border-border rounded-2xl p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <span className="text-3xl">✨</span>
          </div>

          <h2 className="text-xl font-semibold mb-3">
            你刚才做了身体动作
          </h2>
          <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
            这已经是"做了什么"。
            <br />
            不需要再做更多。
          </p>

          <div className="space-y-3">
            <button
              className="w-full py-3 rounded-xl font-semibold text-white active:scale-[0.98] transition-all"
              style={{ backgroundColor: '#4A90D9' }}
              onClick={onComplete}
            >
              🔄 我感觉好些了，回到首页
            </button>

            <button
              className="w-full py-3 rounded-xl border-2 border-border font-semibold text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all active:scale-[0.98]"
              onClick={() => {
                const event = new CustomEvent('openChatSDK', {
                  detail: {
                    energyLevel: 'red',
                    currentStep: 'restart_stuck',
                    initialMessage: `我做了身体动作但还是动不了。当前能量：${energyLevel}灯。请帮我驳斥内在批判者。`
                  }
                });
                window.dispatchEvent(event);
              }}
            >
              💬 还是动不了，和疗愈助手聊聊
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
