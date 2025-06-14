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

  // Registration form specific
  captainRegistrationNote: string
  crewRegistrationNote: string
  captainRegistrationDesc: string
  crewRegistrationDesc: string
  walletAddressForRewards: string
  connectWalletToGetAddress: string
  walletConnected: string
  pleaseEnterValidEmail: string
  usernameValidation: string
  emailValidation: string
  registrationInProgress: string
  alreadyHaveAccount: string
  loginHere: string
  tipConnectWallet: string
  downloadWalletTip: string
  becomeCaptain: string
  becomeCrew: string

  // Login form specific
  connectWalletToLogin: string
  connectWalletDesc: string
  getNonce: string
  gettingNonce: string
  signAndLogin: string
  signingIn: string
  noAccount: string
  registerNow: string
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

    // Registration form specific
    captainRegistrationNote: "Captain registration requires admin approval before use",
    crewRegistrationNote: "Crew registration is available immediately after invitation code verification",
    captainRegistrationDesc: "Fill in your information to apply to become a captain, pending admin approval.",
    crewRegistrationDesc: "Fill in your information and provide invitation code to join the team.",
    walletAddressForRewards: "Wallet Address (for receiving rewards)",
    connectWalletToGetAddress: "Connect",
    walletConnected: "Wallet connected",
    pleaseEnterValidEmail: "Please enter a valid email address",
    usernameValidation: "Username must be 3-20 characters, letters and numbers only",
    emailValidation: "Please enter a valid email address, max 50 characters",
    registrationInProgress: "Submitting...",
    alreadyHaveAccount: "Already have an account?",
    loginHere: "Login here",
    tipConnectWallet:
      "💡 Tip: You can manually enter wallet address or click 'Connect' to get it from your crypto wallet",
    downloadWalletTip: "If you don't have a crypto wallet installed, visit",
    becomeCaptain: "Become Captain",
    becomeCrew: "Become Crew",

    // Login form specific
    connectWalletToLogin: "Connect Wallet to Login",
    connectWalletDesc: "Please connect your crypto wallet for authentication",
    getNonce: "Get Nonce",
    gettingNonce: "Getting Nonce...",
    signAndLogin: "Sign & Login",
    signingIn: "Signing In...",
    noAccount: "Don't have an account?",
    registerNow: "Register Now",
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

    // Registration form specific
    captainRegistrationNote: "船长注册需要管理员审核通过后才能使用",
    crewRegistrationNote: "船员注册通过邀请码验证后即可直接使用",
    captainRegistrationDesc: "填写您的信息申请成为船长，需要等待管理员审核。",
    crewRegistrationDesc: "填写您的信息并提供邀请码加入团队。",
    walletAddressForRewards: "钱包地址 (用于接收奖励)",
    connectWalletToGetAddress: "连接",
    disconnectWallet: "断开",
    walletConnected: "钱包已连接",
    pleaseEnterValidEmail: "请输入有效的邮箱地址",
    usernameValidation: "用户名只能由3-20位字母和数字组成",
    emailValidation: "请输入有效的邮箱地址，且长度不超过50个字符",
    registrationInProgress: "提交中...",
    alreadyHaveAccount: "已有账户？",
    loginHere: "在此登录",
    tipConnectWallet: '💡 提示：您可以手动输入钱包地址，或点击"连接"按钮从加密钱包自动获取',
    downloadWalletTip: "如果没有安装加密钱包插件，可访问",
    becomeCaptain: "成为船长",
    becomeCrew: "成为船员",

    // Login form specific
    connectWalletToLogin: "连接钱包登录",
    connectWalletDesc: "请连接您的加密钱包进行身份验证",
    getNonce: "获取随机数",
    gettingNonce: "获取随机数中...",
    signAndLogin: "签名并登录",
    signingIn: "登录中...",
    noAccount: "还没有账户？",
    registerNow: "立即注册",
  },
}

export const getTranslation = (language: Language, key: keyof Translations): string => {
  return translations[language][key] || translations.en[key] || key
}
