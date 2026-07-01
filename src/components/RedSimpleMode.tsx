'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface RedSimpleModeProps {
  onComplete: () => void;
  onRestart: () => void;
  updateCPTSDState: (state: any) => void;
}

type RedStep = 'intro' | 'critique' | 'micro_action';

export default function RedSimpleMode({ onComplete, onRestart, updateCPTSDState }: RedSimpleModeProps) {
  const [step, setStep] = useState<RedStep>('intro');
  const [critique, setCritique] = useState('');
  const [microAction, setMicroAction] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="animate-fadeIn flex flex-col gap-6 max-w-md mx-auto px-4 pt-12">
      {/* Intro - 提示卡片 */}
      {step === 'intro' && (
        <>
          <div className="bg-card rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">今天不需要完整流程</h2>
            <p className="text-muted-foreground mb-4">
              你的神经系统现在需要休息，不是push。我们只做两件事：
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>识别自我批评的声音</li>
              <li>做最小的一个动作</li>
            </ul>
          </div>
          
          <Button
            size="lg"
            className="w-full animate-fadeIn"
            onClick={() => setStep('critique')}
          >
            继续
          </Button>
        </>
      )}
      
      {/* Step 1: 识别批判者 */}
      {step === 'critique' && (
        <>
          <h2 className="text-2xl font-semibold text-center mb-8">
            你脑子里最响的那句自我批评是什么？
          </h2>
          
          <Input
            value={critique}
            onChange={(e) => setCritique(e.target.value)}
            placeholder="比如：我太懒了、我什么都做不好……"
            className="mb-6"
          />
          
          <Button
            size="lg"
            className="w-full animate-fadeIn"
            onClick={() => {
              updateCPTSDState({
                critiqueContent: critique,
                currentStep: 'red_critique'
              });
              // 这里应该触发Chat SDK打开
              // 由于ChatClient组件已经初始化，用户可以手动点击右下角的悬浮球
              setStep('micro_action');
            }}
            disabled={!critique.trim()}
          >
            告诉疗愈助手 →
          </Button>
          
          <p className="text-center text-xs text-muted-foreground mt-4">
            点击后会打开右下角的疗愈助手悬浮窗
          </p>
        </>
      )}
      
      {/* Step 2: 最小动作 */}
      {step === 'micro_action' && (
        <>
          <h2 className="text-2xl font-semibold text-center mb-8">
            今天最小的一个动作
          </h2>
          
          <p className="text-center text-muted-foreground mb-6">
            简单到不可能失败
          </p>
          
          <Input
            value={microAction}
            onChange={(e) => setMicroAction(e.target.value)}
            placeholder="比如：打开文档、站起来走两步……"
            className="mb-6"
          />
          
          <p className="text-center text-muted-foreground mb-6">
            在手机上设5分钟闹钟，闹钟响之前只做这件事
          </p>
          
          <Button
            size="lg"
            className="w-full animate-fadeIn"
            onClick={() => {
              updateCPTSDState({
                targetAction: microAction,
                currentStep: 'red_complete',
                totalActions: (JSON.parse(localStorage.getItem('cptsd_app_state') || '{}').totalActions || 0) + 1
              });
              onComplete();
            }}
            disabled={!microAction.trim()}
          >
            ✅ 闹钟设好了，开始！
          </Button>
        </>
      )}
    </div>
  );
}