
const t = {
  en: {
    /* ---- Entry page ---- */
    appName: "EasyCV",
    appTagline: "Free online CV builder",
    createCv: "New Resume",
    createCvDesc: "Create a professional resume in minutes.",
    createAcademicCv: "Academic CV",
    createAcademicCvDesc: "Build a detailed CV for academic and research positions.",
    footer: "© 2026 EasyCV. All rights reserved.",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    getStarted: "Get Started",

    /* ---- Create Resume dialog ---- */
    createNewResume: "Create New Resume",
    createNewResumeDesc: "Give your resume a title and pick a language.",
    resumeTitlePlaceholder: "e.g. Software Engineer Resume",

    /* ---- Create Academic CV dialog ---- */
    createNewAcademicCv: "Create New Academic CV",
    createNewAcademicCvDesc: "Give your CV a title and pick a language.",
    academicCvTitlePlaceholder: "e.g. Research CV",
    creating: "Creating...",
    create: "Create",

    /* ---- Template / language options ---- */
    templateGeneral: "General",
    langEnglish: "English",
    langChinese: "Chinese",
    titleLabel: "Title",
    titleTooLong: (max: number) => `Title must be ${max} characters or fewer.`,
    languageLabel: "Language",
    templateLabel: "Template",
    cancel: "Cancel",
    save: "Save",

    /* ---- Editor toolbar ---- */
    backToHome: "Back to home",
    exportLabel: "Export",
    exportPdf: "Save as PDF",
    exportPng: "Save as PNG",
    exporting: "Exporting…",
    editorResumeSettings: "Resume Settings",

    /* ---- Form panel ---- */
    expandAll: "Expand All",
    collapseAll: "Collapse All",
    resetBtn: "Reset",
    addSection: "Add Section",
    resetTitle: "Reset all content?",
    resetDesc: "This will clear all sections and personal information. This action cannot be undone.",
    resetConfirm: "Reset",

    /* ---- Summary section ---- */
    summaryLabel: "Summary",
    summaryPlaceholder: "A brief overview of your background, skills, and career goals…",
  },

  zh: {
    /* ---- Entry page ---- */
    appName: "EasyCV",
    appTagline: "免费在线 CV 制作工具",
    createCv: "新建简历",
    createCvDesc: "几分钟内制作一份专业简历。",
    createAcademicCv: "学术简历",
    createAcademicCvDesc: "为学术和科研岗位制作详细的学术简历。",
    footer: "© 2026 EasyCV. 保留所有权利。",
    privacyPolicy: "隐私政策",
    termsOfService: "服务条款",
    getStarted: "开始使用",

    /* ---- Create Resume dialog ---- */
    createNewResume: "新建简历",
    createNewResumeDesc: "为简历起个名字，并选择语言。",
    resumeTitlePlaceholder: "例：软件工程师简历",

    /* ---- Create Academic CV dialog ---- */
    createNewAcademicCv: "新建学术简历",
    createNewAcademicCvDesc: "为学术简历起个名字，并选择语言。",
    academicCvTitlePlaceholder: "例：研究员学术简历",
    creating: "创建中…",
    create: "创建",

    /* ---- Template / language options ---- */
    templateGeneral: "通用",
    langEnglish: "英文",
    langChinese: "中文",
    titleLabel: "标题",
    titleTooLong: (max: number) => `标题不能超过 ${max} 个字符。`,
    languageLabel: "语言",
    templateLabel: "模板",
    cancel: "取消",
    save: "保存",

    /* ---- Editor toolbar ---- */
    backToHome: "返回首页",
    exportLabel: "导出",
    exportPdf: "保存为 PDF",
    exportPng: "保存为 PNG",
    exporting: "导出中…",
    editorResumeSettings: "简历设置",

    /* ---- Form panel ---- */
    expandAll: "展开全部",
    collapseAll: "收起全部",
    resetBtn: "重置",
    addSection: "添加模块",
    resetTitle: "重置所有内容？",
    resetDesc: "这将清除所有模块和个人信息，此操作无法撤销。",
    resetConfirm: "重置",

    /* ---- Summary section ---- */
    summaryLabel: "个人简介",
    summaryPlaceholder: "简要介绍您的背景、技能和职业目标…",
  },
} as const;

export type Translations = typeof t.en | typeof t.zh;

export { t };
