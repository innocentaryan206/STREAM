import React from 'react';
import { Download, Tv, CheckCircle2, ChevronRight, Server, ShieldCheck, Link2, Activity, Globe } from 'lucide-react';
import { StreamCredentials, UserInfo, ServerInfo, Language } from '../types';
import { t, SUPPORTED_LANGUAGES } from '../services/translations';

interface ActionChoiceProps {
  credentials: StreamCredentials;
  userInfo: UserInfo | null;
  serverInfo: ServerInfo | null;
  onSelectAction: (action: 'download' | 'channels' | 'range_generator' | 'link_master' | 'track_url' | 'verifier') => void;
  lang: Language;
  onSelectLang?: (lang: Language) => void;
}

export const ActionChoice: React.FC<ActionChoiceProps> = ({
  credentials,
  userInfo,
  serverInfo,
  onSelectAction,
  lang,
  onSelectLang,
}) => {
  const expDateFormatted = userInfo?.exp_date
    ? new Date(parseInt(userInfo.exp_date, 10) * 1000).toLocaleDateString()
    : null;

  const tools = [
    {
      id: 'download' as const,
      num: '1',
      title: t('card_1_title', lang),
      badge: 'M3U / Plus',
      desc: t('card_1_desc', lang),
      btnText: t('card_1_btn', lang),
      icon: Download,
      color: 'indigo',
      bgLight: 'bg-indigo-50/80',
      borderHover: 'hover:border-indigo-500/70',
      textHover: 'group-hover:text-indigo-600',
      btnBg: 'bg-indigo-50 group-hover:bg-indigo-600 text-indigo-700 group-hover:text-white',
      iconBox: 'bg-indigo-50 border-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
    },
    {
      id: 'channels' as const,
      num: '2',
      title: t('card_2_title', lang),
      badge: 'Live TV',
      desc: t('card_2_desc', lang),
      btnText: t('card_2_btn', lang),
      icon: Tv,
      color: 'emerald',
      bgLight: 'bg-emerald-50/80',
      borderHover: 'hover:border-emerald-500/70',
      textHover: 'group-hover:text-emerald-700',
      btnBg: 'bg-emerald-50 group-hover:bg-emerald-600 text-emerald-800 group-hover:text-white',
      iconBox: 'bg-emerald-50 border-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
    },
    {
      id: 'range_generator' as const,
      num: '3',
      title: t('card_3_title', lang),
      badge: 'Range',
      desc: t('card_3_desc', lang),
      btnText: t('card_3_btn', lang),
      icon: Link2,
      color: 'blue',
      bgLight: 'bg-blue-50/80',
      borderHover: 'hover:border-blue-500/70',
      textHover: 'group-hover:text-blue-600',
      btnBg: 'bg-blue-50 group-hover:bg-blue-600 text-blue-700 group-hover:text-white',
      iconBox: 'bg-blue-50 border-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
    },
    {
      id: 'link_master' as const,
      num: '4',
      title: t('card_4_title', lang),
      badge: 'Masking',
      desc: t('card_4_desc', lang),
      btnText: t('card_4_btn', lang),
      icon: ShieldCheck,
      color: 'teal',
      bgLight: 'bg-teal-50/80',
      borderHover: 'hover:border-teal-500/70',
      textHover: 'group-hover:text-teal-700',
      btnBg: 'bg-teal-50 group-hover:bg-teal-600 text-teal-800 group-hover:text-white',
      iconBox: 'bg-teal-50 border-teal-100 text-teal-700 group-hover:bg-teal-600 group-hover:text-white',
    },
    {
      id: 'track_url' as const,
      num: '5',
      title: t('card_5_title', lang),
      badge: 'Analytics',
      desc: t('card_5_desc', lang),
      btnText: t('card_5_btn', lang),
      icon: Activity,
      color: 'amber',
      bgLight: 'bg-amber-50/80',
      borderHover: 'hover:border-amber-500/70',
      textHover: 'group-hover:text-amber-800',
      btnBg: 'bg-amber-50 group-hover:bg-amber-600 text-amber-900 group-hover:text-white',
      iconBox: 'bg-amber-50 border-amber-100 text-amber-700 group-hover:bg-amber-600 group-hover:text-white',
    },
    {
      id: 'verifier' as const,
      num: '6',
      title: t('card_6_title', lang),
      badge: 'Health Probe',
      desc: t('card_6_desc', lang),
      btnText: t('card_6_btn', lang),
      icon: CheckCircle2,
      color: 'rose',
      bgLight: 'bg-rose-50/80',
      borderHover: 'hover:border-rose-500/70',
      textHover: 'group-hover:text-rose-700',
      btnBg: 'bg-rose-50 group-hover:bg-rose-600 text-rose-800 group-hover:text-white',
      iconBox: 'bg-rose-50 border-rose-100 text-rose-700 group-hover:bg-rose-600 group-hover:text-white',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-3 sm:py-4">
      {/* Dashboard Top Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-800 text-[11px] font-bold shadow-2xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>{t('stream_connected', lang)}</span>
          </div>
          <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">
            {t('choose_action', lang)}
          </h1>
        </div>

        {/* Dashboard Top Controls: Account Info Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
          {/* Account Info Pill */}
          <div className="bg-white border border-slate-200/90 rounded-xl px-2.5 py-1 flex items-center gap-2 text-xs shadow-2xs">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                <Server className="w-3 h-3" />
              </div>
              <div className="text-[11px]">
                <span className="font-bold text-slate-800">{credentials.username}</span>
                {userInfo?.status && (
                  <span className="text-emerald-700 font-semibold ml-1">({userInfo.status})</span>
                )}
              </div>
            </div>
            {expDateFormatted && (
              <div className="text-[10px] text-slate-500 font-mono hidden md:block">
                Exp: <strong className="text-slate-700">{expDateFormatted}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PROMINENT DEDICATED LANGUAGE BAR (10 Regional Languages Available) */}
      <div className="mb-3 p-2.5 sm:p-3 bg-white border border-indigo-100/90 rounded-xl sm:rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
              <Globe className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-extrabold text-slate-900 tracking-wide">
                {t('select_lang', lang)}:
              </span>
              <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                10 Languages
              </span>
            </div>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Active: <strong className="text-indigo-600">{SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.nativeName}</strong>
          </span>
        </div>

        {/* 10 Language Interactive Buttons */}
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-1.5">
          {SUPPORTED_LANGUAGES.map((item) => {
            const isSelected = item.code === lang;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => onSelectLang && onSelectLang(item.code)}
                className={`py-1.5 px-1.5 rounded-lg text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-300 scale-[1.02]'
                    : 'bg-slate-50 hover:bg-indigo-50/70 text-slate-700 hover:text-indigo-700 border-slate-200/90 hover:border-indigo-200'
                }`}
                title={`${item.name} (${item.nativeName})`}
              >
                <span className="text-[11px] leading-tight font-extrabold truncate w-full text-center">{item.nativeName}</span>
                <span className={`text-[9px] font-mono leading-tight ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                  {item.shortCode}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6 UNIFIED DASHBOARD TOOLS (Responsive Grid: Fits 100% on every screen simultaneously) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
        {tools.map((item) => {
          const IconComp = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => onSelectAction(item.id)}
              className={`group bg-white hover:bg-slate-50/90 border border-slate-200/90 ${item.borderHover} rounded-xl sm:rounded-2xl p-2.5 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between active:scale-[0.98] select-none`}
            >
              <div>
                {/* Icon & Badge Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center transition-all shadow-2xs shrink-0 ${item.iconBox}`}
                  >
                    <IconComp className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono">
                    {item.badge}
                  </span>
                </div>

                {/* Title */}
                <h2
                  className={`text-xs sm:text-sm font-bold text-slate-900 mb-0.5 transition-colors line-clamp-1 ${item.textHover}`}
                  title={item.title}
                >
                  {item.title}
                </h2>

                {/* Subtitle / Desc */}
                <p className="text-[10px] sm:text-[11px] text-slate-500 leading-snug line-clamp-2">
                  {item.desc}
                </p>
              </div>

              {/* Action Button */}
              <button
                type="button"
                className={`w-full mt-2 py-1 px-1.5 font-bold rounded-lg text-[10px] sm:text-xs flex items-center justify-center gap-0.5 transition-colors shadow-2xs cursor-pointer ${item.btnBg}`}
              >
                <span className="truncate">{item.btnText}</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
