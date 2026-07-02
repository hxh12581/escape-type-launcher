'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AttentionToolbox from '@/components/AttentionToolbox';
import StageFreeze from '@/components/StageFreeze';
import StageFragmented from '@/components/StageFragmented';
import StageFlight from '@/components/StageFlight';
import StageSelfBlame from '@/components/StageSelfBlame';

type StageType = 'freeze' | 'fragmented' | 'flight' | 'self_blame';
type EnergyLevel = 'red' | 'yellow' | 'green';
type FlowType = 'entry' | 'energy' | 'stage' | 'complete';

const ENERGY_LABEL: Record<EnergyLevel, { label: string; sub: string }> = {
  red:    { label: '低能量', sub: '只做最基本的就够了' },
  yellow: { label: '中等能量', sub: '做到够用就好' },
  green:  { label: '高能量', sub: '可以走完整流程' },
};

const STAGE_INFO = {
  flight:     { emoji: '🏔️', label: '重要的事一直拖', desc: '知道该做但一直在准备、总想"再想清楚一点"' },
  fragmented: { emoji: '📱', label: '注意力失调', desc: '老被弹窗/消息拐跑、没法专注一件事、频繁切任务' },
  freeze:     { emoji: '🧠', label: '大脑宕机了', desc: '脑子发懵、放空、转不动、眼皮沉' },
  self_blame: { emoji: '🌙', label: '今天又废了', desc: '自责、想挽回但动不了、睡不着又不甘心' },
} as const;

const getMaxLayers = (stage: StageType, energy: EnergyLevel): number => {
  const matrix: Record<StageType, Record<EnergyLevel, number>> = {
    freeze:     { red: 1, yellow: 2, green: 3 },
    fragmented: { red: 1, yellow: 2, green: 3 },
    flight:     { red: 2, yellow: 3, green: 3 },
    self_blame: { red: 1, yellow: 2, green: 4 },
  };
  return matrix[stage][energy];
};

function CompletePage({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="animate-fadeIn text-center">
      <div className="text-6xl mb-8">🌱</div>
      <h2 className="text-2xl font-semibold mb-3">你已经做了一个动作</h2>
      <p className="text-muted-foreground mb-8 leading-relaxed">
        这个动作本身就是"做了什么"。
        <br />
        不需要再做更多。
      </p>
      <button
        onClick={onRestart}
        className="inline-flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-xl text-foreground hover:bg-accent hover:border-primary/30 transition-all duration-200 active:scale-[0.98]"
      >
        <span className="text-lg">🔄</span>
        <span className="font-medium">重新评估</span>
      </button>
      <p className="text-xs text-muted-foreground mt-6">
        🌱 每个动作都算数
      </p>
    </div>
  );
}

