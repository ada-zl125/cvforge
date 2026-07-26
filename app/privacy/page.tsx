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
    <LegalPage title="Privacy Policy" updated="Last updated July 2026">
      <Section title="Summary">
        <p>
          CVForge is a browser based document builder. We do not run a user system,
          application database or document storage server.
        </p>
      </Section>

      <Section title="What we collect">
        <p>
          CVForge does not collect names, email addresses, account details, payment details
          or document content through an application server.
        </p>
      </Section>

      <Section title="Browser storage">
        <p>
          Documents, Agent Mode chat, uploaded references, project instructions and recent
          agent changes use session storage. A refresh keeps the current tab state. Closing
          the tab starts a clean session next time.
        </p>
        <p>
          LLM configuration, including the API key, and interface language use local storage.
          They remain available until you replace them or clear browser data.
        </p>
      </Section>

      <Section title="Agent Mode and model providers">
        <p>
          When you use Agent Mode, CVForge sends the current request and the context needed
          to answer it directly from your browser to the model provider you configured.
          This context may include document content, conversation history, project instructions
          and reference text read by the agent.
        </p>
        <p>
          CVForge does not proxy or store these requests. The selected provider handles the
          request under its own terms and privacy policy.
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
    <LegalPage title="隐私政策" updated="最后更新 2026 年 7 月">
      <Section title="概述">
        <p>
          CVForge 是一个在浏览器中运行的文档工具。我们不提供用户系统、
          应用数据库或文档存储服务器。
        </p>
      </Section>

      <Section title="我们收集什么">
        <p>
          CVForge 不会通过应用服务器收集姓名、邮箱、账户信息、支付信息或文档内容。
        </p>
      </Section>

      <Section title="浏览器存储">
        <p>
          文档、Agent Mode 对话、上传资料、项目指令和最近的 Agent 修改使用会话存储。
          刷新页面会保留当前标签页状态，关闭标签页后下次会从全新会话开始。
        </p>
        <p>
          LLM 配置包含 API Key，并和界面语言一起使用本地存储。
          在你替换这些设置或清除浏览器数据前，它们会保留在当前浏览器中。
        </p>
      </Section>

      <Section title="Agent Mode 与模型服务">
        <p>
          使用 Agent Mode 时，CVForge 会从浏览器直接向你配置的模型服务发送当前请求和回答所需的上下文。
          这些内容可能包括文档、对话记录、项目指令和 Agent 读取的参考资料文本。
        </p>
        <p>
          CVForge 不会代理或保存这些请求。所选模型服务会按照其自身条款和隐私政策处理请求。
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
