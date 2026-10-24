import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  X,
  SkipBack,
  SkipForward,
  RotateCcw,
  ListVideo,
  PictureInPicture2,
  Tv,
  AlertTriangle,
  Radio,
  Zap,
  Cpu,
  Layers,
} from 'lucide-react';
import { StreamChannel, Language, StreamCredentials } from '../types';
import { getFfmpegStreamUrl } from '../services/ffmpegStreamService';

interface FullScreenPlayerProps {
  channel: StreamChannel;
  allChannels: StreamChannel[];
  credentials?: StreamCredentials | null;
  onClose: () => void;
  onSelectChannel: (channel: StreamChannel) => void;
  lang: Language;
}

export type PlaybackEngine = 'ffmpeg' | 'direct_hls';

export const FullScreenPlayer: React.FC<FullScreenPlayerProps> = ({
  channel,
  allChannels,
  credentials,
  onClose,
  onSelectChannel,
  lang,
}) => {
  const isHindi = lang === 'hi';
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isLoadingStream, setIsLoadingStream] = useState(true);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'contain' | 'cover' | 'fill'>('contain');
  const [showChannelDrawer, setShowChannelDrawer] = useState(false);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);

  // Playback Engine State: 'direct_hls' (default for live HLS streams) or 'ffmpeg' (server remuxer)
  const [engine, setEngine] = useState<PlaybackEngine>(() => {
    const raw = channel.direct_source || '';
    if (raw.includes('.ts') && !raw.includes('.m3u8')) {
      return 'ffmpeg';
    }
    return 'direct_hls';
  });
  const [forceTranscode, setForceTranscode] = useState(false);
  const [streamExtension, setStreamExtension] = useState<'ts' | 'm3u8'>('m3u8');

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeSessionIdRef = useRef<string>(`session_${Date.now()}`);
  const retryCountRef = useRef<number>(0);

  // Determine current channel index for Next/Prev
  const currentIndex = allChannels.findIndex((c) => c.stream_id === channel.stream_id);

  // Request browser native full screen on mount
  useEffect(() => {
    const enterNativeFullscreen = async () => {
      try {
        if (containerRef.current && !document.fullscreenElement) {
          await containerRef.current.requestFullscreen();
          setIsNativeFullscreen(true);
        }
      } catch {
        // Safe fallback if gesture policy restricts requestFullscreen
      }
    };
    enterNativeFullscreen();

    const handleFullscreenChange = () => {
      setIsNativeFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Compute and sanitize raw stream URL from credentials or channel object
  const getStreamSource = useCallback(
    (targetChannel: StreamChannel, extension: 'ts' | 'm3u8' = streamExtension): string => {
      // If channel already has a direct source (such as demo streams or imported M3U playlists), USE IT INTACT!
      if (targetChannel.direct_source) {
        return targetChannel.direct_source.trim();
      }

      let source = '';
      if (credentials?.serverUrl && credentials?.username && credentials?.password) {
        const cleanUrl = credentials.serverUrl
          .trim()
          .replace(/\/+(player_api|get|panel_api|live|xmltv)\.php.*$/i, '')
          .replace(/\/+c\/?$/i, '')
          .replace(/\/+$/, '');
        const user = encodeURIComponent(credentials.username);
        const pass = encodeURIComponent(credentials.password);
        source = `${cleanUrl}/live/${user}/${pass}/${targetChannel.stream_id}.${extension}`;
      }

      // Sanitize accidental script paths inside stream URL
      source = source.replace(/\/+(player_api|get|panel_api)\.php\/live\//i, '/live/');
      source = source.replace(
        /\/+(player_api|get|panel_api)\.php\/([0-9a-zA-Z_]+)\/([0-9a-zA-Z_]+)\/([0-9a-zA-Z_]+)/i,
        '/live/$2/$3/$4'
      );

      return source;
    },
    [credentials, streamExtension]
  );

  // Initialize and load stream with FFmpeg Remuxer/Transcoder Engine
  const loadStream = useCallback(
    (
      targetChannel: StreamChannel,
      targetEngine: PlaybackEngine = engine,
      transcode: boolean = forceTranscode,
      ext: 'ts' | 'm3u8' = streamExtension
    ) => {
      setIsLoadingStream(true);
      setStreamError(null);

      const video = videoRef.current;
      if (!video) return;

      // Tear down previous Hls instance if any
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      const rawSource = getStreamSource(targetChannel, ext);
      if (!rawSource) {
        setStreamError(
          isHindi
            ? 'चैनल का स्ट्रीम स्रोत उपलब्ध नहीं है।'
            : 'Channel stream source is unavailable.'
        );
        setIsLoadingStream(false);
        return;
      }

      // Generate a fresh session ID for FFmpeg process management
      activeSessionIdRef.current = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const isM3u8 = rawSource.includes('.m3u8') || rawSource.includes('master') || rawSource.includes('playlist') || !rawSource.includes('.ts');

      // MODE 1: Direct HLS Playback (Client-side Hls.js)
      if (targetEngine === 'direct_hls' || (isM3u8 && targetEngine !== 'ffmpeg')) {
        const cleanHlsSource = rawSource.split('|')[0];
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 30,
            maxBufferLength: 30,
            fragLoadingTimeOut: 20000,
            manifestLoadingTimeOut: 20000,
          });
          hlsRef.current = hls;

          hls.loadSource(cleanHlsSource);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoadingStream(false);
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => setIsPlaying(true))
                .catch(() => {
                  video.muted = true;
                  setIsMuted(true);
                  video
                    .play()
                    .then(() => setIsPlaying(true))
                    .catch(() => setIsPlaying(false));
                });
            }
          });

          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) {
              console.warn('HLS.js fatal error, switching to server FFmpeg proxy:', data.details);
              hls.destroy();
              hlsRef.current = null;
              setEngine('ffmpeg');
              const ffmpegUrl = getFfmpegStreamUrl(rawSource, transcode, activeSessionIdRef.current);
              video.src = ffmpegUrl;
              video.play().then(() => {
                setIsPlaying(true);
                setIsLoadingStream(false);
              }).catch(() => {
                video.muted = true;
                setIsMuted(true);
                video.play().then(() => setIsPlaying(true)).catch(() => {});
              });
            }
          });
          return;
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = cleanHlsSource;
          video.play().then(() => {
            setIsPlaying(true);
            setIsLoadingStream(false);
          }).catch(() => {});
          return;
        }
      }

      // MODE 2: FFmpeg Streaming Engine (Server-side remuxing to live fMP4 with AAC audio)
      const ffmpegUrl = getFfmpegStreamUrl(rawSource, transcode, activeSessionIdRef.current);
      video.src = ffmpegUrl;

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsLoadingStream(false);
          })
          .catch(() => {
            // Unmuted autoplay policy: auto-mute and retry
            video.muted = true;
            setIsMuted(true);
            video
              .play()
              .then(() => setIsPlaying(true))
              .catch(() => setIsPlaying(false));
            setIsLoadingStream(false);
          });
      }
    },
    [isHindi, engine, forceTranscode, streamExtension, getStreamSource]
  );

  // Play stream on mount or channel switch
  useEffect(() => {
    retryCountRef.current = 0;
    loadStream(channel, engine, forceTranscode, streamExtension);

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      // Detach video src to close HTTP stream connection and stop FFmpeg process
      if (videoRef.current) {
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
    };
  }, [channel, loadStream]);

  // Handle native video element error with controlled non-looping fallback
  const handleVideoError = () => {
    // If on direct HLS and native error occurs, fallback to server FFmpeg proxy
    if (engine === 'direct_hls' && retryCountRef.current === 0) {
      retryCountRef.current = 1;
      setEngine('ffmpeg');
      loadStream(channel, 'ffmpeg', forceTranscode, streamExtension);
      return;
    }

    if (retryCountRef.current < 2 && !forceTranscode) {
      // Step 2: Auto-try FFmpeg full video transcode
      retryCountRef.current = 2;
      setForceTranscode(true);
      loadStream(channel, 'ffmpeg', true, streamExtension);
      return;
    }

    // Stop retrying and show clear actionable feedback
    setIsLoadingStream(false);
    setStreamError(
      isHindi
        ? 'प्रदाता सर्वर से स्ट्रीम प्राप्त नहीं हो सकी (HTTP 5XX/511 या ऑफ़लाइन चैनल)। कृपया अगला चैनल चलाएं या प्रारूप (.ts / .m3u8) बदलें।'
        : 'Stream could not be loaded from IPTV provider (Server returned 5XX/511 or channel offline). Please try next channel or toggle format.'
    );
  };

  // Toggle between FFmpeg engine and direct playback
  const toggleEngine = () => {
    const nextEngine: PlaybackEngine = engine === 'ffmpeg' ? 'direct_hls' : 'ffmpeg';
    setEngine(nextEngine);
    loadStream(channel, nextEngine, forceTranscode, streamExtension);
  };

  // Toggle video transcoding (Copy vs Libx264)
  const toggleTranscode = () => {
    const next = !forceTranscode;
    setForceTranscode(next);
    loadStream(channel, 'ffmpeg', next, streamExtension);
  };

  // Activity timer for controls auto-hide
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (!showChannelDrawer) {
        setShowControls(false);
      }
    }, 3500);
  }, [showChannelDrawer]);

  const handleMouseMove = () => {
    resetControlsTimeout();
  };

  // Keyboard navigation & controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      resetControlsTimeout();

      if (e.key === 'Escape') {
        if (showChannelDrawer) {
          setShowChannelDrawer(false);
        } else {
          handleClose();
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowRight') {
        handleNextChannel();
      } else if (e.key === 'ArrowLeft') {
        handlePrevChannel();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleNativeFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showChannelDrawer]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleNextChannel = () => {
    if (currentIndex < allChannels.length - 1) {
      onSelectChannel(allChannels[currentIndex + 1]);
    } else if (allChannels.length > 0) {
      onSelectChannel(allChannels[0]);
    }
  };

  const handlePrevChannel = () => {
    if (currentIndex > 0) {
      onSelectChannel(allChannels[currentIndex - 1]);
    } else if (allChannels.length > 0) {
      onSelectChannel(allChannels[allChannels.length - 1]);
    }
  };

  const toggleNativeFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsNativeFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsNativeFullscreen(false);
      }
    } catch {
      // ignore
    }
  };

  const cycleAspectRatio = () => {
    if (aspectRatio === 'contain') setAspectRatio('cover');
    else if (aspectRatio === 'cover') setAspectRatio('fill');
    else setAspectRatio('contain');
  };

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch {
      // ignore
    }
  };

  const handleClose = () => {
    if (document.fullscreenElement) {
      try {
        document.exitFullscreen();
      } catch {
        // ignore
      }
    }
    onClose();
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className={`w-full h-full object-${aspectRatio}`}
        playsInline
        autoPlay
        onError={handleVideoError}
        onPlaying={() => {
          setIsPlaying(true);
          setIsLoadingStream(false);
          setStreamError(null);
        }}
        onWaiting={() => setIsLoadingStream(true)}
        onCanPlay={() => setIsLoadingStream(false)}
      />

      {/* Loading Overlay */}
      {isLoadingStream && !streamError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 pointer-events-none">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3" />
          <p className="text-sm font-medium text-white/90">
            {isHindi ? 'FFmpeg लाइव स्ट्रीम लोड हो रही है...' : 'Streaming via FFmpeg Engine...'}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
            <p className="text-xs text-white/70">{channel.name}</p>
            {engine === 'ffmpeg' && (
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded font-mono flex items-center gap-1">
                <Zap className="w-3 h-3 text-indigo-400" />
                FFMPEG {forceTranscode ? 'TRANSCODE' : 'REMUX'} ({streamExtension.toUpperCase()})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stream Error Overlay */}
      {streamError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center z-30">
          <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-800 flex items-center justify-center text-rose-400 mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">
            {isHindi ? 'स्ट्रीम प्लेबैक समस्या' : 'Playback Notice'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
            {streamError}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* Play Next Channel */}
            {allChannels.length > 1 && (
              <button
                onClick={handleNextChannel}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-emerald-600/30"
              >
                <SkipForward className="w-4 h-4" />
                <span>{isHindi ? 'अगला चैनल चलाएं' : 'Play Next Channel'}</span>
              </button>
            )}

            {/* Toggle stream extension format */}
            <button
              onClick={() => {
                const nextExt = streamExtension === 'ts' ? 'm3u8' : 'ts';
                setStreamExtension(nextExt);
                loadStream(channel, engine, forceTranscode, nextExt);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>{streamExtension === 'ts' ? 'HLS (.m3u8) मोड बदलें' : 'MPEG-TS (.ts) मोड बदलें'}</span>
            </button>

            {/* FFmpeg Video Transcode Retry */}
            <button
              onClick={() => {
                setEngine('ffmpeg');
                setForceTranscode(true);
                loadStream(channel, 'ffmpeg', true, streamExtension);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              <Cpu className="w-4 h-4" />
              <span>{isHindi ? 'FFmpeg वीडियो ट्रांसकोडिंग' : 'Retry Transcode'}</span>
            </button>

            <button
              onClick={() => {
                retryCountRef.current = 0;
                loadStream(channel, 'ffmpeg', false, streamExtension);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isHindi ? 'पुनः प्रयास करें' : 'Retry'}</span>
            </button>

            <button
              onClick={() => setShowChannelDrawer(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ListVideo className="w-4 h-4" />
              <span>{isHindi ? 'अन्य चैनल चुनें' : 'Choose Other Channel'}</span>
            </button>

            <button
              onClick={handleClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>{isHindi ? 'बंद करें (Exit)' : 'Exit'}</span>
            </button>
          </div>
        </div>
      )}

      {/* On-Screen Display (OSD) Overlay */}
      <div
        className={`absolute inset-0 flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-t from-black/80 via-transparent to-black/80 pointer-events-none transition-opacity duration-300 ${
          showControls || showChannelDrawer ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top OSD Bar */}
        <div className="flex items-center justify-between gap-4 pointer-events-auto">
          {/* Channel Info */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-slate-900/90 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
              {channel.stream_icon ? (
                <img
                  src={channel.stream_icon}
                  alt={channel.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Tv className="w-5 h-5 text-indigo-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-600/90 text-white text-[10px] font-bold tracking-wider uppercase">
                  <Radio className="w-2.5 h-2.5 animate-pulse" />
                  LIVE
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  CH {currentIndex >= 0 ? currentIndex + 1 : 1}/{allChannels.length}
                </span>

                {/* FFmpeg Engine Status Badge / Toggle */}
                <button
                  type="button"
                  onClick={toggleEngine}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-medium border transition-colors cursor-pointer ${
                    engine === 'ffmpeg'
                      ? 'bg-indigo-950/80 border-indigo-500/60 text-indigo-300'
                      : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white'
                  }`}
                  title={isHindi ? 'स्ट्रीमिंग इंजन: FFmpeg / Direct' : 'Streaming Engine: FFmpeg / Direct'}
                >
                  <Zap className={`w-3 h-3 ${engine === 'ffmpeg' ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{engine === 'ffmpeg' ? 'FFmpeg इंजन' : 'Direct HLS'}</span>
                </button>

                {/* Stream Extension Format Toggle (.ts / .m3u8) */}
                <button
                  type="button"
                  onClick={() => {
                    const next = streamExtension === 'ts' ? 'm3u8' : 'ts';
                    setStreamExtension(next);
                    loadStream(channel, engine, forceTranscode, next);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                  title="Toggle Stream Format (.ts / .m3u8)"
                >
                  <Layers className="w-2.5 h-2.5 text-amber-400" />
                  <span>{streamExtension.toUpperCase()}</span>
                </button>

                {/* FFmpeg Transcoder Mode Toggle */}
                {engine === 'ffmpeg' && (
                  <button
                    type="button"
                    onClick={toggleTranscode}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border transition-colors cursor-pointer ${
                      forceTranscode
                        ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                    title={isHindi ? 'ट्रांसकोडिंग मोड बदलें (Direct Copy vs Libx264)' : 'Toggle Transcoding Mode (Copy vs Transcode)'}
                  >
                    <Cpu className="w-2.5 h-2.5" />
                    <span>{forceTranscode ? 'H.264 TRANSCODE' : 'DIRECT COPY'}</span>
                  </button>
                )}
              </div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight drop-shadow-md">
                {channel.name}
              </h1>
            </div>
          </div>

          {/* Top Right Controls (Channel Switcher toggle, Close) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChannelDrawer(!showChannelDrawer)}
              className="px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20 rounded-lg text-xs font-medium flex items-center gap-1.5 backdrop-blur-sm transition-colors cursor-pointer"
            >
              <ListVideo className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">
                {isHindi ? 'चैनल लिस्ट' : 'Channels'}
              </span>
            </button>

            <button
              onClick={handleClose}
              className="p-2 bg-slate-900/80 hover:bg-rose-900/80 text-white border border-white/20 hover:border-rose-700 rounded-lg backdrop-blur-sm transition-colors cursor-pointer"
              title={isHindi ? 'फुल स्क्रीन बंद करें (Esc)' : 'Exit Full Screen (Esc)'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Play Indicator on Tap / Pause */}
        {!isPlaying && !isLoadingStream && (
          <div className="self-center pointer-events-auto">
            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white flex items-center justify-center shadow-2xl shadow-indigo-600/50 hover:scale-105 transition-all cursor-pointer"
            >
              <Play className="w-8 h-8 fill-current ml-1" />
            </button>
          </div>
        )}

        {/* Bottom OSD Bar */}
        <div className="pointer-events-auto bg-slate-950/70 border border-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-4">
          {/* Left: Playback & Switchers */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevChannel}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title={isHindi ? 'पिछला चैनल (←)' : 'Previous Channel (←)'}
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={togglePlay}
              className="p-2.5 bg-white text-slate-950 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={handleNextChannel}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title={isHindi ? 'अगला चैनल (→)' : 'Next Channel (→)'}
            >
              <SkipForward className="w-5 h-5" />
            </button>

            {/* Volume control */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <button
                onClick={toggleMute}
                className="p-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-rose-400" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>

          {/* Right: Engine Indicator, Aspect Ratio, PiP, Fullscreen */}
          <div className="flex items-center gap-2">
            {/* FFmpeg engine indicator in toolbar */}
            <button
              onClick={toggleEngine}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
                engine === 'ffmpeg'
                  ? 'bg-indigo-950/80 border-indigo-600 text-indigo-300'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white'
              }`}
              title="Toggle FFmpeg Engine / Direct"
            >
              <Zap className={`w-3.5 h-3.5 ${engine === 'ffmpeg' ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">
                {engine === 'ffmpeg' ? 'FFmpeg' : 'Direct'}
              </span>
            </button>

            <button
              onClick={cycleAspectRatio}
              className="px-2.5 py-1.5 text-xs font-mono font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors cursor-pointer"
              title="Change Aspect Ratio"
            >
              {aspectRatio === 'contain' ? '16:9 Fit' : aspectRatio === 'cover' ? 'Fill' : 'Stretch'}
            </button>

            {document.pictureInPictureEnabled && (
              <button
                onClick={togglePiP}
                className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Picture in Picture"
              >
                <PictureInPicture2 className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={toggleNativeFullscreen}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Toggle Fullscreen (F)"
            >
              {isNativeFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Channel Drawer inside Full-Screen Mode */}
      {showChannelDrawer && (
        <div className="absolute top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-[#090d16]/95 border-l border-white/10 backdrop-blur-xl z-40 flex flex-col p-4 shadow-2xl">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <ListVideo className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">
                {isHindi ? 'लाइव चैनल सूची' : 'Live Channels'}
              </h3>
            </div>
            <button
              onClick={() => setShowChannelDrawer(false)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {allChannels.map((ch, idx) => {
              const isSelected = ch.stream_id === channel.stream_id;
              return (
                <button
                  key={`${ch.stream_id}_${idx}`}
                  onClick={() => {
                    onSelectChannel(ch);
                    setShowChannelDrawer(false);
                  }}
                  className={`w-full p-2.5 rounded-lg flex items-center gap-3 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="w-7 h-7 rounded bg-black/40 flex items-center justify-center text-xs font-mono shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate">{ch.name}</p>
                    <p className="text-[10px] opacity-70 truncate">{ch.category_name || 'Live'}</p>
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-white shrink-0 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
