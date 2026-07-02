'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import FullMode from '@/components/FullMode';
import ChatClient, { CPTSDState } from '@/components/ChatClient';
import RestartMode from '@/components/RestartMode';

// 类型定义
type FlowType = 'entry' | 'energy' | 'quick' | 'restart' | 'full' | 'complete';
type EnergyLevel = 'red' | 'yellow' | 'green';
type QuickStep = 'energy' | 'attention' | 'action';
type EntryChoice = 'daily' | 'blank' | 'distracted' | 'important' | null;

interface ActionRecord {
  date: string;
  task: string;
  expectation: string;
  actual: string;
  resultType: 'better' | 'similar' | 'worse';
}

interface UserState {
  flowType: FlowType;
  entryChoice: EntryChoice;
  quickStep: QuickStep;
  energyLevel: EnergyLevel | null;
  task: string;
  firstStep: string;
  countdown: number;
}

// 步骤导航组件
function StepNav({
  currentStep,
  totalSteps,
  onPrev,
  onNext,
  nextLabel = '下一步',
  prevLabel = '上一步',
  nextDisabled = false,
  prevDisabled = false,
}: {
  currentStep: number;
  totalSteps: number;
  onPrev?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  prevLabel?: string;
  nextDisabled?: boolean;
  prevDisabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="w-24">
        {onPrev && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrev}
            disabled={prevDisabled}
            className="text-muted-foreground hover:text-foreground gap-1.5"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {prevLabel}
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

      <div className="w-24 flex justify-end">
        {onNext && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onNext}
            disabled={nextDisabled}
            className="text-primary hover:text-primary/80 gap-1.5 font-medium"
          >
            {nextLabel}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Button>
        )}
      </div>
    </div>
  );
}

// 步骤标签
function StepLabel({ label, step, total }: { label?: string; step: number; total: number }) {
  return (
    <p className="text-center text-xs text-muted-foreground mb-3 tracking-wide">
      {label || `步骤 ${step}/${total}`}
    </p>
  );
}

// 完成页面
function CompletePage({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="animate-fadeIn text-center">
      <div className="text-6xl mb-8">🌱</div>
      <h2 className="text-2xl font-semibold mb-3">你已经不是一个「什么都没做」的人了</h2>
      <p className="text-muted-foreground mb-8 leading-relaxed">
        想休息就休息。想再做一个动作就再做一个。
        <br />
        <span className="text-sm mt-2 block">
          不用逼自己。
        </span>
      </p>
      <button
        onClick={onRestart}
        className="inline-flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-xl text-foreground hover:bg-accent hover:border-primary/30 transition-all duration-200 active:scale-[0.98]"
      >
        <span className="text-lg">🔄</span>
        <span className="font-medium">再来一次</span>
      </button>
      <p className="text-xs text-muted-foreground mt-6">
        💬 右下角疗愈助手随时可以聊
      </p>
    </div>
  );
}

// 重启模式专用：3秒无反应自动默认为红灯
function AutoRedDetect({ onAutoRed }: { onAutoRed: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onAutoRed, 3000);
    return () => clearTimeout(timer);
  }, [onAutoRed]);
  return null;
}

