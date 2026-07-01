'use client';

import { useState, useEffect } from 'react';

// 恐惧关键词检测
const FEAR_KEYWORDS = [
  '被否定', '被拒绝', '被嘲笑', '被批评', '没人看', '没人回',
  '被忽略', '被冷落', '不够好', '会失败', '做不到'
];

// RSD关键词
const RSD_KEYWORDS = [
  '被否定', '被拒绝', '被嘲笑', '被批评', '没人看', '没人回', '被忽略', '被冷落', '被讨厌'
];

export function useAIIntervention() {
  const [shouldTriggerAI, setShouldTriggerAI] = useState(false);
  const [aiContext, setAIContext] = useState('');

  // 检测恐惧内容中的关键词
  const checkFearKeywords = (text: string): boolean => {
    return FEAR_KEYWORDS.some(keyword => text.includes(keyword));
  };

  // 检测RSD关键词
  const checkRSDKeywords = (text: string): boolean => {
    return RSD_KEYWORDS.some(keyword => text.includes(keyword));
  };

  // 触发AI介入
  const triggerAIIntervention = (context: string) => {
    setShouldTriggerAI(true);
    setAIContext(context);
    
    // 更新localStorage状态
    const currentState = JSON.parse(localStorage.getItem('cptsd_app_state') || '{}');
    currentState.isStuck = true;
    currentState.aiContext = context;
    currentState.currentStep = 'ai_intervention';
    localStorage.setItem('cptsd_app_state', JSON.stringify(currentState));
    
    // 3秒后重置
    setTimeout(() => {
      setShouldTriggerAI(false);
    }, 3000);
  };

  // 打开Chat SDK（程序化触发）
  const openChatSDK = () => {
    // 这里应该调用ChatClient的open方法
    // 由于ChatClient已经初始化，用户可以手动点击右下角的悬浮球
    // 或者我们可以通过全局事件来触发
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('openChatSDK'));
    }
  };

  return {
    shouldTriggerAI,
    aiContext,
    checkFearKeywords,
    checkRSDKeywords,
    triggerAIIntervention,
    openChatSDK,
  };
}