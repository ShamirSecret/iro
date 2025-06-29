export type Language = "en" | "zh"

export interface Translations {
  // Navigation and common
  language: string
  home: string
  dashboard: string
  login: string
  logout: string
  register: string
  admin: string

  // Authentication
  connectWallet: string
  connectWalletToLogin: string
  connectWalletDesc: string
  connectWalletButton: string
  disconnectWallet: string
  walletConnected: string
  signToLogin: string
  loginSuccess: string
  loginFailed: string
  registrationSuccess: string
  registrationFailed: string

  // Registration
  registerAccount: string
  fullName: string
  emailAddress: string
  walletAddress: string
  walletAddressForRewards: string
  referralCode: string
  invitationCode: string
  submitRegistration: string
  registrationNote: string
  registrationDesc: string

  // Placeholders
  enterName: string
  enterEmail: string
  enterReferralCode: string
  walletPlaceholder: string
  captainInvitationPlaceholder: string
  crewInvitationPlaceholder: string

  // Wallet
  connect: string
  disconnect: string
  walletObtained: string
  connectWalletTip: string
  noWalletTip: string

  // Messages
  alreadyHaveAccount: string
  loginHere: string
  submitting: string

  // Dashboard
  welcome: string
  totalPoints: string
  personalPoints: string
  commissionPoints: string
  teamSize: string
  rank: string

  // Errors and messages
  errorOccurred: string
  pleaseWait: string
  loading: string
  success: string
  failed: string

  // Buttons
  submit: string
  cancel: string
  confirm: string
  back: string
  next: string

  // Example text for testing
  exampleText: string
}

const translations: Record<Language, Translations> = {
  en: {
    // Navigation and common
    language: "en",
    home: "Home",
    dashboard: "Dashboard",
    login: "Login",
    logout: "Logout",
    register: "Register",
    admin: "Admin",

    // Authentication
    connectWallet: "Connect Wallet",
    connectWalletToLogin: "Connect Wallet to Login",
    connectWalletDesc: "Connect your crypto wallet to access your account",
    connectWalletButton: "Connect Wallet",
    disconnectWallet: "Disconnect Wallet",
    walletConnected: "Wallet Connected",
    signToLogin: "Sign to Login",
    loginSuccess: "Login successful!",
    loginFailed: "Login failed. Please try again.",
    registrationSuccess: "Registration successful!",
    registrationFailed: "Registration failed. Please check your information.",

    // Registration
    registerAccount: "Register Account",
    fullName: "Full Name",
    emailAddress: "Email Address",
    walletAddress: "Wallet Address",
    walletAddressForRewards: "Wallet Address (for receiving rewards)",
    referralCode: "Referral Code",
    invitationCode: "Invitation Code (Optional)",
    submitRegistration: "Submit Registration",
    registrationNote: "With invitation code - immediate activation, without code - requires admin approval",
    registrationDesc: "Create your PicWe account and start your journey.",

    // Placeholders
    enterName: "Enter your full name",
    enterEmail: "Enter your email address",
    enterReferralCode: "Enter referral code",
    walletPlaceholder: "0x... or click the button on the right to connect crypto wallet",
    captainInvitationPlaceholder: "Leave blank to register as captain, fill to register as crew",
    crewInvitationPlaceholder: "Enter the inviter's invitation code",

    // Wallet
    connect: "Connect",
    disconnect: "Disconnect",
    walletObtained: "✓ Wallet address obtained:",
    connectWalletTip:
      "💡 Tip: You can manually enter wallet address, or click 'Connect' button to automatically get from crypto wallet",
    noWalletTip: "If you haven't installed crypto wallet plugin, you can visit",

    // Messages
    alreadyHaveAccount: "Already have an account?",
    loginHere: "Login here",
    submitting: "Submitting...",

    // Dashboard
    welcome: "Welcome",
    totalPoints: "Total Points",
    personalPoints: "Personal Points",
    commissionPoints: "Commission Points",
    teamSize: "Team Size",
    rank: "Rank",

    // Errors and messages
    errorOccurred: "An error occurred",
    pleaseWait: "Please wait...",
    loading: "Loading...",
    success: "Success",
    failed: "Failed",

    // Buttons
    submit: "Submit",
    cancel: "Cancel",
    confirm: "Confirm",
    back: "Back",
    next: "Next",

    // Example text
    exampleText: "This is example text in English",
  },
  zh: {
    // Navigation and common
    language: "zh",
    home: "首页",
    dashboard: "仪表板",
    login: "登录",
    logout: "退出",
    register: "注册",
    admin: "管理员",

    // Authentication
    connectWallet: "连接钱包",
    connectWalletToLogin: "连接钱包登录",
    connectWalletDesc: "连接您的加密钱包以访问您的账户",
    connectWalletButton: "连接钱包",
    disconnectWallet: "断开钱包",
    walletConnected: "钱包已连接",
    signToLogin: "签名登录",
    loginSuccess: "登录成功！",
    loginFailed: "登录失败，请重试。",
    registrationSuccess: "注册成功！",
    registrationFailed: "注册失败，请检查您的信息。",

    // Registration
    registerAccount: "注册账户",
    fullName: "姓名",
    emailAddress: "邮箱地址",
    walletAddress: "钱包地址",
    walletAddressForRewards: "钱包地址 (用于接收奖励)",
    referralCode: "推荐码",
    invitationCode: "邀请码 (可选)",
    submitRegistration: "提交注册",
    registrationNote: "有邀请码则立即激活，无邀请码则需要管理员审核",
    registrationDesc: "创建您的 PicWe 账户，开始您的旅程。",

    // Placeholders
    enterName: "请输入您的姓名",
    enterEmail: "请输入您的邮箱地址",
    enterReferralCode: "请输入推荐码",
    walletPlaceholder: "0x... 或点击右侧按钮连接加密钱包",
    captainInvitationPlaceholder: "留空注册船长，填写则注册船员",
    crewInvitationPlaceholder: "请输入邀请人的邀请码",

    // Wallet
    connect: "连接",
    disconnect: "断开",
    walletObtained: "✓ 已获取钱包地址:",
    connectWalletTip: "💡 提示：您可以手动输入钱包地址，或点击'连接'按钮从加密钱包自动获取",
    noWalletTip: "如果没有安装加密钱包插件，可访问",

    // Messages
    alreadyHaveAccount: "已有账户？",
    loginHere: "在此登录",
    submitting: "提交中...",

    // Dashboard
    welcome: "欢迎",
    totalPoints: "总积分",
    personalPoints: "个人积分",
    commissionPoints: "佣金积分",
    teamSize: "团队规模",
    rank: "排名",

    // Errors and messages
    errorOccurred: "发生错误",
    pleaseWait: "请稍候...",
    loading: "加载中...",
    success: "成功",
    failed: "失败",

    // Buttons
    submit: "提交",
    cancel: "取消",
    confirm: "确认",
    back: "返回",
    next: "下一步",

    // Example text
    exampleText: "这是中文示例文本",
  },
}

export function getTranslation(language: Language, key: keyof Translations): string {
  return translations[language][key] || translations.en[key] || key
}

export function getAllTranslations(language: Language): Translations {
  return translations[language] || translations.en
}
