import React, { useState, useEffect } from 'react';
import {
  Server,
  User,
  Lock,
  Eye,
  EyeOff,
  PlayCircle,
  Sparkles,
  HelpCircle,
  AlertCircle,
  Network,
  Trash2,
  Globe,
  Download,
  CheckCircle2,
  ListVideo,
  Copy,
  Check,
  Tv,
  Link2,
  ShieldCheck,
} from 'lucide-react';
import { StreamCredentials, Language, StreamChannel, Category } from '../types';
import { authenticateMacPortal, downloadM3uFile, MacAuthResponse } from '../services/macPortalService';
import { BrandLogoIcon } from './BrandLogo';
import { RangeUrlGenerator } from './RangeUrlGenerator';
import { LinkMasterModal } from './LinkMasterModal';
import { SUPPORTED_LANGUAGES, t } from '../services/translations';

interface LoginFormProps {
  onLogin: (creds: StreamCredentials) => void;
  isLoading: boolean;
  error: string | null;
  onClearError: () => void;
  lang: Language;
  onSelectLang?: (lang: Language) => void;
  onOpenMacModal: () => void;
  loadedUrl?: string | null;
  onDeleteLoadedUrl?: () => void;
  onMacLogin?: (macResult: {
    macAddress: string;
    portalUrl: string;
    channels: StreamChannel[];
    categories: Category[];
  }) => void;
  onPlayChannel?: (channel: StreamChannel) => void;
  onLoadChannelsToApp?: (channels: StreamChannel[], categories?: Category[]) => void;
}

const RECENT_STORAGE_KEY = 'streamhub_recent_connections';

