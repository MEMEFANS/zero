import React from 'react';
import { useContext } from 'react';
import { LanguageContext } from '../../../App';

const InviteCode = ({ inviteCode, account }) => {
  const { t } = useContext(LanguageContext);
  const code = inviteCode || account?.slice(-6).toUpperCase();

  const handleCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      alert('复制成功！');
    }
  };

  return (
    <div className="mt-6 bg-[#1A2438]/80 backdrop-blur-xl p-6 rounded-lg border border-green-500/20 max-w-md">
      <div className="flex items-center">
        <div className="text-green-400 mb-2">{t('myInviteCode')}</div>
      </div>
      <div className="flex items-center space-x-3">
        <div className="bg-[#0B1120] border border-green-500/20 rounded-lg px-4 py-2 text-white font-mono text-xl text-center flex-1">
          {code}
        </div>
        <button
          onClick={handleCopy}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white font-medium py-2 px-6 rounded-lg hover:from-green-600 hover:to-green-700 transition-all whitespace-nowrap"
        >
          {t('copy')}
        </button>
      </div>
    </div>
  );
};

export default InviteCode;
