import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown, X } from 'lucide-react';
import { Language } from '../types';
import { SUPPORTED_LANGUAGES, t } from '../services/translations';

interface LanguageSelectorProps {
  currentLang: Language;
  onSelectLang: (lang: Language) => void;
  variant?: 'header' | 'button' | 'inline';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLang,
  onSelectLang,
  variant = 'header',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeOption =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code: Language) => {
    onSelectLang(code);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] sm:text-xs font-bold text-slate-700 hover:text-indigo-700 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-indigo-200 rounded-lg transition-all cursor-pointer whitespace-nowrap shadow-2xs shrink-0 active:scale-[0.98]"
        title={t('change_lang', currentLang)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
        <span className="font-extrabold text-indigo-900 tracking-wide">
          {activeOption.nativeName}
        </span>
        <span className="text-[10px] text-slate-400 font-mono hidden xs:inline">
          ({activeOption.shortCode})
        </span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-600' : ''
          }`}
        />
      </button>

      {/* Floating Language Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-60 sm:w-64 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2.5 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t('select_lang', currentLang)}</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto p-1.5 space-y-0.5 divide-y divide-slate-50">
            {SUPPORTED_LANGUAGES.map((item) => {
              const isSelected = item.code === currentLang;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleSelect(item.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/80 text-indigo-700 font-bold border border-indigo-100 shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-mono font-bold text-slate-600 shrink-0">
                      {item.shortCode}
                    </span>
                    <div className="flex flex-col truncate">
                      <span className="font-semibold text-slate-900 leading-tight">
                        {item.nativeName}
                      </span>
                      <span className="text-[10px] text-slate-500 leading-tight">
                        {item.name}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500 text-center font-medium">
            10 Languages Supported · 10 ਭਾਸ਼ਾਵਾਂ · 10টি ভাষা · ୧୦ଟି ଭାଷା · 10 மொழிகள்
          </div>
        </div>
      )}
    </div>
  );
};
