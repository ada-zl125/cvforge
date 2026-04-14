"use client";

import Link from "next/link";
import { useUILanguage } from "@/lib/ui-language";

export default function PrivacyPage() {
  const { lang } = useUILanguage();
  return lang === "zh" ? <PrivacyZH /> : <PrivacyEN />;
}

function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="mb-8 inline-block text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to EasyCV
        </Link>
        <h1 className="mb-2 text-3xl font-bold">{title}</h1>
        <p className="mb-10 text-sm text-muted-foreground">Last updated: {updated}</p>
        <div className="prose prose-neutral max-w-none text-foreground [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:mt-3 [&_p]:leading-relaxed [&_p]:text-muted-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}

function PrivacyEN() {
  return (
    <LegalPage title="Privacy Policy" updated="April 2026">
      <h2>Overview</h2>
      <p>
        EasyCV is a stateless, client-side resume builder. We do not collect,
        store, or transmit any personal data to a server. Everything you type
        stays in your browser.
      </p>

      <h2>Data Storage</h2>
      <p>
        Your resume content is saved exclusively in your browser&apos;s{" "}
        <code>localStorage</code>. No data is sent to or stored on our servers.
        Clearing your browser data will permanently delete your resume.
      </p>

      <h2>No Accounts or Authentication</h2>
      <p>
        EasyCV does not require sign-up or login. We do not collect email
        addresses, passwords, or any account information.
      </p>

      <h2>Cookies</h2>
      <p>
        We do not use tracking, analytics, or advertising cookies. The only
        browser storage used is <code>localStorage</code> for your resume data
        and a UI language preference.
      </p>

      <h2>Third-Party Services</h2>
      <p>
        The app is hosted on GitHub Pages. GitHub may collect standard server
        access logs (IP address, browser type) as part of their hosting
        infrastructure. See{" "}
        <a
          href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          GitHub&apos;s Privacy Statement
        </a>
        .
      </p>

      <h2>Contact</h2>
      <p>
        Questions? Open an issue on our{" "}
        <a
          href="https://github.com/ada-zl125/easy-cv"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          GitHub repository
        </a>
        .
      </p>
    </LegalPage>
  );
}

function PrivacyZH() {
  return (
    <LegalPage title="隐私政策" updated="2026 年 4 月">
      <h2>概述</h2>
      <p>
        EasyCV 是一个无状态的纯客户端简历制作工具。我们不收集、存储或向服务器传输任何个人数据。你输入的所有内容均留在你的浏览器中。
      </p>

      <h2>数据存储</h2>
      <p>
        你的简历内容仅保存在浏览器的 <code>localStorage</code> 中，不会发送至或存储在我们的服务器上。清除浏览器数据将永久删除你的简历。
      </p>

      <h2>无账户或登录</h2>
      <p>
        EasyCV 无需注册或登录。我们不收集电子邮件地址、密码或任何账户信息。
      </p>

      <h2>Cookie</h2>
      <p>
        我们不使用追踪、分析或广告 Cookie。浏览器存储仅用于简历数据（<code>localStorage</code>）和界面语言偏好。
      </p>

      <h2>第三方服务</h2>
      <p>
        本应用托管于 GitHub Pages。GitHub 可能会作为托管基础设施的一部分收集标准服务器访问日志（IP 地址、浏览器类型）。详见{" "}
        <a
          href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          GitHub 隐私声明
        </a>
        。
      </p>

      <h2>联系我们</h2>
      <p>
        如有疑问，请在我们的{" "}
        <a
          href="https://github.com/ada-zl125/easy-cv"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          GitHub 仓库
        </a>
        提交 Issue。
      </p>
    </LegalPage>
  );
}
