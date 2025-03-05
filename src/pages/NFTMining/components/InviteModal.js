import React from 'react';
import { useContext } from 'react';
import { LanguageContext } from '../../../App';

const InviteModal = ({ isOpen, onClose, onConfirm, inviteCode, setInviteCode, isSubmitting }) => {
  const { t } = useContext(LanguageContext);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* 模态框 */}
      <div className="relative bg-[#1A2438] rounded-lg p-6 w-full max-w-md mx-4">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-green-400">{t('enterInviteCode')}</h3>
          <p className="text-green-400/60 text-sm mt-1">{t('inviteCodeDescription')}</p>
        </div>

        {/* 输入框 */}
        <input
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder={t('inviteCodePlaceholder')}
          className="w-full bg-[#0B1120] border border-green-500/20 rounded-lg px-4 py-2 text-white mb-4 focus:outline-none focus:border-green-500/40"
        />

        {/* 按钮组 */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-500/20 text-gray-400 py-2 px-4 rounded-lg hover:bg-gray-500/30 transition-all"
            disabled={isSubmitting}
          >
            {t('cancel')}
          </button>
          <button
            onClick={() => onConfirm(inviteCode)}
            className="flex-1 bg-green-500/20 text-green-400 py-2 px-4 rounded-lg hover:bg-green-500/30 transition-all"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-500 border-t-transparent"></div>
              </div>
            ) : (
              t('confirm')
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
