'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface YellowFlowModeProps {
  onComplete: () => void;
  onRestart: () => void;
  updateCPTSDState: (state: any) => void;
}

type YellowStep = 'body' | 'ai_critique' | 'energy_allocation' | 'micro_action' | 'closure';

export default function YellowFlowMode({ onComplete, onRestart, updateCPTSDState }: YellowFlowModeProps) {
  const [step, setStep] = useState<YellowStep>('body');
  const [bodyAction, setBodyAction] = useState('');
  const [energyRemaining, setEnergyRemaining] = useState<'2min' | '5min' | null>(null);
  const [microAction, setMicroAction] = useState('');
  const [didAction, setDidAction] = useState<boolean | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (!mounted) return null;

  const bodyActions = [
    { id: 'ice', emoji: '🧊', label: '如果有冰块——握在手心，感受冰冷', duration: 10 },
    { id: 'water', emoji: '💧', label: '冷水冲手腕10秒', duration: 10 },
    { id: 'grip', emoji: '✊', label: '用力握拳5秒→缓慢松开，感受手指温度变化', duration: 5 },
  ];

  return (
    <div className="animate-fadeIn flex flex-col gap-6 max-w-md mx-auto px-4 pt-12">
      {/* H1: 快速身体介入 */}
      {step === 'body' && (
        <>
          <h2 className="text-xl font-semibold text-center mb-6">先给神经系统一个信号</h2>
          
          <div className="space-y-3 mb-6">
            {bodyActions.map((action) => (
              <Button
                key={action.id}
                size="lg"
                variant="outline"
                className="w-full text-left animate-fadeIn"
                onClick={() => {
                  setBodyAction(action.label);
                  setCountdown(action.duration);
                }}
                style={{ animationDelay: `${bodyActions.indexOf(action) * 100}ms` }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{action.emoji}</span>
                  <span className="text-sm">{action.label}</span>
                </div>
              </Button>
            ))}
          </div>
          
          {/* 倒计时 */}
          {countdown > 0 && (
            <div className="text-center animate-fadeIn">
              <div className="text-6xl font-bold text-primary mb-6">
                {countdown}
              </div>
              <p className="text-muted-foreground">感受身体的信号</p>
            </div>
          )}
          
          {countdown === 0 && bodyAction && (
            <Button
              size="lg"
              className="w-full animate-fadeIn"
              onClick={() => {
                updateCPTSDState({ currentStep: 'yellow_ai_critique' });
                setStep('ai_critique');
              }}
            >
              感觉到了，继续 →
            </Button>
          )}
        </>
      )}
      
      {/* H2: AI驳斥批判者 */}
      {step === 'ai_critique' && (
        <>
          <h2 className="text-xl font-semibold text-center mb-6">让疗愈助手帮你识别内在批判者</h2>
          
          <p className="text-center text-muted-foreground mb-6 text-sm">
            （黄灯模式下，文字量已减半）
          </p>
          
          <div className="bg-card rounded-lg p-4 mb-6">
            <p className="text-sm mb-4">
              疗愈助手会帮你识别和驳斥内在批判者。
              右下角的悬浮窗会自动打开。
            </p>
          </div>
          
          <Button
            size="lg"
            className="w-full animate-fadeIn"
            onClick={() => {
              updateCPTSDState({ 
                currentStep: 'yellow_energy_allocation',
                isStuck: false
              });
              setStep('energy_allocation');
            }}
          >
            聊完了，继续行动 →
          </Button>
          
          <p className="text-center text-xs text-muted-foreground mt-4">
            点击右下角悬浮球打开疗愈助手
          </p>
        </>
      )}
      
      {/* H3: 能量分配 */}
      {step === 'energy_allocation' && (
        <>
          <h2 className="text-xl font-semibold text-center mb-6">你现在大概还剩多少力气？</h2>
          
          <p className="text-center text-muted-foreground mb-6 text-sm">
            （不设超过5分钟的选项——黄灯用户应降低标准）
          </p>

          <div className="flex gap-3">
            <Button
              size="lg"
              className="flex-1 animate-fadeIn"
              variant={energyRemaining === '2min' ? 'default' : 'outline'}
              onClick={() => {
                setEnergyRemaining('2min');
                updateCPTSDState({ energyRemaining: '2min' });
              }}
            >
              <div className="text-center">
                <div className="text-lg font-semibold">够2分钟</div>
                <div className="text-xs text-muted-foreground">最微小的动作</div>
              </div>
            </Button>

            <Button
              size="lg"
              className="flex-1 animate-fadeIn"
              variant={energyRemaining === '5min' ? 'default' : 'outline'}
              onClick={() => {
                setEnergyRemaining('5min');
                updateCPTSDState({ energyRemaining: '5min' });
              }}
              style={{ animationDelay: '100ms' }}
            >
              <div className="text-center">
                <div className="text-lg font-semibold">够5分钟</div>
                <div className="text-xs text-muted-foreground">一个小步骤</div>
              </div>
            </Button>
          </div>
          
          {energyRemaining && (
            <Button
              size="lg"
              className="w-full animate-fadeIn mt-6"
              onClick={() => {
                setStep('micro_action');
                updateCPTSDState({ currentStep: 'yellow_micro_action' });
              }}
            >
              继续 →
            </Button>
          )}
        </>
      )}
      
      {/* H4: 微动作执行 */}
      {step === 'micro_action' && (
        <>
          <h2 className="text-xl font-semibold text-center mb-6">
            接下来{energyRemaining === '2min' ? '2分钟' : '5分钟'}，你只做这一件事
          </h2>
          
          <Input
            value={microAction}
            onChange={(e) => setMicroAction(e.target.value)}
            placeholder="写下来……"
            className="mb-6"
          />
          
          {/* 倒计时 */}
          {countdown > 0 ? (
            <div className="text-center animate-fadeIn">
              <div className="text-6xl font-bold text-primary mb-6">
                {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
              </div>
              <p className="text-muted-foreground mb-4">⏰ 闹钟设好了吗？没设的话现在设一个。</p>
              
              <Button
                size="lg"
                variant="outline"
                className="animate-fadeIn"
                onClick={() => setCountdown(0)}
              >
                我动了！提前结束
              </Button>
            </div>
          ) : (
            <>
              <p className="text-center text-muted-foreground mb-6">
                ⏰ 在手机上设一个闹钟
              </p>
              
              <Button
                size="lg"
                className="w-full animate-fadeIn"
                onClick={() => {
                  const minutes = energyRemaining === '2min' ? 2 : 5;
                  setCountdown(minutes * 60);
                }}
                disabled={!microAction.trim()}
              >
                ✅ 闹钟设好了，开始！
              </Button>
            </>
          )}
          
          {countdown === 0 && microAction && (
            <Button
              size="lg"
              className="w-full animate-fadeIn mt-4"
              onClick={() => {
                setStep('closure');
                updateCPTSDState({ currentStep: 'yellow_closure' });
              }}
            >
              完成 →
            </Button>
          )}
        </>
      )}
      
      {/* H5: 快速收束 */}
      {step === 'closure' && (
        <>
          <h2 className="text-xl font-semibold text-center mb-6">你动了吗？</h2>
          
          <div className="flex gap-4">
            <Button
              size="lg"
              className="flex-1 animate-fadeIn"
              onClick={() => {
                setDidAction(true);
                updateCPTSDState({
                  currentStep: 'yellow_complete',
                  totalActions: (JSON.parse(localStorage.getItem('cptsd_app_state') || '{}').totalActions || 0) + 1,
                  evidenceLog: [
                    ...(JSON.parse(localStorage.getItem('cptsd_app_state') || '{}').evidenceLog || []),
                    {
                      date: new Date().toLocaleDateString(),
                      expected: '黄灯模式行动',
                      actual: '已完成',
                      result: 'better'
                    }
                  ]
                });
              }}
            >
              我动了！
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="flex-1 animate-fadeIn"
              onClick={() => {
                setDidAction(false);
                updateCPTSDState({
                  currentStep: 'yellow_rest'
                });
              }}
              style={{ animationDelay: '100ms' }}
            >
              没动……
            </Button>
          </div>
          
          {didAction === true && (
            <div className="animate-fadeIn bg-green-50 rounded-lg p-4 mt-6">
              <p className="text-center text-green-700">
                你动了。不管做了多少。现在去休息。
              </p>
            </div>
          )}
          
          {didAction === false && (
            <div className="animate-fadeIn bg-card rounded-lg p-4 mt-6">
              <p className="text-center text-muted-foreground mb-4">
                没关系。休息也是需要的。
              </p>
              <p className="text-center text-xs text-muted-foreground">
                如果你想聊聊为什么没动，点右下角疗愈助手。
              </p>
            </div>
          )}
          
          {(didAction !== null) && (
            <Button
              size="lg"
              className="w-full animate-fadeIn mt-6"
              onClick={onComplete}
            >
              完成
            </Button>
          )}
        </>
      )}
    </div>
  );
}