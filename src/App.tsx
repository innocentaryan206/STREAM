/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StreamCredentials, UserInfo, ServerInfo, Category, StreamChannel, ViewMode, Language } from './types';
import { authenticateStreamApi } from './services/api';
import { loadOrFetchCatalog, setCachedCatalog, CatalogResult } from './services/catalogManager';
import { Header } from './components/Header';
import { LoginForm } from './components/LoginForm';
import { ActionChoice } from './components/ActionChoice';
import { DownloadSection } from './components/DownloadSection';
import { ChannelList } from './components/ChannelList';
import { FullScreenPlayer } from './components/FullScreenPlayer';
import { MacPortalModal } from './components/MacPortalModal';
import { LoadedUrlSection } from './components/LoadedUrlSection';
import { BrandLogoIcon } from './components/BrandLogo';
import { RangeUrlGenerator } from './components/RangeUrlGenerator';
import { LinkMasterModal } from './components/LinkMasterModal';
import { ImportPlaylistModal } from './components/ImportPlaylistModal';
import { TrackUrlModal } from './components/TrackUrlModal';
import { PlaylistVerifierModal } from './components/PlaylistVerifierModal';
import { StarfieldBackground } from './components/StarfieldBackground';
import { ClickSparkleManager } from './components/ClickSparkleManager';
import { FooterBranding } from './components/FooterBranding';
import { FeedbackModal } from './components/FeedbackModal';
import { AuthModal, AuthMode } from './components/AuthModal';
import { subscribeToAuth, logoutUser } from './services/firebaseAuth';
import { MessageSquare } from 'lucide-react';
import { t } from './services/translations';

