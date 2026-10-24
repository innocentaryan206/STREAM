import React, { useState } from 'react';
import { Download, FileText, Code2, Copy, Check, ArrowLeft, Tv, ExternalLink, HelpCircle } from 'lucide-react';
import { StreamCredentials, StreamChannel, Language } from '../types';
import { downloadPlaylistFile } from '../services/api';
import { addBrowserDownload } from '../services/browserStorage';

interface DownloadSectionProps {
  credentials: StreamCredentials;
  streams: StreamChannel[];
  onBackToChoice: () => void;
  onGoToView: () => void;
  lang: Language;
}

export const DownloadSection: React.FC<DownloadSectionProps> = ({
  credentials,
  streams,
  onBackToChoice,
  onGoToView,
  lang,
}) => {
  const isHindi = lang === 'hi';
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Generate direct M3U URL for external player
  const directM3uUrl = credentials.isDemo
    ? `${window.location.origin}/api/xtream/download-playlist`
    : `${credentials.serverUrl.replace(/\/+$/, '')}/get.php?username=${encodeURIComponent(
        credentials.username
      )}&password=${encodeURIComponent(credentials.password)}&type=m3u_plus&output=m3u8`;

  const handleDownload = async (format: 'm3u' | 'm3u_plus' | 'json') => {
    try {
      setDownloadingFormat(format);
      await downloadPlaylistFile(credentials, format, streams);
      addBrowserDownload({
        fileName: `playlist_${credentials.username || 'streamhub'}_${new Date().toISOString().slice(0, 10)}.${format === 'json' ? 'json' : 'm3u'}`,
        format: format === 'm3u_plus' ? 'M3U Plus (EPG)' : format === 'json' ? 'JSON Catalog' : 'Standard M3U',
        size: `${Math.max(12, Math.round(streams.length * 0.2 + 25))} KB`,
        url: '/api/xtream/download-playlist',
      });
    } catch (err: any) {
      alert(err.message || 'डाउनलोड विफल रहा');
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(directM3uUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Navigation & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <button
          onClick={onBackToChoice}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isHindi ? 'विकल्प मेनू पर लौटें' : 'Back to Choices'}</span>
        </button>

        <button
          onClick={onGoToView}
          className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
        >
          <Tv className="w-3.5 h-3.5 text-emerald-600" />
          <span>{isHindi ? 'लाइव चैनल व्यू खोलें (फुल स्क्रीन)' : 'Open View Channels (Full Screen)'}</span>
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
          {isHindi ? 'प्लेलिस्ट एवं चैनल डाउनलोड' : 'Download Playlist & Channels'}
        </h1>
        <p className="text-sm text-slate-600">
          {isHindi
            ? 'अपनी पसंद के फॉर्मेट में पूरी प्लेलिस्ट डाउनलोड करें या सीधे अपने मीडिया प्लेयर के लिए यूआरएल कॉपी करें।'
            : 'Download your playlist in standard formats or copy the live M3U URL for external players.'}
        </p>
      </div>

      {/* Download Options Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {/* M3U Plus */}
        <div className="bg-white border border-slate-200/90 hover:border-indigo-400 rounded-2xl p-6 flex flex-col justify-between shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-all">
          <div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 mb-4 shadow-2xs">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              M3U Plus (.m3u)
            </h3>
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider mb-2 block">
              {isHindi ? 'अनुशंसित (Recommended)' : 'Recommended'}
            </span>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              {isHindi
                ? 'इसमें चैनलों के नाम, लोगो (Logos), और श्रेणी समूह (group-title) टैग शामिल हैं। TiviMate और Smart TV के लिए सर्वोत्तम।'
                : 'Includes channel logos, category grouping tags, and EPG IDs. Best for TiviMate, Smart IPTV, and VLC.'}
            </p>
          </div>
          <button
            onClick={() => handleDownload('m3u_plus')}
            disabled={downloadingFormat !== null}
            className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-sm shadow-indigo-600/20 active:scale-[0.99]"
          >
            {downloadingFormat === 'm3u_plus' ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isHindi ? 'M3U Plus डाउनलोड करें' : 'Download M3U Plus'}</span>
          </button>
        </div>

        {/* Standard M3U */}
        <div className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-6 flex flex-col justify-between shadow-xs transition-all">
          <div>
            <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mb-4 shadow-2xs">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Standard M3U (.m3u)
            </h3>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              {isHindi ? 'सरल फॉर्मेट' : 'Standard'}
            </span>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              {isHindi
                ? 'हल्की और कॉम्पैक्ट M3U फ़ाइल, जो पुराने मीडिया प्लेयर और बेसिक हार्डवेयर के साथ पूरी तरह अनुकूल है।'
                : 'Minimalist M3U format with clean stream links. Maximum compatibility with basic hardware and older players.'}
            </p>
          </div>
          <button
            onClick={() => handleDownload('m3u')}
            disabled={downloadingFormat !== null}
            className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            {downloadingFormat === 'm3u' ? (
              <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isHindi ? 'Standard M3U डाउनलोड करें' : 'Download Standard M3U'}</span>
          </button>
        </div>

        {/* JSON Catalog */}
        <div className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-6 flex flex-col justify-between shadow-xs transition-all">
          <div>
            <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mb-4 shadow-2xs">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              JSON Catalog (.json)
            </h3>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              {isHindi ? 'डेवलपर / डेटा' : 'Developer'}
            </span>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              {isHindi
                ? 'स्ट्रक्चर्ड डेटा फॉर्मेट, जिसमें स्ट्रीम आईडी, कैटेगरी, डायरेक्ट यूआरएल और मेटाडेटा आसानी से पार्स किया जा सकता है।'
                : 'Raw structured JSON channel data for custom scripts, media managers, and development integrations.'}
            </p>
          </div>
          <button
            onClick={() => handleDownload('json')}
            disabled={downloadingFormat !== null}
            className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            {downloadingFormat === 'json' ? (
              <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isHindi ? 'JSON डाउनलोड करें' : 'Download JSON'}</span>
          </button>
        </div>
      </div>

      {/* Copy Direct M3U URL */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 mb-8 shadow-xs">
        <div className="flex items-center justify-between gap-4 mb-2">
          <h3 className="text-sm font-bold text-slate-900">
            {isHindi ? 'सीधा M3U यूआरएल (Direct M3U URL)' : 'Direct M3U URL'}
          </h3>
          <span className="text-xs font-medium text-slate-500">
            {isHindi ? 'ऐप्स में पेस्ट करने के लिए' : 'For IPTV Players'}
          </span>
        </div>
        <p className="text-xs text-slate-600 mb-3">
          {isHindi
            ? 'इस यूआरएल को सीधे VLC, TiviMate, OTT Navigator या IPTV Smarters में पेस्ट करें:'
            : 'Paste this URL directly into your IPTV app without saving a local file:'}
        </p>

        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-mono overflow-x-auto whitespace-nowrap select-all shadow-2xs">
            {directM3uUrl}
          </div>
          <button
            type="button"
            onClick={handleCopyUrl}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-sm shadow-indigo-600/20 active:scale-[0.98]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>{isHindi ? 'कॉपी हुआ!' : 'Copied!'}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{isHindi ? 'कॉपी करें' : 'Copy'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">
            {isHindi ? 'विभिन्न डिवाइसों में कैसे उपयोग करें?' : 'How to Setup on Devices'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
            <h4 className="font-bold text-indigo-700 mb-1">VLC Media Player (PC / Mac)</h4>
            <p className="text-slate-600 leading-relaxed">
              {isHindi
                ? 'डाउनलोड की गई .m3u फ़ाइल को सीधे VLC में ड्रैग और ड्रॉप करें, या Media > Open Network Stream में ऊपर दिया गया डायरेक्ट यूआरएल पेस्ट करें।'
                : 'Drag & drop the downloaded .m3u file into VLC, or go to Media > Open Network Stream and paste the Direct M3U URL.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
            <h4 className="font-bold text-indigo-700 mb-1">Android TV / Fire TV (TiviMate)</h4>
            <p className="text-slate-600 leading-relaxed">
              {isHindi
                ? 'TiviMate ऐप खोलें > Add Playlist > M3U Playlist चुनें और ऊपर दिया गया M3U URL दर्ज करें। आपके चैनल स्वतः लोड हो जाएंगे।'
                : 'Open TiviMate > Add Playlist > Select M3U Playlist and enter the Direct M3U URL. Your channels will sync automatically.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
