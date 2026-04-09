"use client";

import Link from "next/link";
import { useUILanguage } from "@/lib/ui-language";

export default function TermsPage() {
  const { lang } = useUILanguage();
  return lang === "zh" ? <TermsZH /> : <TermsEN />;
}

/* ------------------------------------------------------------------ */
/*  Shared layout wrapper                                               */
/* ------------------------------------------------------------------ */

function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="mb-8 inline-block text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to EasyCV
        </Link>
        <h1 className="mb-2 text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mb-10 text-sm text-muted-foreground">{updated}</p>
        <div className="prose prose-sm max-w-none space-y-8 text-foreground">{children}</div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  English                                                             */
/* ------------------------------------------------------------------ */

function TermsEN() {
  return (
    <LegalPage title="Terms of Service" updated="Last updated: April 2026">
      <Section title="1. Acceptance of Terms">
        <p>By creating an account or using EasyCV, you agree to these Terms of Service. If you do not agree, please do not use the service.</p>
      </Section>

      <Section title="2. Description of Service">
        <p>EasyCV is an online tool that helps you create, edit, and export professional resumes. The service is provided on an &quot;as is&quot; basis during its beta period and may be updated or changed at any time.</p>
      </Section>

      <Section title="3. Your Content">
        <p>You retain full ownership of all resume content you create using EasyCV. We do not claim any rights over your content.</p>
        <p>By using the service, you grant EasyCV a limited license to store, process, and display your content solely for the purpose of providing the service to you.</p>
      </Section>

      <Section title="4. Acceptable Use">
        <p>You agree not to:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Use the service for any unlawful purpose</li>
          <li>Upload content that is defamatory, obscene, or infringes on third-party intellectual property rights</li>
          <li>Attempt to reverse-engineer, scrape, or disrupt the service</li>
          <li>Create multiple accounts to circumvent any restrictions</li>
        </ul>
      </Section>

      <Section title="5. Account Termination">
        <p>You may delete your account at any time from the account settings page. All your data will be permanently removed within 30 days.</p>
        <p>We reserve the right to suspend or terminate accounts that violate these terms, without prior notice.</p>
      </Section>

      <Section title="6. Service Availability">
        <p>EasyCV is currently in beta. We do not guarantee uninterrupted availability, and the service may be modified, suspended, or discontinued at any time. We will make reasonable efforts to provide advance notice of significant changes.</p>
      </Section>

      <Section title="7. Disclaimer of Warranties">
        <p>The service is provided &quot;as is&quot; without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.</p>
      </Section>

      <Section title="8. Limitation of Liability">
        <p>To the maximum extent permitted by applicable law, EasyCV shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.</p>
      </Section>

      <Section title="9. Governing Law">
        <p>These terms are governed by the laws of <strong>England and Wales</strong>. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
      </Section>

      <Section title="10. Contact">
        <p>For questions about these terms, contact us at <a href="mailto:legal@easycv.app" className="underline underline-offset-2 hover:text-foreground">legal@easycv.app</a>.</p>
      </Section>
    </LegalPage>
  );
}

/* ------------------------------------------------------------------ */
/*  Chinese                                                             */
/* ------------------------------------------------------------------ */

function TermsZH() {
  return (
    <LegalPage title="服务条款" updated="最后更新：2026 年 4 月">
      <Section title="1. 接受条款">
        <p>注册账户或使用 EasyCV 即表示您同意本服务条款。如不同意，请勿使用本服务。</p>
      </Section>

      <Section title="2. 服务说明">
        <p>EasyCV 是一款帮助您创建、编辑和导出专业简历的在线工具。本服务在公测阶段以&ldquo;现状&rdquo;提供，可能随时更新或变更。</p>
      </Section>

      <Section title="3. 您的内容">
        <p>您对通过 EasyCV 创建的所有简历内容拥有完整所有权。我们不主张对您内容的任何权利。</p>
        <p>使用本服务即表示您授予 EasyCV 有限许可，仅用于向您提供服务的目的存储、处理和展示您的内容。</p>
      </Section>

      <Section title="4. 可接受使用">
        <p>您同意不得：</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>将本服务用于任何违法目的</li>
          <li>上传诽谤性、淫秽性内容或侵犯第三方知识产权的内容</li>
          <li>尝试对本服务进行反向工程、数据抓取或干扰服务运行</li>
          <li>创建多个账户以规避任何限制</li>
        </ul>
      </Section>

      <Section title="5. 账户注销">
        <p>您可随时在账户设置页面删除账户，所有数据将在 30 天内被永久删除。</p>
        <p>对于违反本条款的账户，我们保留在不提前通知的情况下暂停或终止其账户的权利。</p>
      </Section>

      <Section title="6. 服务可用性">
        <p>EasyCV 目前处于公测阶段，我们不保证服务持续不中断，服务可能随时被修改、暂停或终止。对于重大变更，我们将尽合理努力提前告知。</p>
      </Section>

      <Section title="7. 免责声明">
        <p>本服务以&ldquo;现状&rdquo;提供，不附带任何明示或暗示的保证，包括但不限于适销性、特定用途适用性或不侵权的保证。</p>
      </Section>

      <Section title="8. 责任限制">
        <p>在适用法律允许的最大范围内，EasyCV 不对因您使用本服务而产生的任何间接、附带、特殊或后果性损害承担责任。</p>
      </Section>

      <Section title="9. 适用法律">
        <p>本条款受<strong>英格兰和威尔士法律</strong>管辖，任何争议受英格兰和威尔士法院的专属管辖。</p>
      </Section>

      <Section title="10. 联系方式">
        <p>如对本条款有疑问，请联系 <a href="mailto:legal@easycv.app" className="underline underline-offset-2 hover:text-foreground">legal@easycv.app</a>。</p>
      </Section>
    </LegalPage>
  );
}
