"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useUILanguage } from "@/lib/ui-language";

export default function TermsPage() {
  const { lang } = useUILanguage();
  return lang === "zh" ? <TermsZH /> : <TermsEN />;
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

const repoLink = (
  <a
    href="https://github.com/ada-zl125/cvforge"
    target="_blank"
    rel="noopener noreferrer"
    className="font-medium text-gray-900 underline underline-offset-4"
  >
    GitHub repository
  </a>
);

const mitLink = (
  <a
    href="https://opensource.org/license/mit"
    target="_blank"
    rel="noopener noreferrer"
    className="font-medium text-gray-900 underline underline-offset-4"
  >
    MIT License
  </a>
);

function TermsEN() {
  return (
    <LegalPage title="Terms of Use" updated="Last updated April 2026">
      <Section title="Using CVForge">
        <p>
          CVForge is a free, open source web utility for creating resumes, academic CVs and cover letters.
          You may use it without creating an account.
        </p>
      </Section>

      <Section title="Your content">
        <p>
          You are responsible for the content you enter, edit, export or share through CVForge.
          We do not claim ownership of your resume, CV or cover letter content.
        </p>
      </Section>

      <Section title="No server storage">
        <p>
          CVForge runs in your browser and stores drafts locally on your device.
          We do not provide cloud storage, account recovery or backup services.
        </p>
      </Section>

      <Section title="Open source licence">
        <p>
          CVForge is released under the {mitLink}. You may use, copy, modify and distribute the code under the terms of that licence.
        </p>
      </Section>

      <Section title="No professional advice">
        <p>
          CVForge helps with document structure and presentation. It does not provide career, legal, immigration or academic advice.
          You should review all exported documents before using them.
        </p>
      </Section>

      <Section title="Availability and changes">
        <p>
          CVForge is provided free of charge and may change, become unavailable or be discontinued at any time.
          We aim to keep it useful, but we do not guarantee uninterrupted availability.
        </p>
      </Section>

      <Section title="Disclaimer">
        <p>
          CVForge is provided as is, without warranties of any kind. To the extent permitted by law,
          the project maintainers are not liable for losses arising from use of the app or the code.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          For questions or feedback, please open an issue in the {repoLink}.
        </p>
      </Section>
    </LegalPage>
  );
}

function TermsZH() {
  return (
    <LegalPage title="使用条款" updated="最后更新 2026 年 4 月">
      <Section title="使用 CVForge">
        <p>
          CVForge 是一个免费开源的网页工具，用于创建求职简历、学术简历和求职信。
          你无需注册账户即可使用。
        </p>
      </Section>

      <Section title="你的内容">
        <p>
          你需要自行负责在 CVForge 中输入、编辑、导出或分享的内容。
          我们不主张拥有你的简历、学术简历或求职信内容。
        </p>
      </Section>

      <Section title="无服务器存储">
        <p>
          CVForge 在浏览器中运行，草稿内容保存在你的设备本地。
          我们不提供云端存储、账户找回或备份服务。
        </p>
      </Section>

      <Section title="开源许可证">
        <p>
          CVForge 基于 {mitLink} 发布。你可以在该许可证允许的范围内使用、复制、修改和分发代码。
        </p>
      </Section>

      <Section title="非专业建议">
        <p>
          CVForge 仅帮助你整理文档结构和版式，不提供职业、法律、移民或学术建议。
          请在正式使用前自行检查导出的文档。
        </p>
      </Section>

      <Section title="可用性与变更">
        <p>
          CVForge 免费提供，可能随时调整、暂停或停止维护。
          我们会尽力保持工具可用，但不保证服务持续不中断。
        </p>
      </Section>

      <Section title="免责声明">
        <p>
          CVForge 按现状提供，不附带任何形式的明示或暗示保证。
          在法律允许范围内，项目维护者不对使用本应用或代码产生的损失承担责任。
        </p>
      </Section>

      <Section title="联系与反馈">
        <p>
          如有问题或建议，请在 {repoLink} 中提交 Issue。
        </p>
      </Section>
    </LegalPage>
  );
}
