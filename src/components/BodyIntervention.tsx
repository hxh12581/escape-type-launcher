'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type BodyMethod = 
  | 'ice_face'
  | 'cold_face'
  | 'voo_sound'
  | 'orienting'
  | 'shake_out'
  | 'walk_out'
  | 'hand_chest'
  | 'extended_breath'
  | 'visual_grounding'
  | 'touch_grounding'
  | 'breathing_grounding'
  | 'voo_grounding';

interface BodyMethodConfig {
  id: BodyMethod;
  title: string;
  emoji: string;
  pathway: string;
  scienceLabel: string;
  duration: number;
  description: string;
  completionPrompt: string;
  recommended?: boolean;
}

// 身体干预方法配置库 - 通俗易懂版
export const BODY_METHODS: Record<BodyMethod, BodyMethodConfig> = {
  // 冷通路(潜水反射)
  ice_face: {
    id: 'ice_face',
    title: '冰块贴脸 + 屏住呼吸',
    emoji: '🧊',
    pathway: '冷敷法（需要冰块）',
    scienceLabel: '脸部遇冷 + 屏住呼吸 → 身体自动放松',
    duration: 15,
    description: '用薄毛巾包住冰块，贴在脸颊或额头上。同时屏住呼吸15秒。然后拿下来，深深呼一口气。你会感觉到心跳慢慢变慢，身体松下来。',
    completionPrompt: '感受身体的变化——心跳有没有慢一点？肩膀有没有松一点？',
    recommended: true,
  },
  cold_face: {
    id: 'cold_face',
    title: '冷水冲脸 + 屏住呼吸',
    emoji: '💧',
    pathway: '冷敷法（有自来水就行）',
    scienceLabel: '冷水 + 屏住呼吸 → 同样能让身体放松',
    duration: 10,
    description: '用手捧冷水拍脸10次，拍的时候屏住呼吸。然后擦干脸，慢慢呼一口气。没有冰块也能达到类似的效果。',
    completionPrompt: '感受到冷水的刺激了吗？',
  },
  
  // 迷走神经通路
  voo_sound: {
    id: 'voo_sound',
    title: '哼唱 / 发出"呜——"声',
    emoji: '🎵',
    pathway: '声音放松法（零道具）',
    scienceLabel: '声带振动 → 通过喉咙的神经 → 告诉大脑"安全了"',
    duration: 30,
    description: '深吸一口气，用低沉的声音发出"呜——"（像念英文的"voo"），尽量拉长。感受喉咙和胸口的微微振动。重复3次。这个动作在公共场合也能小声做，不会引人注意。',
    completionPrompt: '感受到喉咙和胸口的振动了吗？',
  },
  extended_breath: {
    id: 'extended_breath',
    title: '拉长呼气',
    emoji: '🌬',
    pathway: '声音放松法（零道具）',
    scienceLabel: '呼气比吸气长 → 身体自然放松',
    duration: 30,
    description: '鼻子吸气4秒，嘴巴慢慢呼气6秒——像用吸管轻轻吹气那样。重复5轮。关键是呼得比吸得长，不用深呼吸，自然地就好。',
    completionPrompt: '感受到呼吸变慢了吗？',
  },
  hand_chest: {
    id: 'hand_chest',
    title: '手放胸口',
    emoji: '🤲',
    pathway: '声音放松法（零道具）',
    scienceLabel: '温暖的手掌 → 身体释放安抚激素',
    duration: 30,
    description: '右手放在胸口心脏位置，感受手掌的温度和压力。感受随着呼吸，手在微微起伏。保持30秒。这是最古老的自我安抚方式，任何时候都能做。',
    completionPrompt: '感受到手掌的温度和呼吸的起伏了吗？',
  },
  
  // 运动通路
  orienting: {
    id: 'orienting',
    title: '慢慢转头看看周围',
    emoji: '👀',
    pathway: '身体运动法（不用起身）',
    scienceLabel: '慢慢转头 → 让大脑确认"这里没有危险"',
    duration: 30,
    description: '慢慢地把头转向左边，眼睛扫一遍看到的东西。再慢慢转向右边，扫一遍。回到中间。问问自己："这个房间里有实际的危险吗？"——通常你会发现，答案是没有。',
    completionPrompt: '确认了——这里没有危险。',
  },
  shake_out: {
    id: 'shake_out',
    title: '抖一抖身体',
    emoji: '🤲',
    pathway: '身体运动法（需要站起来）',
    scienceLabel: '抖掉紧张 → 身体松一口气',
    duration: 30,
    description: '站起来，双手自然下垂。先轻轻抖手腕，慢慢扩展到手臂、肩膀、上半身，最后到腿。像把身上的水抖掉一样。持续30秒后停下来，深呼吸。动物在紧张后都会这样做——这是身体的自然本能。',
    completionPrompt: '感受到身体放松了吗？',
  },
  walk_out: {
    id: 'walk_out',
    title: '出门走5分钟',
    emoji: '🚶',
    pathway: '身体运动法（需要出门）',
    scienceLabel: '左右脚交替走 + 看远处 → 打破卡住的状态',
    duration: 0,
    description: '穿着现在这身直接出门。走5分钟，不设目标。边走边看远处——天空、树、远处的建筑。关键是看远不看近。',
    completionPrompt: '感受到身体的移动和视野的开阔了吗？',
  },
  
  // 感官着陆(绿灯专属)
  visual_grounding: {
    id: 'visual_grounding',
    title: '看看周围的颜色',
    emoji: '👁',
    pathway: '感官着陆',
    scienceLabel: '用眼睛看 → 大脑确认"这里有秩序"',
    duration: 30,
    description: '环顾四周，找到5个不同颜色的东西，一个一个在心里说出来。你的眼睛会告诉大脑：这里有颜色、有物体、有秩序——这里是安全的。',
    completionPrompt: '你看到了周围的颜色和物体——这里安全。',
  },
  touch_grounding: {
    id: 'touch_grounding',
    title: '摸摸周围的物体',
    emoji: '🤚',
    pathway: '感官着陆',
    scienceLabel: '用手触碰 → 确认"我在这里"',
    duration: 30,
    description: '用手触碰3个不同质地的东西——桌面、衣服、墙壁、自己的皮肤都可以。感受它们的温度和触感。你的手会告诉大脑：我在这里，我能碰到真实的东西。',
    completionPrompt: '你触碰到了真实的东西——你在这里。',
  },
  breathing_grounding: {
    id: 'breathing_grounding',
    title: '感受呼吸',
    emoji: '🌬',
    pathway: '感官着陆',
    scienceLabel: '呼吸可控 → 身体还在',
    duration: 30,
    description: '吸气4秒，憋住2秒，呼气6秒，重复3次。你的呼吸会告诉大脑：身体还在，节奏可控。',
    completionPrompt: '你的呼吸在告诉你——身体还在，一切都好。',
  },
  voo_grounding: {
    id: 'voo_grounding',
    title: '发出声音',
    emoji: '🎵',
    pathway: '感官着陆',
    scienceLabel: '发出声音 → "我在这个空间里"',
    duration: 30,
    description: '深吸一口气，用低沉声音发出"呜——"拉长。感受喉咙和胸口的振动。你的声音会告诉大脑：我能发出声音，我在这个空间里。',
    completionPrompt: '你发出了声音——你在这个空间里。',
  },
};