export default function Home() {
  const [flow, setFlow] = useState<FlowType>('entry');
  const [stage, setStage] = useState<StageType | null>(null);
  const [energy, setEnergy] = useState<EnergyLevel | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showToolbox, setShowToolbox] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleStageSelect = (s: StageType) => {
    setStage(s);
    setFlow('energy');
  };

  const handleEnergySelect = (e: EnergyLevel) => {
    setEnergy(e);
    setFlow('stage');
  };

  const handleBackToEnergy = () => {
    setFlow('energy');
    // 保持 stage 不变，回到能量选择
  };

  const handleComplete = () => {
    setFlow('complete');
  };

  const handleRestart = () => {
    setFlow('entry');
    setStage(null);
    setEnergy(null);
  };

  const handleStageSwitch = () => {
    if (stage) {
      setFlow('energy');
    } else {
      setFlow('entry');
    }
  };

  if (!mounted) return null;

  const showFloatingButtons = flow === 'stage';

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#2D2D2D] pb-24">
      {/* Top nav (only during stage) */}
      {flow === 'stage' && stage && (
        <div className="sticky top-0 z-10 bg-[#FAFAF9]/90 backdrop-blur-sm border-b border-border/30">
          <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1" onClick={handleRestart}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 8a6 6 0 0 1 10.47-4M14 8a6 6 0 0 1-10.47 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M14 2v4h-4M2 14v-4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              重新开始
            </Button>
            <span className="text-xs text-muted-foreground font-medium">{STAGE_INFO[stage].label}</span>
            <div className="w-16" />
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto px-4 pt-8">

        {/* ========== ENTRY: 4 stage buttons ========== */}
        {flow === 'entry' && (
          <div className="animate-fadeIn">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-semibold mb-2">拖延自救启动器</h1>
              <p className="text-muted-foreground text-sm">你现在在哪个状态？</p>
            </div>
            <div className="flex flex-col gap-4">
              {(Object.entries(STAGE_INFO) as [StageType, typeof STAGE_INFO[StageType]][]).map(([key, info]) => (
                <button
                  key={key}
                  className="w-full bg-card border border-border rounded-2xl p-5 text-left hover:border-primary/30 hover:shadow-sm transition-all duration-200 active:scale-[0.98]"
                  onClick={() => handleStageSelect(key)}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-3xl mt-0.5">{info.emoji}</span>
                    <div>
                      <div className="font-semibold text-lg mb-0.5">{info.label}</div>
                      <div className="text-sm text-muted-foreground">{info.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ========== ENERGY ASSESSMENT ========== */}
        {flow === 'energy' && (
          <div className="animate-fadeIn">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold mb-2">
                {stage ? STAGE_INFO[stage].emoji : ''} 先看看你的能量
              </h2>
              <p className="text-sm text-muted-foreground">
                {stage ? `"${STAGE_INFO[stage].label}"状态下，你现在还有多少力气？` : '选一个最接近你现在感觉的'}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { emoji: '🔴', label: '红灯', sub: '特别累', value: 'red' as EnergyLevel },
                { emoji: '🟡', label: '黄灯', sub: '有点累', value: 'yellow' as EnergyLevel },
                { emoji: '🟢', label: '绿灯', sub: '有精神', value: 'green' as EnergyLevel },
              ].map(opt => (
                <button
                  key={opt.value}
                  className="bg-card border border-border rounded-2xl p-5 text-center hover:border-primary/30 hover:shadow-sm transition-all duration-200 active:scale-[0.98]"
                  onClick={() => handleEnergySelect(opt.value)}
                >
                  <div className="text-3xl mb-2">{opt.emoji}</div>
                  <div className="font-semibold text-base">{opt.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{opt.sub}</div>
                </button>
              ))}
            </div>
            <div className="text-center">
              <button
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleRestart}
              >
                ← 重新选择状态
              </button>
            </div>
          </div>
        )}

        {/* ========== STAGE FLOW ========== */}
        {flow === 'stage' && stage && energy && (
          <>
            {stage === 'freeze' && (
              <StageFreeze
                energyLevel={energy}
                maxLayers={getMaxLayers(stage, energy)}
                onComplete={handleComplete}
                onRestart={handleRestart}
                onBackToEnergy={handleBackToEnergy}
                openToolbox={() => setShowToolbox(true)}
              />
            )}
            {stage === 'fragmented' && (
              <StageFragmented
                energyLevel={energy}
                maxLayers={getMaxLayers(stage, energy)}
                onComplete={handleComplete}
                onRestart={handleRestart}
                onBackToEnergy={handleBackToEnergy}
                openToolbox={() => setShowToolbox(true)}
              />
            )}
            {stage === 'flight' && (
              <StageFlight
                energyLevel={energy}
                maxLayers={getMaxLayers(stage, energy)}
                onComplete={handleComplete}
                onRestart={handleRestart}
                onBackToEnergy={handleBackToEnergy}
                openToolbox={() => setShowToolbox(true)}
              />
            )}
            {stage === 'self_blame' && (
              <StageSelfBlame
                energyLevel={energy}
                maxLayers={getMaxLayers(stage, energy)}
                onComplete={handleComplete}
                onRestart={handleRestart}
                onBackToEnergy={handleBackToEnergy}
                openToolbox={() => setShowToolbox(true)}
              />
            )}
          </>
        )}

        {/* ========== COMPLETE PAGE ========== */}
        {flow === 'complete' && (
          <CompletePage onRestart={handleRestart} />
        )}
      </div>

      {/* ========== FLOATING BUTTONS ========== */}
      {showFloatingButtons && (
        <div className="fixed bottom-4 right-4 z-20 flex flex-col gap-2">
          {/* Attention toolbox */}
          <button
            className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center text-xl hover:opacity-90 transition-opacity active:scale-95"
            onClick={() => setShowToolbox(true)}
            title="注意力工具"
          >
            🎯
          </button>

          {/* Stage switch */}
          <button
            className="w-12 h-12 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-lg hover:bg-accent transition-colors active:scale-95"
            onClick={handleStageSwitch}
            title="我的状态变了"
          >
            🔄
          </button>
        </div>
      )}

      {/* Bottom safety notice */}
      {flow !== 'stage' && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#FAFAF9]/95 backdrop-blur-sm border-t border-border/30 z-10">
          <div className="max-w-md mx-auto px-4 py-3">
            <p className="text-xs text-muted-foreground text-center">
              ⚠️ 这不是心理咨询。你随时可以停下来。
            </p>
          </div>
        </div>
      )}

      {/* Attention Toolbox Modal */}
      <AttentionToolbox
        open={showToolbox}
        onClose={() => setShowToolbox(false)}
        stage={stage}
        energy={energy}
      />
    </div>
  );
}
