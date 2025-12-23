import React, { useState, useEffect } from 'react';
import { useUserStore } from '../store/userStore';
import { api } from '../services/api';
import { X, Check, Copy, Loader2, Crown, Share2, CreditCard, ShoppingBag } from 'lucide-react';
import { TRANSLATIONS } from '../utils/translations';
import { Language } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, language = Language.ZH_HANS }) => {
  const { user, stats, isPro, token, checkStatus } = useUserStore();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [refCode, setRefCode] = useState<string | null>(null);

  // 当模态框打开时，确保加载用户统计信息
  React.useEffect(() => {
    if (isOpen && token && !stats) {
      checkStatus();
    }
  }, [isOpen, token, stats, checkStatus]);

  if (!isOpen) return null;

  const t = TRANSLATIONS[language]?.upgrade_pro_modal || TRANSLATIONS[Language.EN].upgrade_pro_modal;

  const handleRedeem = async () => {
    // ... existing logic ...
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
        
        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
              {isPro ? <Crown className="text-yellow-500 fill-yellow-500" /> : <Crown className="text-gray-400" />}
              {isPro ? t.title.replace("Upgrade", "Pro Member") : t.title}
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
            <div className="mb-8 grid grid-cols-1 gap-3">
              <a 
                href="https://sonicwave130.gumroad.com/l/vyfnpv" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                <CreditCard size={18} />
                {t.buy_gumroad}
              </a>
              <a 
                href="https://m.tb.cn/h.7VIucp7?tk=oknrfwFvV1s" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-[#FFDA00] text-[#333] rounded-lg hover:bg-[#FFED4D] transition-colors font-medium"
              >
                <ShoppingBag size={18} />
                {t.buy_xianyu}
              </a>
            </div>
          )}

          {/* Activation Code Input */}
          <div className="mb-6">
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
                placeholder={t.placeholder}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button 
                onClick={handleRedeem}
                disabled={loading || !code}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : t.redeem}
              </button>
            </div>
            {msg && (
              <p className={`text-sm mt-2 ${msg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {msg.text}
              </p>
            )}
          </div>

          {/* Referral Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Share2 size={20} /> {t.invite_title}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {t.invite_desc}
            </p>
            
            {/* 邀请统计 */}
            {stats && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{t.invite_count}:</span>
                  <span className="text-lg font-bold text-blue-600">{stats.inviteCount || 0}</span>
                </div>
                {stats.inviteCount < 3 && (
                  <p className="text-xs text-blue-600 mt-2">
                    {t.invite_progress.replace('{count}', String(3 - stats.inviteCount))}
                  </p>
                )}
                {stats.inviteCount >= 3 && (
                  <p className="text-xs text-green-600 mt-2 font-semibold">
                    {t.invite_lifetime}
                  </p>
                )}
              </div>
            )}
            
            {refCode ? (
              <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between border">
                <code className="text-sm text-blue-600 truncate flex-1">{shareUrl}</code>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    setMsg({ type: 'success', text: '邀请链接已复制！' });
                  }}
                  className="text-gray-500 hover:text-gray-700 p-1 ml-2"
                >
                  <Copy size={18} />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleCreateReferral}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
              >
                {t.generate_link}
              </button>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 text-center">
          <p className="text-xs text-gray-400">User ID: {user?.id}</p>
        </div>
      </div>
    </div>
  );
};