interface RecentConnection {
  serverUrl: string;
  username: string;
  lastUsed: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLogin,
  isLoading,
  error,
  onClearError,
  lang,
  onSelectLang,
  onOpenMacModal,
  loadedUrl,
  onDeleteLoadedUrl,
  onMacLogin,
  onPlayChannel,
  onLoadChannelsToApp,
}) => {
  const isHindi = lang === 'hi';

  // Mode: 'xtream' (Xtream Codes API), 'mac' (MAC URL / Stalker Portal), 'range' (Range URL Generator), or 'linkmaster' (Link Master)
  const [activeTab, setActiveTab] = useState<'xtream' | 'mac' | 'range' | 'linkmaster'>('xtream');

  // Xtream Codes API form state
  const [serverUrl, setServerUrl] = useState(loadedUrl || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [recents, setRecents] = useState<RecentConnection[]>([]);

  // MAC URL / Stalker Portal form state
  const [macAddress, setMacAddress] = useState('00:1A:79:B4:C2:8A');
  const [portalUrl, setPortalUrl] = useState('http://portal.mag-stalker.tv:8080');
  const [isMacLoading, setIsMacLoading] = useState(false);
  const [macError, setMacError] = useState<string | null>(null);
  const [macResult, setMacResult] = useState<MacAuthResponse | null>(null);
  const [copiedM3u, setCopiedM3u] = useState(false);

  useEffect(() => {
    if (loadedUrl) {
      setServerUrl(loadedUrl);
    }
  }, [loadedUrl]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_STORAGE_KEY);
      if (saved) {
        setRecents(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const deleteRecentUrl = (urlToDelete: string) => {
    const updated = recents.filter((r) => r.serverUrl !== urlToDelete);
    setRecents(updated);
    try {
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    if (serverUrl === urlToDelete) {
      setServerUrl('');
      setUsername('');
      setPassword('');
    }
    if (onDeleteLoadedUrl) {
      onDeleteLoadedUrl();
    }
  };

  const handleXtreamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverUrl.trim() || !username.trim() || !password.trim()) {
      return;
    }
    onClearError();

    // Save to recents (without storing raw password)
    try {
      const updated = [
        { serverUrl: serverUrl.trim(), username: username.trim(), lastUsed: new Date().toLocaleDateString() },
        ...recents.filter((r) => r.serverUrl !== serverUrl.trim() || r.username !== username.trim()),
      ].slice(0, 3);
      setRecents(updated);
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    onLogin({
      serverUrl: serverUrl.trim(),
      username: username.trim(),
      password: password.trim(),
    });
  };

  const handleUseDemo = () => {
    onClearError();
    setServerUrl('https://demo.streamhub.tv:8080');
    setUsername('demo');
    setPassword('demo1234');
    onLogin({
      serverUrl: 'https://demo.streamhub.tv:8080',
      username: 'demo',
      password: 'demo1234',
      isDemo: true,
    });
  };

  // Format MAC address input automatically (adds colon after every 2 characters)
  const handleMacChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.toUpperCase().replace(/[^0-9A-F]/g, '');
    if (raw.length > 12) raw = raw.slice(0, 12);
    const parts = raw.match(/.{1,2}/g) || [];
    setMacAddress(parts.join(':'));
  };

  const handleUseDemoMac = () => {
    setMacAddress('00:1A:79:B4:C2:8A');
    setPortalUrl('http://portal.mag-stalker.tv:8080');
    setMacError(null);
  };

  // Handle MAC Portal Authentication & Channel Fetch
  const handleMacSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!macAddress.trim() || !portalUrl.trim()) {
      setMacError(
        isHindi
          ? 'कृपया मैक एड्रेस और पोर्टल यूआरएल दोनों दर्ज करें।'
          : 'Please enter both MAC Address and Portal URL.'
      );
      return;
    }

    setIsMacLoading(true);
    setMacError(null);
    setMacResult(null);

    try {
      const result = await authenticateMacPortal(macAddress, portalUrl);
      setMacResult(result);
      // Automatic download disabled: user must click manual download button below
    } catch (err: any) {
      setMacError(err.message || 'MAC Portal authentication failed.');
    } finally {
      setIsMacLoading(false);
    }
  };

  const handleDownloadM3u = () => {
    if (!macResult?.m3uContent) return;
    downloadM3uFile(macResult.m3uContent, macResult.downloadFilename || `playlist_${macResult.macAddress.replace(/:/g, '')}.m3u`);
  };

  const handleCopyM3u = () => {
    if (!macResult?.m3uContent) return;
    navigator.clipboard.writeText(macResult.m3uContent);
    setCopiedM3u(true);
    setTimeout(() => setCopiedM3u(false), 2000);
  };

  const handleOpenInDashboard = () => {
    if (!macResult || !onMacLogin) return;
    onMacLogin({
      macAddress: macResult.macAddress,
      portalUrl: macResult.portalUrl,
      channels: macResult.channels,
      categories: macResult.categories,
    });
  };

  const handleResetMacUrl = () => {
    setMacResult(null);
    setPortalUrl('');
    setMacAddress('');
    setMacError(null);
    setCopiedM3u(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      {/* Title & Introduction with Logo */}
      <div className="flex flex-col items-center justify-center text-center mb-6">
        <div className="inline-flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl shadow-sm mb-3">
          <BrandLogoIcon size={40} />
          <div className="text-left">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Yaaro Ka Yaar Stream
            </h1>
            <p className="text-[10px] font-bold tracking-wider text-rose-600 uppercase">
              IPTV & M3U Manager
            </p>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
          {isHindi
            ? 'Xtream Codes API या Stalker/MAG पोर्टल के MAC एड्रेस व पोर्टल यूआरएल से कनेक्ट करें, पूरी चैनल लिस्ट फेच करें और M3U प्लेलिस्ट डाउनलोड करें।'
            : 'Connect via Xtream Codes API or enter your MAG / Stalker MAC address and Portal URL to authenticate, fetch channels, and download your M3U playlist.'}
        </p>
      </div>

      {/* Main Form Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.06)]">
        {/* Quick Language Switcher for 10 Regional Languages */}
        {onSelectLang && (
          <div className="mb-5 p-2 sm:p-2.5 bg-slate-50/90 border border-slate-200/80 rounded-xl">
            <div className="flex items-center justify-between text-[11px] mb-1.5 px-1 font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>{t('select_lang', lang)} (10 Languages):</span>
              </span>
              <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                {SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.nativeName}
              </span>
            </div>
            <div className="grid grid-cols-2 xs:grid-cols-5 sm:grid-cols-10 gap-1">
              {SUPPORTED_LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => onSelectLang(l.code)}
                  className={`py-1 px-1 rounded-md text-[10px] font-bold text-center transition-all cursor-pointer truncate ${
                    l.code === lang
                      ? 'bg-indigo-600 text-white shadow-2xs font-extrabold ring-1 ring-indigo-400'
                      : 'bg-white hover:bg-indigo-50/60 text-slate-700 hover:text-indigo-700 border border-slate-200/80'
                  }`}
                  title={`${l.name} (${l.nativeName})`}
                >
                  {l.nativeName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Protocol Selector Tabs: Xtream Codes API vs MAC URL / Stalker Portal */}
        <div className="flex items-center p-1 bg-slate-100 border border-slate-200/80 rounded-xl mb-6 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('xtream')}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'xtream'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-4 h-4 text-indigo-600" />
            <span>{isHindi ? 'Xtream Codes API' : 'Xtream Codes API'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mac')}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'mac'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Network className="w-4 h-4 text-indigo-600" />
            <span className="flex items-center gap-1.5">
              <span>{isHindi ? 'मैक (MAC)' : 'MAC URL'}</span>
              <span className="text-[10px] bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded font-mono text-indigo-700 font-bold">
                Stalker
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('range')}
            className={`flex-1 py-2.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'range'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Link2 className="w-3.5 h-3.5 text-indigo-600" />
            <span className="flex items-center gap-1">
              <span>{isHindi ? 'रेंज URL' : 'Range URL'}</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('linkmaster')}
            className={`flex-1 py-2.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'linkmaster'
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="flex items-center gap-1">
              <span>Link Master</span>
              <span className="text-[10px] bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded font-mono text-emerald-800 font-bold">
                Alias
              </span>
            </span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* SECTION 1: MAC URL / STALKER PORTAL INPUTS & SUBMIT     */}
        {/* ======================================================== */}
        {activeTab === 'mac' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Quick Demo Preset Trigger */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs">
              <div className="flex items-center gap-2 text-indigo-950 font-medium">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  {isHindi
                    ? 'त्वरित परीक्षण के लिए सैंपल MAC व पोर्टल भरें'
                    : 'Test instantly with sample MAG portal credentials'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleUseDemoMac}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-bold text-[11px] shadow-2xs transition-colors cursor-pointer"
                >
                  {isHindi ? 'सैंपल डेटा भरें' : 'Fill Sample'}
                </button>
                {(portalUrl || macAddress || macResult) && (
                  <button
                    type="button"
                    onClick={handleResetMacUrl}
                    className="px-2 py-1 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-md font-bold text-[11px] shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                    title={isHindi ? 'मैक यूआरएल रीसेट करें' : 'Reset MAC URL'}
                  >
                    <Trash2 className="w-3 h-3 text-rose-600" />
                    <span>{isHindi ? 'रीसेट' : 'Reset'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Error Alert */}
            {macError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-start gap-3 shadow-2xs">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="font-semibold whitespace-pre-line text-rose-900">{macError}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleUseDemoMac}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-bold cursor-pointer shadow-2xs transition-colors"
                    >
                      {isHindi ? 'डेमो प्रीसेट आज़माएँ' : 'Try Demo Preset'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleMacSubmit} className="space-y-4">
              {/* Field 1: Portal URL (e.g., http://example.com:8080/c/) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  {isHindi ? '1. पोर्टल यूआरएल (Portal URL)' : '1. Portal URL'}
                  <span className="text-rose-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Globe className="w-4 h-4 text-indigo-600" />
                  </div>
                  <input
                    type="text"
                    value={portalUrl}
                    onChange={(e) => setPortalUrl(e.target.value)}
                    placeholder="http://example.com:8080/c/"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500 font-mono">
                  {isHindi
                    ? 'उदा: http://example.com:8080/c/ या http://portal.mag-stalker.tv:8080'
                    : 'E.g., http://example.com:8080/c/ or http://portal.mag-stalker.tv:8080'}
                </p>
              </div>

              {/* Field 2: MAC Address (e.g., 00:1A:79:XX:XX:XX) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  {isHindi ? '2. मैक एड्रेस (MAC Address)' : '2. MAC Address'}
                  <span className="text-rose-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Network className="w-4 h-4 text-indigo-600" />
                  </div>
                  <input
                    type="text"
                    value={macAddress}
                    onChange={handleMacChange}
                    placeholder="00:1A:79:XX:XX:XX"
                    required
                    maxLength={17}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-sm font-mono tracking-wider focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500 font-mono">
                  {isHindi
                    ? 'मानक 12-अक्षरीय MAC एड्रेस (उदा: 00:1A:79:B4:C2:8A)'
                    : 'Standard 12-hex MAC address (e.g., 00:1A:79:B4:C2:8A)'}
                </p>
              </div>

              {/* Action Button: 'Generate M3U Playlist' */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isMacLoading}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  {isMacLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>
                        {isHindi
                          ? 'सर्वर से ऑथेंटिकेट और M3U प्लेलिस्ट जनरेट हो रही है...'
                          : 'Authenticating with Stalker Portal & Generating M3U...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Generate M3U Playlist</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Authenticated Result & M3U Playlist Download Function */}
            {macResult && (
              <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/90 shadow-xs space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between gap-2 border-b border-emerald-200/60 pb-3">
                  <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {isHindi
                        ? 'आईपीटीवी सर्वर से सफलतापूर्वक ऑथेंटिकेट हुआ!'
                        : 'Authenticated Successfully with IPTV Server!'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-white text-emerald-800 font-mono font-bold border border-emerald-200 shadow-2xs">
                      {macResult.authMethod}
                    </span>
                    <button
                      type="button"
                      onClick={handleResetMacUrl}
                      className="text-[11px] px-2.5 py-1 rounded-md bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-200 font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      title={isHindi ? 'मैक यूआरएल और जेनरेटेड प्लेलिस्ट को डिलीट / रीसेट करें' : 'Delete and reset MAC URL'}
                    >
                      <Trash2 className="w-3 h-3 text-rose-600" />
                      <span>{isHindi ? 'डिलीट' : 'Delete'}</span>
                    </button>
                  </div>
                </div>

                {/* Stats Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-slate-500 block text-[11px] font-semibold">
                      {isHindi ? 'कुल चैनल' : 'Total Channels'}
                    </span>
                    <strong className="text-emerald-700 text-lg font-bold font-mono">
                      {macResult.totalChannels}
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-slate-500 block text-[11px] font-semibold">
                      {isHindi ? 'कुल श्रेणियाँ / ग्रुप' : 'Categories / Groups'}
                    </span>
                    <strong className="text-slate-900 text-lg font-bold font-mono">
                      {macResult.totalCategories}
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
                    <span className="text-slate-500 block text-[11px] font-semibold">MAC</span>
                    <strong className="text-indigo-700 font-mono text-xs truncate block font-bold">
                      {macResult.macAddress}
                    </strong>
                  </div>
                </div>

                {/* Channels Preview */}
                {macResult.channels.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                      {isHindi ? 'फेच किए गए चैनल (नमूना):' : 'Fetched Channels Preview:'}
                    </label>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
                      {macResult.channels.slice(0, 5).map((ch, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-mono text-slate-400 w-5 font-semibold">
                              {idx + 1}.
                            </span>
                            <span className="font-semibold text-slate-800 truncate">
                              {ch.name}
                            </span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 shrink-0 font-bold border border-indigo-100">
                            {ch.category_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notification Banner for Manual Download */}
                <div className="p-3 bg-emerald-100/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium">
                      {isHindi
                        ? 'प्लेलिस्ट तैयार है! फ़ाइल को सेव करने के लिए नीचे दिए गए डाउनलोड बटन पर क्लिक करें।'
                        : 'Playlist is ready! Click the manual download button below to save your M3U file.'}
                    </span>
                  </div>
                </div>

                {/* Primary Download M3U Function & In-App View */}
                <div className="pt-1 flex flex-col sm:flex-row items-stretch gap-2">
                  {/* Manual Download M3U Playlist Button */}
                  <button
                    type="button"
                    onClick={handleDownloadM3u}
                    className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-lg flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer active:scale-[0.99]"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isHindi ? 'M3U प्लेलिस्ट फ़ाइल डाउनलोड करें (.m3u)' : 'Download M3U Playlist (.m3u)'}</span>
                  </button>

                  {/* Open & Play inside Dashboard */}
                  {onMacLogin && (
                    <button
                      type="button"
                      onClick={handleOpenInDashboard}
                      className="py-2.5 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-indigo-600/20"
                      title={isHindi ? 'चैनलों को सीधे ऐप में देखें व चलाएं' : 'Watch & Explore Channels inside app'}
                    >
                      <Tv className="w-4 h-4" />
                      <span>{isHindi ? 'डैशबोर्ड में चैनल चलाएं' : 'Open in App'}</span>
                    </button>
                  )}

                  {/* Copy M3U content */}
                  <button
                    type="button"
                    onClick={handleCopyM3u}
                    className="py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    title="Copy M3U file text"
                  >
                    {copiedM3u ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                    <span>{isHindi ? 'कॉपी' : 'Copy'}</span>
                  </button>

                  {/* Delete / Reset M3U Playlist Button */}
                  <button
                    type="button"
                    onClick={handleResetMacUrl}
                    className="py-2.5 px-3 bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    title={isHindi ? 'मैक यूआरएल रीसेट करें और जेनरेटेड प्लेलिस्ट हटाएं' : 'Reset MAC URL & delete generated playlist'}
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>{isHindi ? 'डिलीट' : 'Delete'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 2: XTREAM CODES API (Standard Login)             */}
        {/* ======================================================== */}
        {activeTab === 'xtream' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm flex items-start gap-3 shadow-2xs">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{error}</p>
                  <button
                    type="button"
                    onClick={handleUseDemo}
                    className="mt-2 text-xs font-bold text-rose-700 underline hover:text-rose-900 cursor-pointer"
                  >
                    {isHindi ? '👉 इसके बजाय 1-क्लिक डेमो चैनल चलाएं' : '👉 Or test with 1-click Demo Channels instead'}
                  </button>
                </div>
              </div>
            )}

            {/* Desktop 'Loaded URL' Section */}
            {(loadedUrl || recents.length > 0) && (
              <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Loaded URL
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">
                    {isHindi ? 'लोड किया गया यूआरएल' : 'Saved stream server'}
                  </span>
                </div>

                <div className="space-y-2">
                  {(loadedUrl
                    ? [{ serverUrl: loadedUrl, username: '', lastUsed: 'Active' }, ...recents.filter((r) => r.serverUrl !== loadedUrl)]
                    : recents
                  )
                    .slice(0, 3)
                    .map((r, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs"
                      >
                        <div
                          onClick={() => {
                            setServerUrl(r.serverUrl);
                            if (r.username) setUsername(r.username);
                          }}
                          className="min-w-0 flex-1 cursor-pointer group"
                          title={isHindi ? 'इस यूआरएल को भरें' : 'Fill this URL into form'}
                        >
                          <p className="font-mono text-indigo-700 font-semibold group-hover:text-indigo-900 truncate">
                            {r.serverUrl}
                          </p>
                          {r.username && (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              User: {r.username}
                            </p>
                          )}
                        </div>

                        {/* Delete option right next to Loaded URL */}
                        <button
                          type="button"
                          onClick={() => deleteRecentUrl(r.serverUrl)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-200 rounded-md transition-colors cursor-pointer text-xs shrink-0 font-bold shadow-2xs"
                          title={isHindi ? 'इस लोड किए गए URL को हटाएं' : 'Delete this loaded URL'}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Delete</span>
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <form onSubmit={handleXtreamSubmit} className="space-y-4">
              {/* Stream API URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  {isHindi ? 'स्ट्रीम एपीआई यूआरएल (Stream API URL)' : 'Stream API URL'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Server className="w-4 h-4 text-indigo-600" />
                  </div>
                  <input
                    type="text"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    placeholder="http://server-domain.com:8080"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {isHindi ? 'उदाहरण: http://iptv-server.com:8080 या https://myiptv.net' : 'E.g., http://iptv-server.com:8080 or https://myiptv.net'}
                </p>
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  {isHindi ? 'यूजरनेम (Username)' : 'Username'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4 text-indigo-600" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter Username"
                    required
                    autoComplete="username"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  {isHindi ? 'पासवर्ड (Password)' : 'Password'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4 text-indigo-600" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Password"
                    required
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{isHindi ? 'कनेक्ट हो रहा है...' : 'Connecting to Server...'}</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-5 h-5" />
                      <span>{isHindi ? 'लॉगिन करें और विकल्प चुनें' : 'Connect & Choose Options'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Demo Fast Preset */}
            <div className="mt-6 pt-6 border-t border-slate-200 text-center">
              <p className="text-xs text-slate-500 mb-3">
                {isHindi
                  ? 'यदि आपके पास अभी कोई एक्टिव IPTV क्रेडेंशियल नहीं है, तो तुरंत परीक्षण करने के लिए डेमो चैनलों का उपयोग करें:'
                  : 'Don’t have active IPTV credentials right now? Try verified working demo live channels instantly:'}
              </p>
              <button
                type="button"
                onClick={handleUseDemo}
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-indigo-700 hover:text-indigo-800 border border-slate-200 hover:border-indigo-200 font-bold rounded-lg text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>{isHindi ? '1-क्लिक डेमो चैनल आज़माएँ (लाइव टीवी + डाउनलोड)' : '1-Click Try Demo Channels (Live TV + Download)'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 3: RANGE URL & M3U PLAYLIST GENERATOR            */}
        {/* ======================================================== */}
        {activeTab === 'range' && (
          <div className="animate-in fade-in duration-200">
            <RangeUrlGenerator
              lang={lang}
              onPlayChannel={onPlayChannel}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 4: LINK MASTER (M3U Encrypted Stream Aliases)    */}
        {/* ======================================================== */}
        {activeTab === 'linkmaster' && (
          <div className="animate-in fade-in duration-200">
            <LinkMasterModal
              isStandalonePage={true}
              lang={lang}
              onPlayChannel={onPlayChannel}
              onLoadToApp={onLoadChannelsToApp}
            />
          </div>
        )}
      </div>

      {/* Help & Information Toggle */}
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
          <span>{isHindi ? 'Xtream Codes और MAC Stalker पोर्टल में क्या अंतर है?' : 'What is Xtream Codes & MAC Stalker Portal?'}</span>
        </button>

        {showHelp && (
          <div className="mt-3 p-4 bg-white border border-slate-200 rounded-xl text-left text-xs text-slate-600 leading-relaxed space-y-2 shadow-sm">
            <p className="font-bold text-indigo-700">
              {isHindi ? 'IPTV क्रेडेंशियल प्रोटोकॉल गाइड:' : 'IPTV Protocols Guide:'}
            </p>
            <p>
              {isHindi
                ? '1. Xtream Codes API: सर्वर URL, यूजरनेम और पासवर्ड से जुड़ता है। 2. MAC URL / Stalker Portal: केवल आपके डिवाइस के MAC एड्रेस (00:1A:79:XX:XX:XX) और पोर्टल URL से सर्वर पर हैंडशेक करके पूरी चैनल लिस्ट व स्ट्रीम URL प्राप्त करता है।'
                : '1. Xtream Codes API connects using Server URL, Username, and Password. 2. MAC URL / Stalker Portal handshakes directly using your hardware MAC address (00:1A:79:XX:XX:XX) and Portal URL to fetch all live stream channels.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