interface BodyInterventionProps {
  methods: BodyMethod[];
  onComplete: (method: BodyMethod) => void;
  title?: string;
  subtitle?: string;
  showPathwayGrouping?: boolean;
  bottomTip?: string;
}

export default function BodyIntervention({
  methods,
  onComplete,
  title = '先给神经系统一个信号',
  subtitle = '选一个你现在能做的',
  showPathwayGrouping = true,
  bottomTip = '如果什么都不想做——就把手放在胸口，感受呼吸的起伏。这已经是一个身体动作。',
}: BodyInterventionProps) {
  const [selectedMethod, setSelectedMethod] = useState<BodyMethod | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0 && selectedMethod && !showCompletion) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setShowCompletion(true);
    }
  }, [countdown, selectedMethod, showCompletion]);

  const handleMethodSelect = (method: BodyMethod) => {
    setSelectedMethod(method);
    setShowCompletion(false);
    
    const duration = BODY_METHODS[method].duration;
    if (duration > 0) {
      setCountdown(duration);
    } else {
      // 不设倒计时的方法（如walk_out）
      setShowCompletion(false);
    }
  };

  const handleComplete = () => {
    if (selectedMethod) {
      onComplete(selectedMethod);
    }
  };

  const getMethodConfig = (method: BodyMethod): BodyMethodConfig => {
    return BODY_METHODS[method];
  };

  // 按通路分组
  const getMethodByPathway = (pathway: string): BodyMethod[] => {
    return methods.filter(m => BODY_METHODS[m].pathway === pathway);
  };

  const pathways = ['冷敷法（需要冰块）', '声音放松法（零道具）', '身体运动法（需要起身）', '感官着陆'];

  if (!selectedMethod) {
    return (
      <div className="animate-fadeIn flex flex-col gap-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold mb-2">{title}</h2>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>

        {/* 方法列表 */}
        {showPathwayGrouping ? (
          // 按通路分组显示
          <div className="space-y-6">
            {pathways.map(pathway => {
              const pathwayMethods = getMethodByPathway(pathway);
              if (pathwayMethods.length === 0) return null;

              return (
                <div key={pathway}>
                  <p className="text-sm text-muted-foreground mb-2">
                    {pathway === '冷敷法（需要冰块）' && '🧊 冷敷法 — 效果最快，需要冰块或冷水'}
                    {pathway === '声音放松法（零道具）' && '🎵 声音放松法 — 零道具，坐着就能做，对敏感的人最温和'}
                    {pathway === '身体运动法（需要起身）' && '🏃 身体运动法 — 需要站起来动一动，但不用任何道具'}
                    {pathway === '感官着陆' && '🌟 快速确认安全 — 用眼睛、手、呼吸告诉大脑"这里安全"'}
                  </p>
                  
                  <div className="space-y-3">
                    {pathwayMethods.map(method => {
                      const config = getMethodConfig(method);
                      return (
                        <Button
                          key={method}
                          size="lg"
                          className={cn(
                            "w-full h-auto py-4",
                            config.recommended && "bg-primary text-white"
                          )}
                          variant={config.recommended ? "default" : "outline"}
                          onClick={() => handleMethodSelect(method)}
                        >
                          <div className="text-left">
                            <div className="font-semibold mb-1">
                              {config.emoji} {config.title}
                              {config.recommended && ' ★推荐'}
                            </div>
                            <div className="text-xs opacity-70">
                              {config.scienceLabel}
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // 不分组，直接显示所有方法
          <div className="space-y-3">
            {methods.map(method => {
              const config = getMethodConfig(method);
              return (
                <Button
                  key={method}
                  size="lg"
                  className={cn(
                    "w-full h-auto py-4",
                    config.recommended && "bg-primary text-white"
                  )}
                  variant={config.recommended ? "default" : "outline"}
                  onClick={() => handleMethodSelect(method)}
                >
                  <div className="text-left">
                    <div className="font-semibold mb-1">
                      {config.emoji} {config.title}
                      {config.recommended && ' ★推荐'}
                    </div>
                    <div className="text-xs opacity-70">
                      {config.scienceLabel}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        )}

        {/* 底部提示 */}
        {bottomTip && (
          <p className="text-xs text-muted-foreground mt-6 text-center">
            {bottomTip}
          </p>
        )}
      </div>
    );
  }

  // 方法执行详情
  const config = getMethodConfig(selectedMethod);
  
  return (
    <div className="animate-fadeIn flex flex-col gap-6">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-semibold mb-2">
          {config.emoji} {config.title}
        </h2>
        <p className="text-sm text-muted-foreground mb-2">
          {config.scienceLabel}
        </p>
        <p className="text-center mb-6">
          {config.description}
        </p>
      </div>

      {/* 倒计时显示 */}
      {countdown > 0 && (
        <div className="text-center mb-6">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* 进度圈背景 */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e5e5e5"
                strokeWidth="8"
              />
              {/* 进度圈 */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#4A90D9"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(countdown / config.duration) * 283} 283`}
                transform="rotate(-90 50 50)"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-4xl font-bold text-[#4A90D9]">
                {countdown}
              </div>
            </div>
          </div>
          <p className="text-muted-foreground">保持动作...</p>
        </div>
      )}

      {/* 开始按钮 */}
      {countdown === 0 && config.duration > 0 && !showCompletion && (
        <Button
          size="lg"
          className="w-full animate-fadeIn mb-4"
          onClick={() => setCountdown(config.duration)}
        >
          开始 {config.duration}秒倒计时
        </Button>
      )}

      {/* 步行方法(无倒计时) */}
      {config.duration === 0 && (
        <div className="animate-fadeIn text-center">
          <p className="mb-6 text-muted-foreground">
            不设倒计时。走完回来后点"继续"。
          </p>
          <Button
            size="lg"
            className="w-full"
            onClick={handleComplete}
          >
            走完回来了,继续 →
          </Button>
        </div>
      )}

      {/* 完成确认 */}
      {showCompletion && (
        <div className="animate-fadeIn text-center">
          <p className="mb-6">{config.completionPrompt}</p>
          <Button
            size="lg"
            className="w-full"
            onClick={handleComplete}
          >
            感觉到了,继续 →
          </Button>
        </div>
      )}
    </div>
  );
}