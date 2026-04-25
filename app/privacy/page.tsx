"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useUILanguage } from "@/lib/ui-language";

export default function PrivacyPage() {
  const { lang } = useUILanguage();
  return lang === "zh" ? <PrivacyZH /> : <PrivacyEN />;
}

function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  const { lang } = useUILanguage();
  const backLabel = lang === "zh" ? "返回 CVForge" : "Back to CVForge";

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-foreground lg:py-14">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="group mb-10 inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-950"
        >
          <ArrowRight className="h-4 w-4 rotate-180 transition-transform group-hover:-translate-x-1" />
          <span>{backLabel}</span>
        </Link>

        <div className="border-b border-gray-100 pb-8">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-gray-400">CVForge</p>
          <h1 className="text-4xl font-semibold tracking-tight text-gray-950">{title}</h1>
          <p className="mt-3 text-sm text-gray-500">{updated}</p>
        </div>

        <div className="mt-10 space-y-9">
          {children}
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3 border-b border-gray-100 pb-8 last:border-b-0">
      <h2 className="text-lg font-semibold tracking-tight text-gray-950">{title}</h2>
      <div className="space-y-3 text-[15px] leading-7 text-gray-600">{children}</div>
    </section>
  );
}

const githubPrivacyLink = (
  <a
    href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
    target="_blank"
    rel="noopener noreferrer"
    className="font-medium text-gray-900 underline underline-offset-4"
  >
    GitHub Privacy Statement
  </a>
);

const githubRepoLink = (
  <a
    href="https://github.com/ada-zl125/cvforge"
    target="_blank"
    rel="noopener noreferrer"
    className="font-medium text-gray-900 underline underline-offset-4"
  >
    GitHub repository
  </a>
);

function PrivacyEN() {
  return (
    <LegalPage title="Privacy Policy" updated="Last updated April 2026">
      <Section title="Summary">
        <p>
          CVForge is a client-side web utility for creating resumes, academic CVs and cover letters.
          We do not run a user system, database or application server for storing your documents.
        </p>
      </Section>

      <Section title="What we collect">
        <p>
          We do not collect names, email addresses, account details, payment details or resume content.
          The information you enter into CVForge stays in your browser unless you choose to export it or share it yourself.
        </p>
      </Section>

      <Section title="Local browser storage">
        <p>
          CVForge uses your browser&apos;s local storage to keep your draft content and interface language preference on your device.
          This helps the app continue where you left off. Clearing browser data may remove those drafts.
        </p>
      </Section>

      <Section title="Cookies and analytics">
        <p>
          CVForge does not use advertising cookies, tracking cookies or analytics tools.
          If this changes in the future, this policy will be updated before those tools are introduced.
        </p>
      </Section>

      <Section title="Hosting">
        <p>
          CVForge is hosted on GitHub Pages. GitHub may process standard technical information such as IP address,
          browser type and request logs as part of providing the hosting service. Please see the {githubPrivacyLink}.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          If you have questions about privacy, please open an issue in the {githubRepoLink}.
        </p>
      </Section>
    </LegalPage>
  );
}

function PrivacyZH() {
  return (
    <LegalPage title="隐私政策" updated="最后更新 2026 年 4 月">
      <Section title="概述">
        <p>
          CVForge 是一个用于创建求职简历、学术简历和求职信的纯客户端网页工具。
          我们不提供用户系统，不使用数据库，也不通过应用服务器保存你的文档内容。
        </p>
      </Section>

      <Section title="我们收集什么">
        <p>
          我们不收集姓名、邮箱、账户信息、支付信息或简历内容。
          你在 CVForge 中输入的内容会留在你的浏览器中，除非你自行导出或分享。
        </p>
      </Section>

      <Section title="浏览器本地存储">
        <p>
          CVForge 会使用浏览器本地存储保存草稿内容和界面语言偏好。
          这样你下次打开时可以继续编辑。清除浏览器数据可能会删除这些草稿。
        </p>
      </Section>

      <Section title="Cookie 与统计分析">
        <p>
          CVForge 不使用广告 Cookie、追踪 Cookie 或统计分析工具。
          如果未来发生变化，我们会在启用相关工具前更新本政策。
        </p>
      </Section>

      <Section title="托管服务">
        <p>
          CVForge 托管在 GitHub Pages。GitHub 可能会为提供托管服务处理标准技术信息，
          例如 IP 地址、浏览器类型和访问日志。详情请查看 {githubPrivacyLink}。
        </p>
      </Section>

      <Section title="联系我们">
        <p>
          如对隐私政策有疑问，请在 {githubRepoLink} 中提交 Issue。
        </p>
      </Section>
    </LegalPage>
  );
}
