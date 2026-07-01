'use client';

import { useEffect, useRef, useState } from 'react';

interface CPTSDState {
  energyLevel: 'green' | 'yellow' | 'red' | null;
  targetAction: string;
  fearContent: string;
  currentStep: string;
  isStuck: boolean;
  stuckType: 'new_thought' | 'body_frozen' | null;
  evidenceLog: Array<{
    date: string;
    expected: string;
    actual: string;
    result: 'better' | 'same' | 'worse';
  }>;
  totalActions: number;
  brainLiedCount: number;
  critiqueContent?: string;
  energyRemaining?: '2min' | '5min' | null;
}

interface ChatClientProps {
  onStateUpdate?: (state: CPTSDState) => void;
}

declare global {
  interface Window {
    CozeWebSDK?: {
      WebChatClient: any;
    };
  }
}

export default function ChatClient({ onStateUpdate }: ChatClientProps) {
  const chatClientRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateState = (newState: Partial<CPTSDState>) => {
    if (typeof window === 'undefined') return;
    
    const currentState = JSON.parse(localStorage.getItem('cptsd_app_state') || '{}') as CPTSDState;
    const updatedState = { ...currentState, ...newState };
    localStorage.setItem('cptsd_app_state', JSON.stringify(updatedState));
    
    if (onStateUpdate) {
      onStateUpdate(updatedState);
    }
  };

  const openChat = () => {
    if (chatClientRef.current && typeof chatClientRef.current.open === 'function') {
      chatClientRef.current.open();
    } else {
      console.log('Chat client not ready or open method not available');
    }
  };

  const sendMessage = (message: string) => {
    if (chatClientRef.current && typeof chatClientRef.current.sendMessage === 'function') {
      chatClientRef.current.sendMessage(message);
    } else {
      console.log('Chat client not ready or sendMessage method not available');
    }
  };

  const openChatWithContext = (context: Partial<CPTSDState>, initialMessage?: string) => {
    updateState(context);
    openChat();
    
    if (initialMessage) {
      setTimeout(() => {
        sendMessage(initialMessage);
      }, 500);
    }
  };

  useEffect(() => {
    if (!mounted) return;

    const initChatClient = () => {
      if (window.CozeWebSDK && window.CozeWebSDK.WebChatClient) {
        try {
          chatClientRef.current = new window.CozeWebSDK.WebChatClient({
            config: {
              bot_id: '7657187833182224418',
            },
            componentProps: {
              title: 'CPTSD疗愈助手',
              width: 390,
            },
            auth: {
              type: 'token',
              token: 'pat_B4xhf9Rx8F7T607RpgcBiv9RJWCCH5NWPgz9Tpxt6c5KQNrdEYOLamfP9RV2XX5E',
              onRefreshToken: function () {
                return 'pat_B4xhf9Rx8F7T607RpgcBiv9RJWCCH5NWPgz9Tpxt6c5KQNrdEYOLamfP9RV2XX5E';
              }
            },
            ui: {
              base: {
                layout: 'pc',
              }
            }
          });
          setIsLoaded(true);
          console.log('Chat SDK initialized successfully');
        } catch (error) {
          console.error('Failed to initialize Chat SDK:', error);
        }
      } else {
        console.log('CozeWebSDK not loaded yet, retrying...');
        setTimeout(initChatClient, 100);
      }
    };

    initChatClient();

    // 添加程序化触发打开的事件监听器
    const handleOpenChatSDK = (event: CustomEvent) => {
      console.log('Received openChatSDK event:', event.detail);
      openChat();
      if (event.detail && event.detail.context) {
        updateState(event.detail.context);
      }
    };

    window.addEventListener('openChatSDK', handleOpenChatSDK as EventListener);

    return () => {
      window.removeEventListener('openChatSDK', handleOpenChatSDK as EventListener);
    };
  }, [mounted]);

  if (!mounted) return null;

  return null;
}

export { ChatClient };
export type { CPTSDState };