const STORAGE_CREDS_KEY = 'streamhub_active_credentials';
const STORAGE_LANG_KEY = 'streamhub_active_language';

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LANG_KEY);
      if (saved && ['en', 'hi', 'pa', 'bn', 'or', 'ta', 'te', 'ml', 'gu', 'kn'].includes(saved)) {
        return saved as Language;
      }
    } catch {
      // ignore
    }
    return 'en';
  });

  const handleSelectLang = (newLang: Language) => {
    setLang(newLang);
    try {
      localStorage.setItem(STORAGE_LANG_KEY, newLang);
    } catch {
      // ignore
    }
  };
  const [credentials, setCredentials] = useState<StreamCredentials | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [channels, setChannels] = useState<StreamChannel[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [catalogStats, setCatalogStats] = useState<CatalogResult | null>(null);

  // Active playing channel (opens FullScreenPlayer when non-null)
  const [activeChannel, setActiveChannel] = useState<StreamChannel | null>(null);

  // MAC URL Portal Modal State
  const [isMacModalOpen, setIsMacModalOpen] = useState(false);

  // Range URL Generator Modal State
  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);

  // Link Master Modal State
  const [isLinkMasterModalOpen, setIsLinkMasterModalOpen] = useState(false);

  // Import Playlist Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Track URL Modal State
  const [isTrackUrlModalOpen, setIsTrackUrlModalOpen] = useState(false);

  // Playlist Verifier Modal State
  const [isVerifierModalOpen, setIsVerifierModalOpen] = useState(false);

  // User Feedback Modal State
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Firebase Authentication State
  const [authUser, setAuthUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>('login');

  // Remember last loaded URL for the Loaded URL section
  const [lastLoadedUrl, setLastLoadedUrl] = useState<string | null>(null);

  // Subscribe to Firebase Auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setAuthUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Restore credentials on initial load if available
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_CREDS_KEY);
      if (saved) {
        const parsed: StreamCredentials = JSON.parse(saved);
        handleLogin(parsed, true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleLogin = async (creds: StreamCredentials, isSilent = false) => {
    if (!isSilent) setIsLoadingAuth(true);
    setAuthError(null);

    try {
      const authResult = await authenticateStreamApi(creds);
      const activeCreds = { ...creds, isDemo: authResult.isDemo };

      setCredentials(activeCreds);
      setUserInfo(authResult.user_info || null);
      setServerInfo(authResult.server_info || null);
      setLastLoadedUrl(activeCreds.serverUrl);
      setViewMode('choice');

      try {
        sessionStorage.setItem(STORAGE_CREDS_KEY, JSON.stringify(activeCreds));
      } catch {
        // ignore
      }
    } catch (err: any) {
      setAuthError(err.message || 'Connection failed. Please check your credentials.');
      setViewMode('login');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  /**
   * Handles direct login using authenticated MAC Portal results
   */
  const handleMacLogin = (macResult: {
    macAddress: string;
    portalUrl: string;
    channels: StreamChannel[];
    categories: Category[];
  }) => {
    const creds: StreamCredentials = {
      serverUrl: macResult.portalUrl,
      username: `MAC: ${macResult.macAddress}`,
      password: 'mac-portal',
      isDemo: false,
    };
    setCredentials(creds);
    setUserInfo({
      username: macResult.macAddress,
      status: 'Active (Stalker / MAG Portal)',
      max_connections: '1',
    });
    setServerInfo({
      url: macResult.portalUrl,
    });
    setChannels(macResult.channels);
    setCategories(macResult.categories);
    setLastLoadedUrl(macResult.portalUrl);
    setViewMode('choice');

    // Immediately cache the real MAC channels in IndexedDB to prevent loading fallback demo channels
    setCachedCatalog(creds, macResult.channels, macResult.categories).catch(() => {});

    try {
      sessionStorage.setItem(STORAGE_CREDS_KEY, JSON.stringify(creds));
    } catch {
      // ignore
    }
  };

  /**
   * Loads masked or imported channels directly into the app catalog and opens Channels view
   */
  const handleLoadChannelsToApp = (newChannels: StreamChannel[], newCategories?: Category[]) => {
    setChannels(newChannels);
    if (newCategories && newCategories.length > 0) {
      setCategories(newCategories);
    } else {
      const catMap = new Map<string, string>();
      newChannels.forEach((ch) => {
        catMap.set(ch.category_id || 'linkmaster', ch.category_name || 'Link Master Channels');
      });
      const cats: Category[] = Array.from(catMap.entries()).map(([id, name]) => ({
        category_id: id,
        category_name: name,
      }));
      setCategories(cats);
    }
    const creds: StreamCredentials = {
      serverUrl: 'Link Master Masked Playlist',
      username: 'LinkMaster Protected',
      password: 'encrypted-aliases',
      isDemo: false,
    };
    setCredentials(creds);
    setUserInfo({
      username: 'LinkMaster (Protected Aliases)',
      status: 'Active (Protected Stream Aliases)',
      max_connections: '5',
    });
    setLastLoadedUrl('Link Master Masked Playlist');
    setViewMode('channels');
  };

  /**
   * Triggers data fetching and Web Worker parsing ONLY when the user clicks 'View Channels'.
   * Uses IndexedDB local caching for instant 0ms loads, and offloads heavy parsing to Web Worker.
   */
  const handleOpenViewChannels = async (forceRefresh = false) => {
    setViewMode('channels');
    if (!credentials) return;

    // If channels are already in state and not forcing a refresh, display immediately
    if (channels.length > 0 && !forceRefresh) {
      return;
    }

    setIsLoadingChannels(true);
    try {
      const result = await loadOrFetchCatalog(credentials, forceRefresh);
      setChannels(result.channels);
      setCategories(result.categories);
      setCatalogStats(result);
    } catch (err) {
      console.warn('Error loading or parsing catalog:', err);
    } finally {
      setIsLoadingChannels(false);
    }
  };

  const handleLogout = () => {
    setCredentials(null);
    setUserInfo(null);
    setServerInfo(null);
    setCategories([]);
    setChannels([]);
    setCatalogStats(null);
    setActiveChannel(null);
    setViewMode('login');
    sessionStorage.removeItem(STORAGE_CREDS_KEY);
  };

  // Delete loaded URL and return to data entry interface
  const handleDeleteLoadedUrl = () => {
    setCredentials(null);
    setUserInfo(null);
    setServerInfo(null);
    setCategories([]);
    setChannels([]);
    setCatalogStats(null);
    setActiveChannel(null);
    setLastLoadedUrl(null);
    sessionStorage.removeItem(STORAGE_CREDS_KEY);
    setViewMode('login');
  };

  const handleSelectCategory = (catId: string) => {
    setSelectedCategoryId(catId);
  };

  const handleSelectChannel = (channel: StreamChannel) => {
    // Selecting any channel plays it in full screen as requested!
    setActiveChannel(channel);
  };

  return (
    <div className="relative min-h-screen bg-transparent text-slate-800 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Interactive Background Animation with Falling Stars and Cosmic Particles */}
      <StarfieldBackground />

      {/* Global Click Sparkle & Blast Animation with Melodic Sound Effects */}
      <ClickSparkleManager />

      {/* Top Bar with 'MAC URL' Icon, Navigation, and Language Switcher */}
      <Header
        credentials={credentials}
        userInfo={userInfo}
        viewMode={viewMode}
        onNavigate={(mode) => {
          if (mode === 'channels') {
            handleOpenViewChannels();
          } else if (mode === 'choice') {
            setIsMacModalOpen(false);
            setIsRangeModalOpen(false);
            setIsLinkMasterModalOpen(false);
            setIsImportModalOpen(false);
            setIsTrackUrlModalOpen(false);
            setIsVerifierModalOpen(false);
            setActiveChannel(null);

            if (!credentials) {
              handleLogin({
                serverUrl: 'https://demo.streamhub.tv:8080',
                username: 'demo',
                password: 'demo1234',
                isDemo: true,
              }, true);
            } else {
              setViewMode('choice');
            }
          } else {
            setViewMode(mode);
          }
        }}
        onLogout={handleLogout}
        lang={lang}
        onSelectLang={handleSelectLang}
        onOpenMacModal={() => setIsMacModalOpen(true)}
        onOpenRangeModal={() => setIsRangeModalOpen(true)}
        onOpenLinkMaster={() => setIsLinkMasterModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenTrackUrl={() => setIsTrackUrlModalOpen(true)}
        onOpenVerifier={() => setIsVerifierModalOpen(true)}
        onOpenFeedback={() => setIsFeedbackModalOpen(true)}
        authUser={authUser}
        onOpenAuth={(mode = 'login') => {
          setAuthModalMode(mode);
          setIsAuthModalOpen(true);
        }}
        onSignOutAuth={async () => {
          await logoutUser();
          setAuthUser(null);
        }}
      />

      {/* Main Content Area */}
      <>
        {/* Desktop 'Loaded URL' Section with Delete button */}
        {credentials && (
          <LoadedUrlSection
            credentials={credentials}
            userInfo={userInfo}
            onDeleteLoadedUrl={handleDeleteLoadedUrl}
            lang={lang}
          />
        )}

        {/* Dashboard Content */}
        <main className="flex-1">
          {/* Step 1: Login Form (Stream API URL, Username, Password + MAC URL Launcher + Loaded URL Manager + Range URL Generator Tab) */}
          {viewMode === 'login' && (
            <LoginForm
              onLogin={(creds) => handleLogin(creds)}
              isLoading={isLoadingAuth}
              error={authError}
              onClearError={() => setAuthError(null)}
              lang={lang}
              onSelectLang={handleSelectLang}
              onOpenMacModal={() => setIsMacModalOpen(true)}
              loadedUrl={lastLoadedUrl}
              onDeleteLoadedUrl={handleDeleteLoadedUrl}
              onMacLogin={handleMacLogin}
              onPlayChannel={handleSelectChannel}
              onLoadChannelsToApp={handleLoadChannelsToApp}
            />
          )}

          {/* Step 2: Action Choices (Download, View, or Range Generator) */}
          {viewMode === 'choice' && credentials && (
            <ActionChoice
              credentials={credentials}
              userInfo={userInfo}
              serverInfo={serverInfo}
              onSelectAction={(action) => {
                if (action === 'channels') {
                  handleOpenViewChannels();
                } else {
                  setViewMode(action);
                }
              }}
              lang={lang}
              onSelectLang={handleSelectLang}
            />
          )}

          {/* Option 1: Download Section */}
          {viewMode === 'download' && credentials && (
            <DownloadSection
              credentials={credentials}
              streams={channels}
              onBackToChoice={() => setViewMode('choice')}
              onGoToView={() => handleOpenViewChannels()}
              lang={lang}
            />
          )}

          {/* Option 2: View Channels Section with Web Worker parsing & Virtualization */}
          {viewMode === 'channels' && credentials && (
            <ChannelList
              channels={channels}
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={handleSelectCategory}
              onSelectChannel={handleSelectChannel}
              onBackToChoice={() => setViewMode('choice')}
              onGoToDownload={() => setViewMode('download')}
              isLoading={isLoadingChannels}
              lang={lang}
              onRefreshCatalog={() => handleOpenViewChannels(true)}
              catalogStats={catalogStats}
            />
          )}

          {/* Option 3: Sequential Range URL & M3U Playlist Generator Page */}
          {viewMode === 'range_generator' && (
            <div className="max-w-4xl mx-auto px-4 py-8">
              <button
                onClick={() => setViewMode(credentials ? 'choice' : 'login')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-lg mb-6 shadow-2xs transition-colors cursor-pointer"
              >
                ← {t('back', lang)}
              </button>
              <RangeUrlGenerator
                lang={lang}
                onPlayChannel={handleSelectChannel}
              />
            </div>
          )}

          {/* Option 4: Link Master Page (M3U Encrypted Aliases) */}
          {viewMode === 'link_master' && (
            <div className="max-w-4xl mx-auto px-4 py-8">
              <button
                onClick={() => setViewMode(credentials ? 'choice' : 'login')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-lg mb-6 shadow-2xs transition-colors cursor-pointer"
              >
                ← {t('back', lang)}
              </button>
              <LinkMasterModal
                isStandalonePage={true}
                lang={lang}
                onPlayChannel={handleSelectChannel}
                onLoadToApp={handleLoadChannelsToApp}
              />
            </div>
          )}

          {/* Option 5: Track URL Page (M3U Short Link & Device Analytics) */}
          {viewMode === 'track_url' && (
            <div className="max-w-5xl mx-auto px-4 py-8">
              <button
                onClick={() => setViewMode(credentials ? 'choice' : 'login')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-lg mb-6 shadow-2xs transition-colors cursor-pointer"
              >
                ← {t('back', lang)}
              </button>
              <TrackUrlModal
                isStandalonePage={true}
                lang={lang}
                onPlayChannel={handleSelectChannel}
              />
            </div>
          )}

          {/* Option 6: M3U Playlist Verifier Page (Live Probe & Active Playlist Generator) */}
          {viewMode === 'verifier' && (
            <div className="max-w-5xl mx-auto px-4 py-8">
              <button
                onClick={() => setViewMode(credentials ? 'choice' : 'login')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-lg mb-6 shadow-2xs transition-colors cursor-pointer"
              >
                ← {t('back', lang)}
              </button>
              <PlaylistVerifierModal
                isStandalonePage={true}
                lang={lang}
                onPlayChannel={handleSelectChannel}
                onLoadChannelsToApp={handleLoadChannelsToApp}
              />
            </div>
          )}
        </main>
      </>

      {/* MAC URL Portal Modal Interface (Opens on 'MAC URL' click) */}
      {isMacModalOpen && (
        <MacPortalModal
          isOpen={isMacModalOpen}
          onClose={() => setIsMacModalOpen(false)}
          lang={lang}
          onMacLogin={handleMacLogin}
        />
      )}

      {/* Range URL Generator Modal Interface (Opens on 'Range URL' header click) */}
      {isRangeModalOpen && (
        <RangeUrlGenerator
          lang={lang}
          isModal={true}
          onClose={() => setIsRangeModalOpen(false)}
          onPlayChannel={(ch) => {
            setIsRangeModalOpen(false);
            handleSelectChannel(ch);
          }}
        />
      )}

      {/* Link Master Modal Interface (Opens on 'Link Master' header click) */}
      {isLinkMasterModalOpen && (
        <LinkMasterModal
          isOpen={isLinkMasterModalOpen}
          onClose={() => setIsLinkMasterModalOpen(false)}
          lang={lang}
          onPlayChannel={(ch) => {
            setIsLinkMasterModalOpen(false);
            handleSelectChannel(ch);
          }}
          onLoadToApp={(chList, cats) => {
            setIsLinkMasterModalOpen(false);
            handleLoadChannelsToApp(chList, cats);
          }}
        />
      )}

      {/* Import Playlist Modal Interface (Opens on 'Import Playlist' header click) */}
      {isImportModalOpen && (
        <ImportPlaylistModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          lang={lang}
          onPlayChannel={(ch) => {
            setIsImportModalOpen(false);
            handleSelectChannel(ch);
          }}
          onLoadChannelsToApp={(importedChs) => {
            setIsImportModalOpen(false);
            handleLoadChannelsToApp(importedChs);
          }}
        />
      )}

      {/* Track URL Modal Interface (Opens on 'Track URL' header or dashboard click) */}
      {isTrackUrlModalOpen && (
        <TrackUrlModal
          isOpen={isTrackUrlModalOpen}
          onClose={() => setIsTrackUrlModalOpen(false)}
          lang={lang}
          onPlayChannel={(ch) => {
            setIsTrackUrlModalOpen(false);
            handleSelectChannel(ch);
          }}
        />
      )}

      {/* M3U Playlist Verifier Modal Interface (Opens on 'Verify M3U' header or dashboard click) */}
      {isVerifierModalOpen && (
        <PlaylistVerifierModal
          isOpen={isVerifierModalOpen}
          onClose={() => setIsVerifierModalOpen(false)}
          lang={lang}
          onPlayChannel={(ch) => {
            setIsVerifierModalOpen(false);
            handleSelectChannel(ch);
          }}
          onLoadChannelsToApp={(verifiedChs) => {
            setIsVerifierModalOpen(false);
            handleLoadChannelsToApp(verifiedChs);
          }}
        />
      )}

      {/* User Feedback & 5-Star Rating Modal */}
      {isFeedbackModalOpen && (
        <FeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
          lang={lang}
        />
      )}

      {/* Account Authentication Modal (Sign In, Sign Up, Google, Forgot Password) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setAuthUser(user);
        }}
      />

      {/* Full-Screen Video Player Component (Plays on selecting any channel via FFmpeg) */}
      {activeChannel && (
        <FullScreenPlayer
          channel={activeChannel}
          allChannels={channels}
          credentials={credentials}
          onClose={() => setActiveChannel(null)}
          onSelectChannel={(newChannel) => setActiveChannel(newChannel)}
          lang={lang}
        />
      )}

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200/90 bg-white/95 backdrop-blur-md text-center text-xs text-slate-500 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <BrandLogoIcon size={22} />
            <p className="font-semibold text-slate-700">
              {t('footer_text', lang)}
            </p>
          </div>
          {/* Modern branding element featuring 'Yaaro Ka Yaar Stream' */}
          <FooterBranding onClick={() => setIsFeedbackModalOpen(true)} />
        </div>
      </footer>

      {/* Floating Feedback & Notes Icon Widget */}
      <button
        type="button"
        onClick={() => setIsFeedbackModalOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 p-2.5 sm:px-3.5 sm:py-2.5 bg-gradient-to-r from-rose-600 via-indigo-600 to-indigo-700 hover:from-rose-500 hover:to-indigo-600 text-white rounded-full shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-white/20 select-none group"
        title="फीडबैक / नोट्स लिखें (Sends to Yaaro Ka Yaar via SMTP)"
        aria-label="Open Feedback & Notes Modal"
      >
        <MessageSquare className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform shrink-0" />
        <span className="text-xs font-extrabold hidden sm:inline">फीडबैक / Notes</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
      </button>
    </div>
  );
}
