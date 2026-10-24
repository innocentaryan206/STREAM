import React, { useState } from 'react';
import {
  Tv,
  Globe,
  LogOut,
  Download,
  ListVideo,
  Network,
  LayoutDashboard,
  Link2,
  ShieldCheck,
  FolderDown,
  Activity,
  CheckCircle2,
  Volume2,
  VolumeX,
  MessageSquare,
  Menu,
  X as MenuClose,
  LogIn,
  UserPlus,
  KeyRound,
  User as UserIcon,
} from 'lucide-react';
import { StreamCredentials, UserInfo, ViewMode, Language } from '../types';
import { BrandLogoIcon } from './BrandLogo';
import { t } from '../services/translations';
import { LanguageSelector } from './LanguageSelector';
import { soundService } from '../services/soundService';

interface HeaderProps {
  credentials: StreamCredentials | null;
  userInfo: UserInfo | null;
  viewMode: ViewMode;
  onNavigate: (mode: ViewMode) => void;
  onLogout: () => void;
  lang: Language;
  onToggleLang?: () => void;
  onSelectLang?: (lang: Language) => void;
  onOpenMacModal: () => void;
  onOpenRangeModal: () => void;
  onOpenLinkMaster: () => void;
  onOpenImportModal: () => void;
  onOpenTrackUrl: () => void;
  onOpenVerifier: () => void;
  onOpenFeedback?: () => void;
  authUser?: any;
  onOpenAuth?: (mode?: 'login' | 'signup' | 'forgot') => void;
  onSignOutAuth?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  credentials,
  userInfo,
  viewMode,
  onNavigate,
  onLogout,
  lang,
  onToggleLang,
  onSelectLang,
  onOpenMacModal,
  onOpenRangeModal,
  onOpenLinkMaster,
  onOpenImportModal,
  onOpenTrackUrl,
  onOpenVerifier,
  onOpenFeedback,
  authUser,
  onOpenAuth,
  onSignOutAuth,
}) => {
  const [soundOn, setSoundOn] = useState(() => soundService.isEnabled());
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleToggleSound = () => {
    const newState = soundService.toggleSound();
    setSoundOn(newState);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 h-14 sm:h-15 flex items-center justify-between gap-2 sm:gap-3">
        {/* Zone 1: Wordmark Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <button 
            onClick={() => onNavigate('choice')}
            className="flex items-center gap-2 text-left group cursor-pointer focus:outline-none"
          >
            <BrandLogoIcon size={28} className="group-hover:scale-105 transition-transform shrink-0" />
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 group-hover:text-rose-600 transition-colors whitespace-nowrap">
                Yaaro Ka Yaar Stream
              </span>
              <span className="text-[9px] font-bold text-rose-600 tracking-wider uppercase -mt-0.5 hidden sm:block">
                IPTV Hub
              </span>
            </div>
          </button>

          {/* Navigation with Dashboard (Always visible on all screens) */}
          <nav className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-slate-600 border-l border-slate-200 pl-1.5 sm:pl-2.5 shrink-0">
            {/* Standalone Dashboard Button: Clicking reveals all options in the center of the screen */}
            <button
              onClick={() => onNavigate('choice')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                viewMode === 'choice'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100/90 hover:bg-slate-200/80 text-slate-800 hover:text-indigo-700 font-bold border border-slate-200/90'
              }`}
              title="Dashboard — View all tools in center of screen"
            >
              <LayoutDashboard className={`w-3.5 h-3.5 shrink-0 ${viewMode === 'choice' ? 'text-white' : 'text-indigo-600'}`} />
              <span className="text-[11px] sm:text-xs font-bold">{t('dashboard', lang)}</span>
            </button>

            {/* Channels & Download (Visible when credentials exist) */}
            {credentials && (
              <>
                <button
                  onClick={() => onNavigate('channels')}
                  className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
                    viewMode === 'channels'
                      ? 'bg-emerald-50 text-emerald-700 font-bold shadow-2xs border border-emerald-100'
                      : 'hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  title={t('channels', lang)}
                >
                  <ListVideo className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  <span className="hidden sm:inline">{t('channels', lang)}</span>
                </button>
                <button
                  onClick={() => onNavigate('download')}
                  className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
                    viewMode === 'download'
                      ? 'bg-blue-50 text-blue-700 font-bold shadow-2xs border border-blue-100'
                      : 'hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  title={t('download', lang)}
                >
                  <Download className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                  <span className="hidden sm:inline">{t('download', lang)}</span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Zone 2: Right Actions (Verify M3U, Track URL, Import Playlist, Link Master, Range URL, MAC URL, Language, User Info, Logout) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 overflow-x-auto no-scrollbar py-0.5">
          {/* Verify M3U Button */}
          <button
            onClick={onOpenVerifier}
            className="flex items-center gap-1 px-2 py-1 text-[11px] sm:text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-[0.98]"
            title={t('verify', lang)}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
            <span className="hidden xl:inline">{t('verify', lang)}</span>
          </button>

          {/* Track URL Button */}
          <button
            onClick={onOpenTrackUrl}
            className="flex items-center gap-1 px-2 py-1 text-[11px] sm:text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-[0.98]"
            title={t('track_url', lang)}
          >
            <Activity className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
            <span className="hidden xl:inline">Track URL</span>
          </button>

          {/* Import Playlist Button */}
          <button
            onClick={onOpenImportModal}
            className="flex items-center gap-1 px-2 py-1 text-[11px] sm:text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-[0.98]"
            title={t('import_btn', lang)}
          >
            <FolderDown className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xl:inline">{t('import_btn', lang)}</span>
          </button>

          {/* Link Master Button */}
          <button
            onClick={onOpenLinkMaster}
            className="flex items-center gap-1 px-2 py-1 text-[11px] sm:text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-[0.98]"
            title="Link Master — Encrypted M3U Stream Alias Masking"
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xl:inline">Link Master</span>
          </button>

          {/* Range URL Generator Button */}
          <button
            onClick={onOpenRangeModal}
            className="flex items-center gap-1 px-2 py-1 text-[11px] sm:text-xs font-bold text-slate-800 hover:text-indigo-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-lg shadow-2xs transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-[0.98]"
            title={t('range_url', lang)}
          >
            <Link2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="hidden xl:inline">{t('range_url', lang)}</span>
          </button>

          {/* MAC URL Button */}
          <button
            onClick={onOpenMacModal}
            className="flex items-center gap-1 px-2 py-1 text-[11px] sm:text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-[0.98]"
            title="MAC URL / Stalker Portal Generator"
          >
            <Network className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xl:inline">MAC</span>
          </button>

          {/* Sound Effect Toggle Button */}
          <button
            onClick={handleToggleSound}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] sm:text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-[0.98] ${
              soundOn
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/90'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200'
            }`}
            title={soundOn ? 'Click Sound Enabled (Tap to Mute)' : 'Click Sound Muted (Tap to Enable)'}
          >
            {soundOn ? (
              <Volume2 className="w-3.5 h-3.5 text-amber-600 shrink-0 animate-pulse" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            <span className="hidden xl:inline">{soundOn ? 'Sound' : 'Mute'}</span>
          </button>

          {/* Feedback Trigger Button */}
          {onOpenFeedback && (
            <button
              onClick={onOpenFeedback}
              className="flex items-center gap-1 px-2 py-1 text-[11px] sm:text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/90 rounded-lg shadow-2xs transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-[0.98]"
              title="Share App Feedback & 5-Star Rating"
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="hidden lg:inline">Feedback</span>
            </button>
          )}

          {credentials && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={onLogout}
                className="flex items-center gap-1 px-2 py-1 text-[11px] sm:text-xs font-semibold text-slate-600 hover:text-rose-700 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-2xs shrink-0"
                title={t('logout', lang)}
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="hidden md:inline">{t('logout', lang)}</span>
              </button>
            </div>
          )}

          {/* Language Selector positioned in the Far Right Corner */}
          {onSelectLang && (
            <div className="pl-1 sm:pl-2 border-l border-slate-200/90 shrink-0">
              <LanguageSelector currentLang={lang} onSelectLang={onSelectLang} />
            </div>
          )}

          {/* Responsive Hamburger Menu Button */}
          <div className="pl-1 shrink-0">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-95 ${
                isMenuOpen
                  ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-2xs'
                  : 'bg-slate-100/90 hover:bg-slate-200/70 border-slate-200/90 text-slate-700 hover:text-indigo-600 shadow-2xs'
              }`}
              title="Menu — Sign In, Sign Up, Account"
              aria-label="Toggle Hamburger Menu"
            >
              {isMenuOpen ? (
                <MenuClose className="w-4 h-4 text-rose-600" />
              ) : (
                <Menu className="w-4 h-4 text-slate-800" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Responsive Hamburger Dropdown Menu */}
      {isMenuOpen && (
        <div className="border-b border-slate-200/90 bg-white/98 backdrop-blur-md shadow-xl animate-in slide-in-from-top-2 duration-150">
          <div className="max-w-7xl mx-auto px-3 sm:px-5 py-3.5 space-y-3">
            {/* User Account / Auth Section */}
            <div className="p-3 bg-slate-50/90 border border-slate-200/90 rounded-2xl shadow-2xs">
              {authUser ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-r from-rose-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                      {authUser.displayName
                        ? authUser.displayName[0].toUpperCase()
                        : authUser.email
                        ? authUser.email[0].toUpperCase()
                        : 'U'}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {authUser.displayName || 'Signed In Member'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono truncate">
                        {authUser.email}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (onSignOutAuth) onSignOutAuth();
                    }}
                    className="py-1.5 px-3 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Account Portal</span>
                    </div>
                    <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                      Secure Access
                    </span>
                  </div>

                  {/* Sign in with Google Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (onOpenAuth) onOpenAuth('login');
                    }}
                    className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign in with Google</span>
                  </button>

                  {/* Login and Sign Up Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        if (onOpenAuth) onOpenAuth('login');
                      }}
                      className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Login</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        if (onOpenAuth) onOpenAuth('signup');
                      }}
                      className="py-2 px-3 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Sign Up</span>
                    </button>
                  </div>

                  {/* Forgot Password Link */}
                  <div className="text-center pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        if (onOpenAuth) onOpenAuth('forgot');
                      }}
                      className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 underline cursor-pointer inline-flex items-center gap-1"
                    >
                      <KeyRound className="w-3 h-3 text-slate-400" />
                      <span>Forgot Password?</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Navigation Links */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onNavigate('choice');
                }}
                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenVerifier();
                }}
                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verify M3U</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenTrackUrl();
                }}
                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Activity className="w-4 h-4 text-amber-500" />
                <span>Track URL</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  if (onOpenFeedback) onOpenFeedback();
                }}
                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-rose-500" />
                <span>Feedback</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
