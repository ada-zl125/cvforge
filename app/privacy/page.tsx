"use client";

import Link from "next/link";
import { useUILanguage } from "@/lib/ui-language";

export default function PrivacyPage() {
  const { lang } = useUILanguage();
  return lang === "zh" ? <PrivacyZH /> : <PrivacyEN />;
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

function PrivacyEN() {
  return (
    <LegalPage title="Privacy Policy" updated="Last updated: April 2026">
      <Section title="1. Data Controller">
        <p>EasyCV is an online resume generation service and the data controller for personal information collected through this service.</p>
        <p>For privacy inquiries or to exercise your rights, contact us at: <a href="mailto:privacy@easycv.app" className="underline underline-offset-2 hover:text-foreground">privacy@easycv.app</a></p>
      </Section>

      <Section title="2. Data We Collect">
        <p>When you use EasyCV, we collect:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li><strong>Account data:</strong> email address, display name, authentication provider (email/password or Google)</li>
          <li><strong>Resume content:</strong> all information you enter into your resumes, including personal details, work history, education, skills, and optionally a headshot photo</li>
          <li><strong>Usage data:</strong> standard server logs (IP address, browser type, pages visited) for security and performance monitoring</li>
        </ul>
      </Section>

      <Section title="3. How We Use Your Data">
        <p>We use your data solely to provide and improve the EasyCV service:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Authenticate your account and maintain your session</li>
          <li>Store and display your resume content</li>
          <li>Generate PDF and Word exports of your resumes</li>
          <li>Send transactional emails (verification codes, password reset)</li>
        </ul>
        <p>We do <strong>not</strong> sell your data, use it for advertising, or share it with third parties for marketing purposes.</p>
        <p>We do <strong>not</strong> use automated decision-making or profiling that produces legal or similarly significant effects.</p>
      </Section>

      <Section title="4. Legal Basis for Processing">
        <p>For users in the European Economic Area (EEA) and the United Kingdom, our legal basis for processing personal data is <strong>contract performance</strong> (GDPR Article 6(1)(b) / UK GDPR Article 6(1)(b)) — processing is necessary to provide the service you signed up for.</p>
        <p>Server logs are processed on the basis of our <strong>legitimate interests</strong> (Article 6(1)(f)) in maintaining the security and performance of the service.</p>
      </Section>

      <Section title="5. Third-Party Processors & International Transfers">
        <p>We use the following sub-processors to operate the service. Where data is transferred outside the EEA or UK, appropriate safeguards are in place as noted below:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li><strong>Supabase</strong> (EU-West, Ireland) — database, authentication, and file storage. Data remains within the EEA.</li>
          <li><strong>Vercel</strong> (United States) — hosting and serverless functions. Transfers to the US are subject to Vercel&apos;s EU Standard Contractual Clauses (SCCs). For UK users, equivalent UK transfer mechanisms apply.</li>
          <li><strong>Google</strong> — optional OAuth sign-in. If you sign in with Google, we receive your email and display name. Google&apos;s data processing is governed by their own privacy policy and applicable SCCs.</li>
        </ul>
      </Section>

      <Section title="6. Cookies">
        <p>EasyCV uses only <strong>essential cookies</strong> to maintain your login session (provided by Supabase Auth). We do not use tracking, analytics, or advertising cookies.</p>
        <p>You can disable cookies in your browser settings, but this will prevent you from staying signed in.</p>
      </Section>

      <Section title="7. Data Retention">
        <p>Your data is retained for as long as your account is active. If you delete your account, your data will be permanently removed within 30 days.</p>
        <p>Server logs may be retained for up to 90 days for security purposes.</p>
      </Section>

      <Section title="8. Your Rights">
        <p>Under the GDPR and UK GDPR, you have the following rights:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
          <li><strong>Rectification</strong> — correct inaccurate data directly in the app, or contact us</li>
          <li><strong>Erasure</strong> — delete your account and all associated data via app settings, or contact us</li>
          <li><strong>Restriction</strong> — request that we restrict processing of your data in certain circumstances</li>
          <li><strong>Portability</strong> — export your resume content as PDF or Word at any time; or request a structured data export</li>
          <li><strong>Objection</strong> — object to processing based on legitimate interests</li>
        </ul>
        <p>To exercise any of these rights, contact us at <a href="mailto:privacy@easycv.app" className="underline underline-offset-2 hover:text-foreground">privacy@easycv.app</a>. We will respond within 30 days.</p>
      </Section>

      <Section title="9. Right to Lodge a Complaint">
        <p>You have the right to lodge a complaint with a data protection supervisory authority. As EasyCV operates from the United Kingdom, the primary supervisory authority is:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li><strong>Information Commissioner&apos;s Office (ICO)</strong> — <a href="https://ico.org.uk" className="underline underline-offset-2 hover:text-foreground">ico.org.uk</a> (for UK users and as the lead authority for the controller)</li>
          <li><strong>EU users</strong> may also contact the supervisory authority in their country of residence. A list of EU national data protection authorities is available at <a href="https://edpb.europa.eu/about-edpb/about-edpb/members_en" className="underline underline-offset-2 hover:text-foreground">edpb.europa.eu</a>.</li>
        </ul>
        <p>We encourage you to contact us first at <a href="mailto:privacy@easycv.app" className="underline underline-offset-2 hover:text-foreground">privacy@easycv.app</a> so we can try to resolve any concern directly.</p>
      </Section>

      <Section title="10. Changes to This Policy">
        <p>We may update this policy from time to time. Significant changes will be communicated via email or an in-app notice at least 14 days before they take effect. Continued use of the service after changes constitutes acceptance of the updated policy.</p>
      </Section>
    </LegalPage>
  );
}

/* ------------------------------------------------------------------ */
/*  Chinese                                                             */
/* ------------------------------------------------------------------ */

function PrivacyZH() {
  return (
    <LegalPage title="隐私政策" updated="最后更新：2026 年 4 月">
      <Section title="1. 个人信息处理者">
        <p>EasyCV 是一款在线简历生成服务，是本服务所涉个人信息的处理者。</p>
        <p>如有隐私相关问题或需行使您的权利，请联系：<a href="mailto:privacy@easycv.app" className="underline underline-offset-2 hover:text-foreground">privacy@easycv.app</a></p>
      </Section>

      <Section title="2. 我们收集的个人信息">
        <p>当您使用 EasyCV 时，我们会收集以下信息：</p>
        <ul className="ml-4 list-disc space-y-1">
          <li><strong>账户信息：</strong>电子邮件地址、显示名称、登录方式（邮箱/密码或 Google）</li>
          <li><strong>简历内容：</strong>您在简历中填写的所有信息，包括个人信息、工作经历、教育背景、技能，以及可选的证件照（如上传）</li>
          <li><strong>使用日志：</strong>标准服务器日志（IP 地址、浏览器类型、访问页面），用于安全与性能分析</li>
        </ul>
      </Section>

      <Section title="3. 处理目的与方式">
        <p>我们仅将您的个人信息用于提供和改进 EasyCV 服务，包括：</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>验证您的账户并维持登录状态</li>
          <li>存储并展示您的简历内容</li>
          <li>生成简历的 PDF 和 Word 导出文件</li>
          <li>发送事务性邮件（验证码、密码重置）</li>
        </ul>
        <p>我们<strong>不会</strong>出售您的个人信息、将其用于广告，或出于商业营销目的向第三方提供。</p>
        <p>我们<strong>不进行</strong>对您产生重大影响的自动化决策或画像。</p>
      </Section>

      <Section title="4. 处理个人信息的依据">
        <p>我们依据以下依据处理您的个人信息（《个人信息保护法》第 13 条）：</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>您在注册时对我们处理账户信息和简历内容所给予的<strong>明示同意</strong></li>
          <li>履行您与我们之间服务合同所必要的处理</li>
        </ul>
        <p>您有权随时撤回同意。撤回同意不影响撤回前基于同意的处理的合法性。撤回同意后，您将无法继续使用本服务。</p>
      </Section>

      <Section title="5. 向境外提供个人信息（重要披露）">
        <p>为运营本服务，我们使用以下境外服务商处理或存储您的个人信息。依据《个人信息保护法》第 39 条，我们特此告知并请您知悉：</p>
        <ul className="ml-4 list-disc space-y-1">
          <li><strong>Supabase</strong>（爱尔兰，欧盟）——数据库、身份验证和文件存储。您的简历内容和账户数据存储于此。</li>
          <li><strong>Vercel</strong>（美国）——网站托管与服务器函数。您的请求数据经由此处理。</li>
          <li><strong>Google</strong>——如您选择使用 Google 登录，您的邮箱和显示名称将由 Google 处理。</li>
        </ul>
        <p>上述境外接收方所在国家/地区的个人信息保护制度可能与中国不同。我们已与上述服务商签订数据处理协议，要求其采取与本政策相当的保护措施。</p>
        <p>如您不同意将个人信息提供至上述境外服务商，请勿注册或使用本服务。</p>
      </Section>

      <Section title="6. 第三方服务商">
        <p>除上述境外服务商外，我们不向其他第三方提供您的个人信息，除非：法律法规要求、保护您或他人的生命安全、或经您明确同意。</p>
      </Section>

      <Section title="7. Cookie">
        <p>EasyCV 仅使用<strong>必要 Cookie</strong>来维持您的登录会话（由 Supabase Auth 提供）。我们不使用追踪、分析或广告类 Cookie。</p>
        <p>您可以在浏览器设置中禁用 Cookie，但这将导致您无法保持登录状态。</p>
      </Section>

      <Section title="8. 保存期限">
        <p>您的个人信息将在账户有效期间保留，保存期限以实现处理目的所必要的最短时间为准。如果您删除账户，所有个人信息将在 30 天内被永久删除。</p>
        <p>服务器日志出于安全目的最多保留 90 天。</p>
      </Section>

      <Section title="9. 您的权利">
        <p>依据《个人信息保护法》，您享有以下权利：</p>
        <ul className="ml-4 list-disc space-y-1">
          <li><strong>知情权与决定权</strong>——了解并决定我们如何处理您的个人信息</li>
          <li><strong>查阅与复制权</strong>——申请获取我们持有的您的个人信息副本</li>
          <li><strong>更正权</strong>——直接在应用内更新不准确的信息，或联系我们</li>
          <li><strong>删除权</strong>——在账户设置中删除账户及所有相关个人信息，或联系我们</li>
          <li><strong>限制处理权</strong>——在特定情形下申请限制对您个人信息的处理</li>
          <li><strong>可携带权</strong>——随时将简历内容导出为 PDF 或 Word</li>
          <li><strong>撤回同意权</strong>——随时撤回您对处理个人信息的同意</li>
        </ul>
        <p>如需行使上述权利，请联系 <a href="mailto:privacy@easycv.app" className="underline underline-offset-2 hover:text-foreground">privacy@easycv.app</a>，我们将在 15 个工作日内回复。</p>
      </Section>

      <Section title="10. 政策变更">
        <p>我们可能不时更新本政策。重大变更将至少提前 14 天通过电子邮件或应用内通知告知您。继续使用本服务视为接受变更后的政策。</p>
      </Section>
    </LegalPage>
  );
}