export default function Home() {
  const [state, setState] = useState<UserState>({
    flowType: 'entry',
    entryChoice: null,
    quickStep: 'action' as 'attention' | 'action',
    energyLevel: null,
    task: '',
    firstStep: '',
    countdown: 0,
  });

  const [records, setRecords] = useState<ActionRecord[]>([]);
  const [showRecords, setShowRecords] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [cptsdState, setCptsdState] = useState<CPTSDState | null>(null);
  const [quickAttentionStep, setQuickAttentionStep] = useState<'counting' | 'input'>('counting');
  const [quickRedAlarm, setQuickRedAlarm] = useState(false);

  const updateCPTSDState = (newState: Partial<CPTSDState>) => {
    if (typeof window === 'undefined') return;
    const currentState = JSON.parse(localStorage.getItem('cptsd_app_state') || '{}') as CPTSDState;
    const updatedState = { ...currentState, ...newState };
    localStorage.setItem('cptsd_app_state', JSON.stringify(updatedState));
    setCptsdState(updatedState);
  };

  useEffect(() => {
    setMounted(true);
    const savedRecords = localStorage.getItem('procrastination-records');
    if (savedRecords) setRecords(JSON.parse(savedRecords));
    const savedCPTSDState = localStorage.getItem('cptsd_app_state');
    if (savedCPTSDState) setCptsdState(JSON.parse(savedCPTSDState));
  }, []);

  useEffect(() => {
    if (records.length > 0) localStorage.setItem('procrastination-records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    if (state.countdown > 0) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, countdown: prev.countdown - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.countdown]);

  // v3: 入口选择后进入能量评估（公共前置模块）
  const handleEntryChoice = (choice: EntryChoice) => {
    setState(prev => ({
      ...prev,
      entryChoice: choice,
      flowType: 'energy',
    }));
  };

  // v3: 能量评估完成后分流
  const handleEnergySelect = (level: EnergyLevel) => {
    const choice = state.entryChoice;

    updateCPTSDState({ energyLevel: level, currentStep: 'energy_assessment' });

    // 红灯按入口分流，不再统一走RedSimpleMode
    if (level === 'red') {
      if (choice === 'blank') {
        // 大脑空白 → 重启模式（红色推荐策略）
        setState(prev => ({
          ...prev,
          energyLevel: level,
          flowType: 'restart',
        }));
      } else if (choice === 'daily' || choice === 'distracted') {
        // 日常小事/注意力拐跑 → 快速模式红灯分支
        setState(prev => ({
          ...prev,
          energyLevel: level,
          flowType: 'quick',
          quickStep: choice === 'distracted' ? 'attention' : 'action',
        }));
      } else if (choice === 'important') {
        // 重要的事 → 完整模式红灯分支（FullMode内置红色处理）
        setState(prev => ({
          ...prev,
          energyLevel: level,
          flowType: 'full',
        }));
      }
      return;
    }

    // 根据入口选择分流（黄灯/绿灯）
    if (choice === 'blank') {
      // 大脑空白 → 重启模式
      setState(prev => ({
        ...prev,
        energyLevel: level,
        flowType: 'restart',
      }));
    } else if (choice === 'daily' || choice === 'distracted') {
      // 日常小事/注意力拐跑 → 快速模式
      setState(prev => ({
        ...prev,
        energyLevel: level,
        flowType: 'quick',
        quickStep: choice === 'distracted' ? 'attention' : 'action',
      }));
    } else if (choice === 'important') {
      // 重要的事 → FullMode（内置红/黄/绿三色分支）
      setState(prev => ({
        ...prev,
        energyLevel: level,
        flowType: 'full',
      }));
    }
  };

  const handleRestart = () => {
    setState({
      flowType: 'entry',
      entryChoice: null,
      quickStep: 'action',
      energyLevel: null,
      task: '',
      firstStep: '',
      countdown: 0,
    });
    setQuickRedAlarm(false);
  };

  const handleComplete = () => {
    setState(prev => ({ ...prev, flowType: 'complete' }));
  };

  if (!mounted) return null;

  // 快速模式步骤号（能量评估已前置，不再计入快速模式）
  const quickStepNumber = state.entryChoice === 'daily' ? 1 : (state.quickStep === 'attention' ? 1 : 2);
  const quickTotalSteps = state.entryChoice === 'daily' ? 1 : 2;

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#2D2D2D] pb-24">
      <ChatClient onStateUpdate={setCptsdState} />

      {/* 顶部导航栏 */}
      {state.flowType !== 'entry' && state.flowType !== 'energy' && state.flowType !== 'complete' && (
        <div className="sticky top-0 z-10 bg-[#FAFAF9]/90 backdrop-blur-sm border-b border-border/30">
          <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground gap-1"
              onClick={handleRestart}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 8a6 6 0 0 1 10.47-4M14 8a6 6 0 0 1-10.47 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M14 2v4h-4M2 14v-4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              重新开始
            </Button>
            <span className="text-xs text-muted-foreground font-medium">
              {state.flowType === 'quick' ? '快速模式' :
               state.flowType === 'restart' ? '重启模式' :
               state.flowType === 'full' ? '完整模式' : ''}
            </span>
            <div className="w-16" />
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto px-4 pt-8">

        {/* ======== 入口分流页面 ======== */}
        {state.flowType === 'entry' && (
          <div className="animate-fadeIn">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-semibold mb-2">拖延自救启动器</h1>
              <p className="text-muted-foreground text-sm">你现在什么情况？</p>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { emoji: '🍳', title: '日常小事拖沓', desc: '做饭、洗衣、打扫不想做', choice: 'daily' as EntryChoice },
                { emoji: '🧠', title: '大脑突然空白', desc: '脑子空了，什么都不想做', choice: 'blank' as EntryChoice },
                { emoji: '📱', title: '注意力被拐跑了', desc: '本来做正事，结果刷了好久手机', choice: 'distracted' as EntryChoice },
                { emoji: '🏔️', title: '重要的事一直拖着', desc: '找工作、写论文、发作品', choice: 'important' as EntryChoice },
              ].map(item => (
                <button
                  key={item.choice}
                  className="w-full bg-card border border-border rounded-2xl p-5 text-left hover:border-primary/30 hover:shadow-sm transition-all duration-200 active:scale-[0.98]"
                  onClick={() => handleEntryChoice(item.choice)}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-3xl mt-0.5">{item.emoji}</span>
                    <div>
                      <div className="font-semibold text-lg mb-0.5">{item.title}</div>
                      <div className="text-sm text-muted-foreground">{item.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ======== v3: 能量评估（公共前置模块） ======== */}
        {state.flowType === 'energy' && (
          <div className="animate-fadeIn">
            {/* 重启模式：3秒无反应自动红灯 */}
            {state.entryChoice === 'blank' && (
              <AutoRedDetect onAutoRed={() => handleEnergySelect('red')} />
            )}
            <StepLabel label="先看看你的状态" step={1} total={1} />
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold mb-2">先看看你的状态</h2>
              <p className="text-sm text-muted-foreground">
                {state.entryChoice === 'blank'
                  ? '大脑空白时，先确认身体的能量水平'
                  : '选一个最接近你现在感觉的'}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { emoji: '🔴', label: '红灯', sub: '特别累', level: 'red' as EnergyLevel },
                { emoji: '🟡', label: '黄灯', sub: '有点累', level: 'yellow' as EnergyLevel },
                { emoji: '🟢', label: '绿灯', sub: '有精神', level: 'green' as EnergyLevel },
              ].map(opt => (
                <button
                  key={opt.level}
                  className="bg-card border border-border rounded-2xl p-5 text-center hover:border-primary/30 hover:shadow-sm transition-all duration-200 active:scale-[0.98]"
                  onClick={() => handleEnergySelect(opt.level)}
                >
                  <div className="text-3xl mb-2">{opt.emoji}</div>
                  <div className="font-semibold text-base">{opt.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ======== 快速模式（v3统一版：红/黄/绿灯分支） ======== */}
        {state.flowType === 'quick' && (
          <div className="animate-fadeIn">
            <StepNav
              currentStep={quickStepNumber}
              totalSteps={quickTotalSteps}
              onPrev={
                state.quickStep === 'attention'
                  ? undefined
                  : state.quickStep === 'action' && state.entryChoice === 'distracted'
                    ? () => setState(prev => ({ ...prev, quickStep: 'attention' }))
                    : undefined
              }
              onNext={
                state.quickStep === 'attention'
                  ? () => setState(prev => ({ ...prev, quickStep: 'action' }))
                  : undefined
              }
            />

            {/* 注意力回收（仅入口C：注意力被拐跑） */}
            {state.quickStep === 'attention' && state.entryChoice === 'distracted' && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-center mb-2">把注意力拉回来</h2>
                <p className="text-center text-sm text-muted-foreground mb-6">
                  看窗外10秒，找最远的东西盯着看
                </p>
                {state.energyLevel === 'red' ? (
                  /* 红灯：只做10秒窗外注视，不做输入框 */
                  <div className="text-center">
                    {state.countdown === 0 ? (
                      <button
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity active:scale-[0.98]"
                        onClick={() => setState(prev => ({ ...prev, countdown: 10 }))}
                      >
                        开始10秒倒计时
                      </button>
                    ) : (
                      <>
                        <div className="text-6xl font-bold text-primary mb-4">{state.countdown}</div>
                        <p className="text-sm text-muted-foreground">盯着最远的东西，坚持住...</p>
                        {state.countdown === 1 && (
                          <button
                            className="mt-4 text-sm text-primary hover:underline"
                            onClick={() => setState(prev => ({ ...prev, quickStep: 'action' }))}
                          >
                            看完了，继续 →
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  /* 黄灯/绿灯：标准流程 */
                  <>
                    {quickAttentionStep === 'counting' ? (
                      <div className="text-center">
                        <div className="text-6xl font-bold text-primary mb-6">
                          {state.countdown > 0 ? state.countdown : (
                            <span className="text-xl font-normal text-muted-foreground">
                              深吸一口气，准备好了吗？
                            </span>
                          )}
                        </div>
                        {state.countdown === 0 ? (
                          <div className="flex justify-center gap-3">
                            <button
                              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity active:scale-[0.98]"
                              onClick={() => setState(prev => ({ ...prev, countdown: 10 }))}
                            >
                              开始10秒倒计时
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">盯着最远的东西，坚持住...</p>
                        )}
                        {state.countdown === 0 && quickAttentionStep === 'counting' && (
                          <button
                            className="mt-4 text-sm text-primary hover:underline"
                            onClick={() => setQuickAttentionStep('input')}
                          >
                            已经看完了 →
                          </button>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-muted-foreground mb-3">你本来要做的事是什么？</p>
                        <Input
                          value={state.task}
                          onChange={e => setState(prev => ({ ...prev, task: e.target.value }))}
                          placeholder="一句话就行，不填也没关系"
                          className="mb-3"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* 最小动作（步骤3/3） */}
            {state.quickStep === 'action' && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-center mb-2">只做一步就够了</h2>
                <p className="text-center text-sm text-muted-foreground mb-6">
                  {state.energyLevel === 'red'
                    ? '今天不用走完。只做最小的动作就行。'
                    : state.energyLevel === 'yellow'
                      ? '不用完整计划，就第一步（文字量已减半）'
                      : '不用完整计划，就第一步'}
                </p>

                {/* 绿灯：增加提示 */}
                {state.energyLevel === 'green' && (
                  <p className="text-center text-xs text-primary mb-4">
                    💡 有精神可以直接去做，不用非写下来
                  </p>
                )}

                {/* 红灯最小动作：简化版 */}
                {state.energyLevel === 'red' ? (
                  <>
                    {!quickRedAlarm ? (
                      <>
                        <Input
                          value={state.firstStep}
                          onChange={e => setState(prev => ({ ...prev, firstStep: e.target.value }))}
                          placeholder="这件事最小的第一步是什么？"
                          className="mb-4"
                        />
                        {state.firstStep.trim() && (
                          <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-center">
                              疗愈助手已自动打开，和它聊聊再设定闹钟吧
                            </div>
                            <button
                              className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity active:scale-[0.98]"
                              onClick={() => {
                                // 触发AI驳斥内在批判者
                                const event = new CustomEvent('openChatSDK', {
                                  detail: {
                                    initialMessage: `我在${state.entryChoice === 'daily' ? '日常小事拖延' : '被手机拐跑注意力'}，能量🔴，快速模式。请驳斥内在批判者。`
                                  }
                                });
                                window.dispatchEvent(event);
                                setQuickRedAlarm(true);
                              }}
                            >
                              💬 聊完了，设闹钟
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-accent/50 rounded-xl p-4">
                          <p className="text-sm text-muted-foreground text-center">
                            ⏰ 在你的手机上设一个5分钟闹钟。闹钟响之前只做这件事。
                          </p>
                        </div>
                        <button
                          className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity active:scale-[0.98]"
                          onClick={handleComplete}
                        >
                          ✅ 闹钟设好了，开始！
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  /* 黄灯/绿灯：标准最小动作 */
                  <>
                    <Input
                      value={state.firstStep}
                      onChange={e => setState(prev => ({ ...prev, firstStep: e.target.value }))}
                      placeholder="这件事最小的第一步是什么？"
                      className="mb-4"
                    />
                    <div className="bg-accent/50 rounded-xl p-4 mb-6">
                      <p className="text-sm text-muted-foreground text-center">
                        ⏰ 在你的手机上设一个5分钟闹钟。闹钟响之前只做这件事。
                      </p>
                    </div>
                    <button
                      className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity active:scale-[0.98]"
                      onClick={handleComplete}
                    >
                      ✅ 闹钟设好了，开始！
                    </button>

                    {/* 黄灯：完成后可选和疗愈助手聊聊 */}
                    {state.energyLevel === 'yellow' && state.firstStep.trim() && (
                      <button
                        className="w-full mt-3 py-3 border border-border rounded-xl font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                        onClick={() => {
                          const event = new CustomEvent('openChatSDK', {
                            detail: {
                              initialMessage: `我刚刚设了闹钟准备做：${state.firstStep}。能量🔵，快速模式。请帮我识别内在批判者。`
                            }
                          });
                          window.dispatchEvent(event);
                        }}
                      >
                        💬 和疗愈助手聊聊
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======== 重启模式 ======== */}
        {state.flowType === 'restart' && (
          <RestartMode
            onComplete={handleComplete}
            onRestart={handleRestart}
            updateCPTSDState={updateCPTSDState}
            energyLevel={state.energyLevel || undefined}
          />
        )}

        {/* ======== 完整模式 ======== */}
        {state.flowType === 'full' && (
          <FullMode
            onComplete={handleComplete}
            onRestart={handleRestart}
            updateCPTSDState={updateCPTSDState}
            energyLevel={state.energyLevel || 'green'}
          />
        )}

        {/* ======== 完成页 ======== */}
        {state.flowType === 'complete' && (
          <CompletePage onRestart={handleRestart} />
        )}
      </div>

      {/* 底部安全提示 */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#FAFAF9]/95 backdrop-blur-sm border-t border-border/30 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            ⚠️ 这不是心理咨询。你随时可以停下来。
          </p>
          {state.flowType === 'complete' && (
            <button
              onClick={() => setShowRecords(!showRecords)}
              className="text-xs text-primary hover:underline"
            >
              📊 {showRecords ? '收起' : '行动记录'}
            </button>
          )}
        </div>
        {showRecords && (
          <div className="max-w-md mx-auto px-4 pb-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="text-sm font-semibold mb-2">历史行动记录</h4>
              {records.length === 0 ? (
                <p className="text-xs text-muted-foreground">还没有记录。完成一次行动后这里会有数据。</p>
              ) : (
                <div className="space-y-2">
                  {records.slice(-5).reverse().map((r, i) => (
                    <div key={i} className="text-xs p-2 bg-background rounded-lg">
                      <div className="text-muted-foreground">{r.date}</div>
                      <div className="mt-1">
                        <span className={cn(
                          'inline-block px-1.5 py-0.5 rounded text-xs font-medium',
                          r.resultType === 'better' ? 'bg-emerald-100 text-emerald-700' :
                          r.resultType === 'similar' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        )}>
                          {r.resultType === 'better' ? '比预期好' : r.resultType === 'similar' ? '差不多' : '不如预期'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
