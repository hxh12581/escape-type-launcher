import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '拖延自救启动器',
    template: '%s | 拖延自救启动器',
  },
  description:
    '帮助CPTSD逃类型和ADHD用户打破拖延循环，在卡住的时候迈出第一步的温和引导工具。',
  keywords: [
    '扣子编程',
    'Coze Code',
    'Vibe Coding',
    'AI 编程',
    '智能体搭建',
    '工作流搭建',
    '网站搭建',
    '网站部署',
    '全栈开发',
    'AI 工程师',
  ],
  authors: [{ name: 'Coze Code Team', url: 'https://code.coze.cn' }],
  generator: 'Coze Code',
  // icons: {
  //   icon: '',
  // },
  openGraph: {
    title: '扣子编程 | 你的 AI 工程师已就位',
    description:
      '我正在使用扣子编程 Vibe Coding，让创意瞬间上线。告别拖拽，拥抱心流。',
    url: 'https://code.coze.cn',
    siteName: '扣子编程',
    locale: 'zh_CN',
    type: 'website',
    // images: [
    //   {
    //     url: '',
    //     width: 1200,
    //     height: 630,
    //     alt: '扣子编程 - 你的 AI 工程师',
    //   },
    // ],
  },
  // twitter: {
  //   card: 'summary_large_image',
  //   title: 'Coze Code | Your AI Engineer is Here',
  //   description:
  //     'Build and deploy full-stack applications through AI conversation. No env setup, just flow.',
  //   // images: [''],
  // },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="zh-CN">
      <body className={`antialiased`}>
        <Script
          src="https://lf-cdn.coze.cn/obj/unpkg/flow-platform/chat-app-sdk/1.2.0-beta.19/libs/cn/index.js"
          strategy="beforeInteractive"
        />
        {isDev && <Inspector />}
        {children}
      </body>
    </html>
  );
}
