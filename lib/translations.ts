import type { UILang } from "./ui-language";

const t = {
  en: {
    /* ---- Landing ---- */
    betaBadge: "Now in Beta — Free to use",
    heroTitle1: "Your resume,",
    heroTitle2: "perfectly crafted.",
    heroSubtitle: "Fill in your content. We handle the professional layout.\nBeautiful resumes in minutes, not hours.",
    startBuilding: "Start Building",
    seeExamples: "See Examples",
    signIn: "Sign In",
    getStarted: "Get Started",
    featuresTitle1: "Everything you need.",
    featuresTitle2: "Nothing you don't.",
    featuresSubtitle: "Three simple steps from blank page to polished resume.",
    footer: "© 2026 EasyCV. All rights reserved.",

    /* ---- Feature cards ---- */
    feature1Title: "Simple Form Input",
    feature1Desc: "Just type your experience, education, and skills. No formatting headaches — our smart form guides you through every section.",
    feature2Title: "Real-time A4 Preview",
    feature2Desc: "See your resume update live as you type. What you see is exactly what you get — pixel-perfect A4 layout, every time.",
    feature3Title: "Export PDF & Word",
    feature3Desc: "One click to download your resume as a polished PDF or editable Word document. Ready to send to any employer.",

    /* ---- Workspace ---- */
    newResume: "New Resume",
    myResumes: "My Resumes",
    myResumesSubtitle: "Create and manage your professional resumes",
    signOut: "Sign out",
    accountSettings: "Account settings",

    /* ---- Empty state ---- */
    noResumesTitle: "No resumes yet",
    noResumesDesc: "Create your first resume to get started. It only takes a few minutes.",
    createFirstResume: "Create Your First Resume",

    /* ---- Resume card ---- */
    edited: "Edited",
    justNow: "just now",
    edit: "Edit",
    settings: "Settings",
    duplicate: "Duplicate",
    delete: "Delete",
    timeMinute: (n: number) => `${n}m ago`,
    timeHour: (n: number) => `${n}h ago`,
    timeDay: (n: number) => `${n}d ago`,
    timeMonth: (n: number) => `${n}mo ago`,

    /* ---- Resume settings dialog ---- */
    resumeSettings: "Resume Settings",
    resumeSettingsDesc: "Update the title and template for your resume.",
    titleLabel: "Title",
    titleTooLong: (max: number) => `Title must be ${max} characters or fewer.`,
    languageLabel: "Language",
    templateLabel: "Template",
    cancel: "Cancel",
    save: "Save",
    saving: "Saving...",
    deleteResume: "Delete resume?",
    deleteDesc: (title: string) => `"${title}" will be permanently deleted. This action cannot be undone.`,
    deleting: "Deleting...",

    /* ---- Create resume modal ---- */
    createNewResume: "Create New Resume",
    createNewResumeDesc: "Give your resume a title and pick a template.",
    resumeTitlePlaceholder: "e.g. Software Engineer Resume",
    creating: "Creating...",
    create: "Create",

    /* ---- Template / language options ---- */
    templateGeneral: "General",
    langEnglish: "English",
    langChinese: "Chinese",

    /* ---- Auth modal ---- */
    welcomeTitle: "Welcome to EasyCV",
    authSignIn: "Sign In",
    authSignUp: "Sign Up",
    emailLabel: "Email",
    passwordLabel: "Password",
    confirmPasswordLabel: "Confirm Password",
    forgotPassword: "Forgot password?",
    signingIn: "Signing in...",
    creatingAccount: "Creating account...",
    continueWithGoogle: "Continue with Google",
    verifyEmailTitle: "Verify your email",
    resetPasswordTitle: "Reset your password",
    otpSentTo: (email: string) => `We sent a verification code to ${email}.`,
    otpSignupHint: "Enter it below to confirm your account.",
    otpRecoveryHint: "Enter it below to reset your password.",
    spamHint: "Can't find it? Check your spam or junk folder.",
    verificationCode: "Verification code",
    verifying: "Verifying...",
    verifyEmail: "Verify Email",
    continueBtn: "Continue",
    back: "← Back",
    resendCode: "Resend code",
    resetPasswordPageTitle: "Reset password",
    resetPasswordDesc: "Enter your email and we'll send you a verification code to reset your password.",
    sendResetCode: "Send reset code",
    sending: "Sending...",
    passwordPlaceholder: "Min 6 chars, letters + numbers",
    confirmPasswordPlaceholder: "Re-enter your password",
    passwordHint: "Password must be at least 6 characters",
    passwordLetterHint: "Password must contain at least one letter",
    passwordNumberHint: "Password must contain at least one number",
    passwordsNoMatch: "Passwords do not match",
    confirmPasswordRequired: "Please confirm your password",
    emailRequired: "Please enter a valid email",
    passwordRequired: "Password is required",

    /* ---- Editor toolbar ---- */
    backToWorkspace: "Back to workspace",
    savedStatus: "Saved",
    savingStatus: "Saving...",
    unsavedStatus: "Unsaved changes",
    exportLabel: "Export",
    downloadPdf: "Download PDF",
    downloadPng: "Download PNG",
    exporting: "Exporting...",
    editorResumeSettings: "Resume Settings",

    /* ---- Form panel ---- */
    expandAll: "Expand All",
    collapseAll: "Collapse All",
    resetBtn: "Reset",
    saveBtn: "Save",
    addSection: "Add Section",
    resetTitle: "Reset all content?",
    resetDesc: "This will clear all sections and personal information. This action cannot be undone.",
    resetConfirm: "Reset",
  },

  zh: {
    /* ---- Landing ---- */
    betaBadge: "公测中 — 免费使用",
    heroTitle1: "专业简历，",
    heroTitle2: "轻松制作。",
    heroSubtitle: "填写内容，智能排版。\n几分钟，打造令人印象深刻的简历。",
    startBuilding: "立即开始",
    seeExamples: "查看示例",
    signIn: "登录",
    getStarted: "注册",
    featuresTitle1: "功能齐全，",
    featuresTitle2: "简单易用。",
    featuresSubtitle: "三步完成，从空白页到精美简历。",
    footer: "© 2026 EasyCV. 保留所有权利。",

    /* ---- Feature cards ---- */
    feature1Title: "表单式填写",
    feature1Desc: "直接填写工作经历、教育背景和技能，无需排版烦恼——智能表单引导你逐步完成每个模块。",
    feature2Title: "实时 A4 预览",
    feature2Desc: "边填写边看到简历实时更新，所见即所得——像素级精准的 A4 版式，每次都完美呈现。",
    feature3Title: "导出 PDF 与 Word",
    feature3Desc: "一键下载精美 PDF 或可编辑的 Word 文档，随时发送给任何招聘方。",

    /* ---- Workspace ---- */
    newResume: "新建简历",
    myResumes: "我的简历",
    myResumesSubtitle: "创建并管理你的专业简历",
    signOut: "退出登录",
    accountSettings: "账户设置",

    /* ---- Empty state ---- */
    noResumesTitle: "还没有简历",
    noResumesDesc: "创建你的第一份简历，只需几分钟。",
    createFirstResume: "创建第一份简历",

    /* ---- Resume card ---- */
    edited: "编辑于",
    justNow: "刚刚",
    edit: "编辑",
    settings: "设置",
    duplicate: "复制",
    delete: "删除",
    timeMinute: (n: number) => `${n} 分钟前`,
    timeHour: (n: number) => `${n} 小时前`,
    timeDay: (n: number) => `${n} 天前`,
    timeMonth: (n: number) => `${n} 个月前`,

    /* ---- Resume settings dialog ---- */
    resumeSettings: "简历设置",
    resumeSettingsDesc: "修改简历的标题和模板。",
    titleLabel: "标题",
    titleTooLong: (max: number) => `标题不能超过 ${max} 个字符。`,
    languageLabel: "语言",
    templateLabel: "模板",
    cancel: "取消",
    save: "保存",
    saving: "保存中…",
    deleteResume: "删除简历？",
    deleteDesc: (title: string) => `"${title}" 将被永久删除，此操作无法撤销。`,
    deleting: "删除中…",

    /* ---- Create resume modal ---- */
    createNewResume: "新建简历",
    createNewResumeDesc: "为简历起个名字，并选择模板。",
    resumeTitlePlaceholder: "例：软件工程师简历",
    creating: "创建中…",
    create: "创建",

    /* ---- Template / language options ---- */
    templateGeneral: "通用",
    langEnglish: "英文",
    langChinese: "中文",

    /* ---- Auth modal ---- */
    welcomeTitle: "欢迎使用 EasyCV",
    authSignIn: "登录",
    authSignUp: "注册",
    emailLabel: "邮箱",
    passwordLabel: "密码",
    confirmPasswordLabel: "确认密码",
    forgotPassword: "忘记密码？",
    signingIn: "登录中…",
    creatingAccount: "创建账户中…",
    continueWithGoogle: "使用 Google 继续",
    verifyEmailTitle: "验证邮箱",
    resetPasswordTitle: "重置密码",
    otpSentTo: (email: string) => `我们已向 ${email} 发送了验证码。`,
    otpSignupHint: "请输入验证码以确认你的账户。",
    otpRecoveryHint: "请输入验证码以重置密码。",
    spamHint: "找不到邮件？请检查垃圾邮件或广告邮件文件夹。",
    verificationCode: "验证码",
    verifying: "验证中…",
    verifyEmail: "验证邮箱",
    continueBtn: "继续",
    back: "← 返回",
    resendCode: "重新发送",
    resetPasswordPageTitle: "重置密码",
    resetPasswordDesc: "输入你的邮箱，我们将向你发送验证码。",
    sendResetCode: "发送验证码",
    sending: "发送中…",
    passwordPlaceholder: "至少 6 位，含字母和数字",
    confirmPasswordPlaceholder: "再次输入密码",
    passwordHint: "密码至少 6 位",
    passwordLetterHint: "密码必须包含至少一个字母",
    passwordNumberHint: "密码必须包含至少一个数字",
    passwordsNoMatch: "两次输入的密码不一致",
    confirmPasswordRequired: "请确认密码",
    emailRequired: "请输入有效的邮箱地址",
    passwordRequired: "请输入密码",

    /* ---- Editor toolbar ---- */
    backToWorkspace: "返回工作台",
    savedStatus: "已保存",
    savingStatus: "保存中…",
    unsavedStatus: "有未保存的更改",
    exportLabel: "导出",
    downloadPdf: "下载 PDF",
    downloadPng: "下载 PNG",
    exporting: "导出中…",
    editorResumeSettings: "简历设置",

    /* ---- Form panel ---- */
    expandAll: "展开全部",
    collapseAll: "收起全部",
    resetBtn: "重置",
    saveBtn: "保存",
    addSection: "添加模块",
    resetTitle: "重置所有内容？",
    resetDesc: "这将清除所有模块和个人信息，此操作无法撤销。",
    resetConfirm: "重置",
  },
} as const;

type TranslationKey = keyof typeof t.en;

export type Translations = typeof t.en | typeof t.zh;

export function useTranslations(lang: UILang) {
  return (key: TranslationKey) => t[lang][key];
}

export { t };
export type { TranslationKey };
