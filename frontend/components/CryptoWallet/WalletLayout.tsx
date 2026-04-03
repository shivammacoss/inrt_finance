'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon, Wallet, ArrowUpDown, Send, Download, History, Search, Menu, X, Copy, ExternalLink } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import './WalletStyles.css'

interface Token {
  symbol: string
  name: string
  balance: number
  value: number
  change24h: number
  icon: string
}

interface Transaction {
  id: string
  type: 'send' | 'receive' | 'swap'
  token: string
  amount: number
  value: number
  from: string
  to: string
  timestamp: Date
  hash: string
  status: 'completed' | 'pending' | 'failed'
}

export default function CryptoWallet() {
  const { user } = useAuth()
  const [darkMode, setDarkMode] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Real wallet data from API
  const [balance, setBalance] = useState('0')
  const [walletAddress, setWalletAddress] = useState('')
  const [transactions, setTransactions] = useState<Record<string, unknown>[]>([])
  const [depositInfo, setDepositInfo] = useState<any>(null)

  // Load real data from API
  const loadWalletData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const [balanceRes, txRes, depositRes] = await Promise.all([
        api.balance(),
        api.transactions(20),
        api.depositInfo()
      ])
      setBalance(balanceRes.balance)
      setWalletAddress(balanceRes.walletAddress || '')
      setTransactions(txRes.transactions || [])
      setDepositInfo(depositRes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallet data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      void loadWalletData()
    }
  }, [user])

  // Mock data for tokens (INRT + other assets)
  const portfolioValue = parseFloat(balance) * 0.0133 // Approximate INRT to USD conversion
  const change24h = 2.34

  const tokens: Token[] = [
    { symbol: 'INRT', name: 'Indian Rupee Token', balance: parseFloat(balance) || 0, value: portfolioValue, change24h: 2.1, icon: '🇮🇳' },
    { symbol: 'ETH', name: 'Ethereum', balance: 0, value: 0, change24h: 3.2, icon: '�' },
    { symbol: 'USDC', name: 'USD Coin', balance: 0, value: 0, change24h: 0.1, icon: '💵' },
    { symbol: 'BNB', name: 'BNB', balance: 0, value: 0, change24h: -1.2, icon: '�' },
  ]

  // Transform real transactions for display
  const displayTransactions = transactions.slice(0, 10).map((tx, index) => ({
    id: String(tx._id || index),
    type: tx.type === 'deposit' ? 'receive' : tx.type === 'withdraw' ? 'send' : 'transfer',
    token: 'INRT',
    amount: parseFloat(String(tx.amount || 0)),
    value: parseFloat(String(tx.amount || 0)) * 0.0133,
    from: tx.from || walletAddress,
    to: tx.to || walletAddress,
    timestamp: new Date(String(tx.createdAt || Date.now())),
    hash: String(tx.txHash || ''),
    status: tx.status === 'completed' ? 'completed' : tx.status === 'pending' ? 'pending' : 'failed'
  }))

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress)
    setCopiedAddress(true)
    setTimeout(() => setCopiedAddress(false), 2000)
  }

  const filteredTokens = tokens.filter(token =>
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen transition-colors duration-300">
        {/* Header */}
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
                <div className="flex items-center space-x-2">
                  <Wallet className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-1.5 text-white" />
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    CryptoWallet
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <div className="hidden sm:flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {formatAddress(walletAddress)}
                  </span>
                  <button
                    onClick={copyAddress}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 dark:border-gray-700">
              <nav className="px-4 py-2 space-y-1">
                {['dashboard', 'tokens', 'send', 'receive', 'history'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab)
                      setMobileMenuOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg capitalize ${
                      activeTab === tab
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>
          )}
        </header>

        {/* Desktop Navigation */}
        <nav className="hidden lg:block bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {['dashboard', 'tokens', 'send', 'receive', 'history'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-gradient-to-r from-blue-500 to-purple-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-green-800 dark:text-green-200">{success}</p>
            </div>
          )}
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Portfolio Overview */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Portfolio Value</p>
                    <h2 className="text-4xl font-bold mt-2">${portfolioValue.toLocaleString()}</h2>
                    <div className="flex items-center mt-2 space-x-2">
                      <span className={`text-sm font-medium ${change24h >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                        {change24h >= 0 ? '↑' : '↓'} {Math.abs(change24h)}%
                      </span>
                      <span className="text-blue-100 text-sm">24h</span>
                    </div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <Wallet className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('send')}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
                >
                  <Send className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Send</p>
                </button>
                <button
                  onClick={() => setActiveTab('receive')}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
                >
                  <Download className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Receive</p>
                </button>
                <button className="bg-white dark:bg-gray-800 rounded-xl p-4 hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700">
                  <ArrowUpDown className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Swap</p>
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
                >
                  <History className="w-6 h-6 text-orange-600 dark:text-orange-400 mb-2" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">History</p>
                </button>
              </div>

              {/* Recent Transactions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {displayTransactions.slice(0, 3).map((tx: any, index: number) => (
                    <div key={`tx-${index}`} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === 'send' ? 'bg-red-100 dark:bg-red-900' :
                          tx.type === 'receive' ? 'bg-green-100 dark:bg-green-900' :
                          'bg-purple-100 dark:bg-purple-900'
                        }`}>
                          {tx.type === 'send' && <ArrowUpDown className="w-5 h-5 text-red-600 dark:text-red-400" />}
                          {tx.type === 'receive' && <Download className="w-5 h-5 text-green-600 dark:text-green-400" />}
                          {tx.type === 'swap' && <ArrowUpDown className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white capitalize">
                            {String(tx.type || 'unknown')} {String(tx.token || 'INRT')}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatTime(new Date(tx.timestamp || Date.now()))}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
                          tx.type === 'send' ? 'text-red-600 dark:text-red-400' :
                          tx.type === 'receive' ? 'text-green-600 dark:text-green-400' :
                          'text-purple-600 dark:text-purple-400'
                        }`}>
                          {tx.type === 'send' ? '-' : '+'}{String(tx.amount || '0')} {String(tx.token || 'INRT')}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          ${Number(tx.value || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tokens Tab */}
          {activeTab === 'tokens' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-0">Your Tokens</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search tokens..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredTokens.map((token) => (
                    <div key={token.symbol} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{token.icon}</div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{token.symbol}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{token.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">{token.balance.toLocaleString()}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">${token.value.toFixed(2)}</p>
                        <p className={`text-xs font-medium ${
                          token.change24h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {token.change24h >= 0 ? '↑' : '↓'} {Math.abs(token.change24h)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Send Tab */}
          {activeTab === 'send' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Send Crypto</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Asset
                    </label>
                    <select className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white">
                      {tokens.map((token) => (
                        <option key={token.symbol} value={token.symbol}>
                          {token.icon} {token.symbol} - {token.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Recipient Address
                    </label>
                    <input
                      type="text"
                      placeholder="0x0000...0000"
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Amount
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="0.00"
                        className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                      />
                      <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                        Max
                      </button>
                    </div>
                  </div>

                  <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-colors">
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Receive Tab */}
          {activeTab === 'receive' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Receive Crypto</h3>
                
                <div className="space-y-6">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-8 text-center">
                    <div className="w-48 h-48 mx-auto bg-white rounded-lg p-4 mb-4">
                      <div className="w-full h-full bg-gray-300 rounded flex items-center justify-center">
                        <span className="text-gray-600">QR Code</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Your Wallet Address</p>
                      <div className="flex items-center justify-center space-x-2">
                        <code className="bg-gray-200 dark:bg-gray-600 px-3 py-1 rounded text-sm font-mono">
                          {walletAddress}
                        </code>
                        <button
                          onClick={copyAddress}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {tokens.slice(0, 4).map((token) => (
                      <div key={token.symbol} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                        <div className="text-2xl mb-2">{token.icon}</div>
                        <p className="font-medium text-gray-900 dark:text-white">{token.symbol}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{token.balance.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Transaction History</h3>
                
                <div className="space-y-3">
                  {transactions.map((tx, index) => {
                    const typeStr = String(tx.type ?? '');
                    const tokenStr = String(tx.token ?? '');
                    const amountStr = String(tx.amount ?? '');
                    const statusStr = String(tx.status ?? '');
                    const ts = tx.timestamp;
                    const valueNum = Number(tx.value);
                    const valueUsd = Number.isFinite(valueNum) ? valueNum : 0;
                    return (
                    <div
                      key={String(tx._id ?? (tx as { id?: unknown }).id ?? `tx-${index}`)}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            typeStr === 'send' ? 'bg-red-100 dark:bg-red-900' :
                            typeStr === 'receive' ? 'bg-green-100 dark:bg-green-900' :
                            'bg-purple-100 dark:bg-purple-900'
                          }`}>
                            {typeStr === 'send' && <ArrowUpDown className="w-5 h-5 text-red-600 dark:text-red-400" />}
                            {typeStr === 'receive' && <Download className="w-5 h-5 text-green-600 dark:text-green-400" />}
                            {typeStr === 'swap' && <ArrowUpDown className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white capitalize">
                              {typeStr} {tokenStr}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {formatTime(new Date(ts ? String(ts) : Date.now()))}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${
                            typeStr === 'send' ? 'text-red-600 dark:text-red-400' :
                            typeStr === 'receive' ? 'text-green-600 dark:text-green-400' :
                            'text-purple-600 dark:text-purple-400'
                          }`}>
                            {typeStr === 'send' ? '-' : '+'}{amountStr} {tokenStr}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">${valueUsd.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            statusStr === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            statusStr === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {statusStr}
                          </span>
                        </div>
                        <button className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                          <ExternalLink className="w-3 h-3" />
                          <span>View on Explorer</span>
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
