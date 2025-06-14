export type Language = "en" | "zh"

export interface Translations {
  // Navigation
  home: string
  dashboard: string
  admin: string
  login: string
  register: string
  logout: string

  // Common
  loading: string
  error: string
  success: string
  cancel: string
  confirm: string
  save: string
  edit: string
  delete: string
  search: string
  filter: string

  // Auth
  connectWallet: string
  disconnectWallet: string
  walletAddress: string
  signMessage: string
  verifyingLogin: string
  loginSuccess: string
  loginFailed: string

  // Dashboard
  welcome: string
  totalPoints: string
  myRank: string
  teamMembers: string
  walletInfo: string
  contactInfo: string
  referralCode: string
  inviteLink: string
  copyReferralCode: string
  copyInviteLink: string

  // Investment
  investments: string
  portfolio: string
  invest: string
  redeem: string
  matured: string
  active: string
  amount: string
  term: string
  apy: string

  // Admin
  adminDashboard: string
  totalDistributors: string
  pendingApprovals: string
  approvedDistributors: string
  rejectedApplications: string
  quickActions: string

  // Registration
  registerAsCaptain: string
  registerAsCrew: string
  fullName: string
  emailAddress: string
  invitationCode: string
  joinTeam: string
  applyToBeCaptain: string

  // Errors
  walletNotConnected: string
  invalidWalletAddress: string
  registrationFailed: string
  fetchDataFailed: string
}

export const translations: Record<Language, Translations> = {
  en: {
    // Navigation
    home: "Home",
    dashboard: "Dashboard",
    admin: "Admin",
    login: "Login",
    register: "Register",
    logout: "Logout",

    // Common
    loading: "Loading...",
    error: "Error",
    success: "Success",
    cancel: "Cancel",
    confirm: "Confirm",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    search: "Search",
    filter: "Filter",

    // Auth
    connectWallet: "Connect Wallet",
    disconnectWallet: "Disconnect",
    walletAddress: "Wallet Address",
    signMessage: "Sign Message",
    verifyingLogin: "Verifying Login...",
    loginSuccess: "Login Successful",
    loginFailed: "Login Failed",

    // Dashboard
    welcome: "Welcome back",
    totalPoints: "Total Points",
    myRank: "My Rank",
    teamMembers: "Team Members",
    walletInfo: "Wallet Info",
    contactInfo: "Contact Info",
    referralCode: "Referral Code",
    inviteLink: "Invite Link",
    copyReferralCode: "Copy Referral Code",
    copyInviteLink: "Copy Invite Link",

    // Investment
    investments: "Investments",
    portfolio: "Portfolio",
    invest: "Invest",
    redeem: "Redeem",
    matured: "Matured",
    active: "Active",
    amount: "Amount",
    term: "Term",
    apy: "APY",

    // Admin
    adminDashboard: "Admin Dashboard",
    totalDistributors: "Total Distributors",
    pendingApprovals: "Pending Approvals",
    approvedDistributors: "Approved Distributors",
    rejectedApplications: "Rejected Applications",
    quickActions: "Quick Actions",

    // Registration
    registerAsCaptain: "Register as Captain",
    registerAsCrew: "Register as Crew",
    fullName: "Full Name",
    emailAddress: "Email Address",
    invitationCode: "Invitation Code",
    joinTeam: "Join Team",
    applyToBeCaptain: "Apply to be Captain",

    // Errors
    walletNotConnected: "Wallet not connected",
    invalidWalletAddress: "Invalid wallet address",
    registrationFailed: "Registration failed",
    fetchDataFailed: "Failed to fetch data",
  },
  zh: {
    // Navigation
    home: "首页",
    dashboard: "仪表板",
    admin: "管理员",
    login: "登录",
    register: "注册",
    logout: "退出",

    // Common
    loading: "加载中...",
    error: "错误",
    success: "成功",
    cancel: "取消",
    confirm: "确认",
    save: "保存",
    edit: "编辑",
    delete: "删除",
    search: "搜索",
    filter: "筛选",

    // Auth
    connectWallet: "连接钱包",
    disconnectWallet: "断开连接",
    walletAddress: "钱包地址",
    signMessage: "签名消息",
    verifyingLogin: "验证登录中...",
    loginSuccess: "登录成功",
    loginFailed: "登录失败",

    // Dashboard
    welcome: "欢迎回来",
    totalPoints: "总积分",
    myRank: "我的排名",
    teamMembers: "团队成员",
    walletInfo: "钱包信息",
    contactInfo: "联系方式",
    referralCode: "推荐码",
    inviteLink: "邀请链接",
    copyReferralCode: "复制推荐码",
    copyInviteLink: "复制邀请链接",

    // Investment
    investments: "投资",
    portfolio: "投资组合",
    invest: "投资",
    redeem: "赎回",
    matured: "已到期",
    active: "活跃",
    amount: "金额",
    term: "期限",
    apy: "年化收益率",

    // Admin
    adminDashboard: "管理员概览",
    totalDistributors: "总注册船员",
    pendingApprovals: "待审核申请",
    approvedDistributors: "已批准船员",
    rejectedApplications: "已拒绝申请",
    quickActions: "快速操作",

    // Registration
    registerAsCaptain: "注册船长",
    registerAsCrew: "注册船员",
    fullName: "全名",
    emailAddress: "邮箱地址",
    invitationCode: "邀请码",
    joinTeam: "加入团队",
    applyToBeCaptain: "申请成为船长",

    // Errors
    walletNotConnected: "钱包未连接",
    invalidWalletAddress: "无效的钱包地址",
    registrationFailed: "注册失败",
    fetchDataFailed: "获取数据失败",
  },
}

export const getTranslation = (language: Language, key: keyof Translations): string => {
  return translations[language][key] || translations.en[key] || key
}
