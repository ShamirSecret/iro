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
  registerAsCaptain: string
  registerAsCrew: string
  fullName: string
  emailAddress: string
  walletAddress: string
  referralCode: string
  submitRegistration: string

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

  // Placeholders
  enterName: string
  enterEmail: string
  enterReferralCode: string

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
    registerAsCaptain: "Register as Captain",
    registerAsCrew: "Register as Crew",
    fullName: "Full Name",
    emailAddress: "Email Address",
    walletAddress: "Wallet Address",
    referralCode: "Referral Code",
    submitRegistration: "Submit Registration",

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

    // Placeholders
    enterName: "Enter your full name",
    enterEmail: "Enter your email address",
    enterReferralCode: "Enter referral code",

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
    registerAsCaptain: "注册为船长",
    registerAsCrew: "注册为船员",
    fullName: "姓名",
    emailAddress: "邮箱地址",
    walletAddress: "钱包地址",
    referralCode: "推荐码",
    submitRegistration: "提交注册",

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

    // Placeholders
    enterName: "请输入您的姓名",
    enterEmail: "请输入您的邮箱地址",
    enterReferralCode: "请输入推荐码",

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
