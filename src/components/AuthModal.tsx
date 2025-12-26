import React, { useState, useEffect } from 'react';
import { useUserStore } from '../store/userStore';
import { api } from '../services/api';
import { X, Check, Copy, Loader2, Crown, Share2, CreditCard } from 'lucide-react';
import { TRANSLATIONS } from '../utils/translations';
import { Language } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

export const AuthModal: React.FC<AuthModalProps & { initialTab?: 'upgrade' | 'invite' }> = ({ isOpen, onClose, language = Language.ZH_HANS, initialTab = 'upgrade' }) => {
  const { user, stats, isPro, token, checkStatus } = useUserStore();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [refCode, setRefCode] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<'gumroad' | 'wechat'>('gumroad');
  const [activeTab, setActiveTab] = useState<'upgrade' | 'invite'>(initialTab);

  // Sync tab with props when opening
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // 当模态框打开时，确保加载用户统计信息
  React.useEffect(() => {
    if (isOpen && token && !stats) {
      checkStatus();
    }
  }, [isOpen, token, stats, checkStatus]);

  if (!isOpen) return null;

  const t = TRANSLATIONS[language]?.upgrade_pro_modal || TRANSLATIONS[Language.EN].upgrade_pro_modal;

  const handleRedeem = async () => {
    if (!code || !token) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.redeemCode(token, code);
      if (res.success) {
        setMsg({ type: 'success', text: 'Activation successful! You are now Pro.' });
        await checkStatus();
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setMsg({ type: 'error', text: res.error || 'Invalid code' });
      }
    } catch (e) {
      setMsg({ type: 'error', text: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReferral = async () => {
    if (!token) return;
    try {
      const res = await api.createReferral(token);
      if (res.success) {
        setRefCode(res.data.referralCode);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const shareUrl = refCode ? `${window.location.origin}/?ref=${refCode}` : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative flex flex-col max-h-[90vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
          <X size={24} />
        </button>

        {/* Tabs Header */}
        <div className="flex border-b">
          <button
            className={`flex-1 py-4 font-semibold text-sm transition-colors ${activeTab === 'upgrade' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('upgrade')}
          >
            {t.title}
          </button>
          <button
            className={`flex-1 py-4 font-semibold text-sm transition-colors ${activeTab === 'invite' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('invite')}
          >
            {t.invite_title}
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'upgrade' ? (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center justify-center gap-2">
                  {isPro ? <Crown className="text-yellow-500 fill-yellow-500" /> : <Crown className="text-gray-400" />}
                  {isPro ? "Pro 账号" : t.title}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  {isPro
                    ? (user?.expireAt
                      ? `${t.subtitle_active}: ${new Date(user.expireAt).toLocaleDateString()}`
                      : t.subtitle_lifetime)
                    : t.subtitle_inactive}
                </p>
              </div>

              {/* Payment Options */}
              {!isPro && (
                <div className="mb-6">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">付款方式</span>
                    </div>

                    <div className="flex rounded-lg bg-white border border-gray-200 p-1 mb-4">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="radio"
                          name="payMethod"
                          value="gumroad"
                          checked={payMethod === 'gumroad'}
                          onChange={() => setPayMethod('gumroad')}
                          className="sr-only peer"
                        />
                        <div className="py-1.5 px-3 text-center text-sm text-gray-500 peer-checked:bg-gray-900 peer-checked:text-white peer-checked:shadow-sm rounded transition-all font-bold">
                          Gumroad
                        </div>
                      </label>
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="radio"
                          name="payMethod"
                          value="wechat"
                          checked={payMethod === 'wechat'}
                          onChange={() => setPayMethod('wechat')}
                          className="sr-only peer"
                        />
                        <div className="py-1.5 px-3 text-center text-sm text-gray-500 peer-checked:bg-green-600 peer-checked:text-white peer-checked:shadow-sm rounded transition-all font-bold">
                          微信
                        </div>
                      </label>
                    </div>

                    {/* Gumroad 面板 */}
                    {payMethod === 'gumroad' && (
                      <div className="space-y-3">
                        <a
                          href="https://sonicwave130.gumroad.com/l/vyfnpv"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm transition-all"
                        >
                          <CreditCard size={16} />
                          {t.buy_gumroad}
                        </a>
                        <p className="text-xs text-center text-gray-500">
                          支付后激活码将发送至您的邮箱
                        </p>
                      </div>
                    )}

                    {/* 微信面板 (Simplified) */}
                    {payMethod === 'wechat' && (
                      <div className="space-y-3">
                        <div className="flex flex-col items-center">
                          <img
                            src="/IMG_5188.JPG"
                            alt="微信收款码"
                            className="max-w-[200px] h-auto rounded-lg shadow-sm mb-2"
                          />
                          <p className="text-xs text-gray-500 text-center">
                            扫码支付 (备注: 激活码)<br />
                            <span className="font-bold text-gray-700">联系我获取: sonic_yann</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Activation Code Input */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-px bg-gray-200 flex-1"></div>
                  <span className="text-xs text-gray-400 font-medium uppercase">{t.have_code}</span>
                  <div className="h-px bg-gray-200 flex-1"></div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="输入激活码"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                  <button
                    onClick={handleRedeem}
                    disabled={loading || !code}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
                  >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : t.redeem}
                  </button>
                </div>
                {msg && (
                  <p className={`text-xs mt-2 text-center ${msg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                    {msg.text}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Invite Tab */}
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Share2 className="text-indigo-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-800">{t.invite_title}</h3>
                <p className="text-sm text-gray-600 mt-2">
                  {t.invite_desc}
                </p>
              </div>

              {/* 邀请统计 */}
              {stats && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">已邀请人数</span>
                    <span className="text-xl font-bold text-indigo-600">{stats.inviteCount || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((stats.inviteCount / 3) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0人</span>
                    <span>目标: 3人 (永久Pro)</span>
                  </div>
                </div>
              )}

              {refCode ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">您的专属链接:</p>
                  <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between border border-gray-200">
                    <code className="text-xs text-indigo-600 truncate flex-1 font-mono">{shareUrl}</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shareUrl);
                        setMsg({ type: 'success', text: '已复制' });
                        setTimeout(() => setMsg(null), 2000);
                      }}
                      className="text-gray-500 hover:text-gray-700 p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                  {msg && msg.text === '已复制' && (
                    <p className="text-xs text-green-600 text-center">链接已复制到剪贴板！</p>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleCreateReferral}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-4"
                >
                  <Share2 size={18} />
                  生成我的邀请链接
                </button>
              )}
            </>
          )}

        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 text-center border-t border-gray-100">
          <p className="text-[10px] text-gray-400">User ID: {user?.id}</p>
        </div>
      </div>
    </div>
  );
};

