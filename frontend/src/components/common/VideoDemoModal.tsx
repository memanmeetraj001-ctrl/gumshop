import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { demoSoundtrack } from '../../utils/demoSoundtrack';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Sparkles,
  ArrowRight,
  Download,
  RefreshCw,
  ExternalLink,
  Palette,
  ShoppingBag,
  Truck,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface VideoDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
}

const chapters = [
  {
    id: 1,
    time: '0:00',
    title: '1. 1-Click Universal Product Importer',
    badge: 'Step 1: Scrape & Import',
    icon: Download,
    image: '/images/showcase-importer.jpg',
    narration: 'Paste any Shopify, WooCommerce, or web URL. GumShop automatically extracts 24+ items and applies discount price modifiers.',
    duration: 8,
    actionTip: 'Auto-extracts titles, photos & pricing in 2s',
  },
  {
    id: 2,
    time: '0:08',
    title: '2. One-Click Gumroad Catalog Sync',
    badge: 'Step 2: Connect Gumroad',
    icon: RefreshCw,
    image: '/images/showcase-gumroad-sync.jpg',
    narration: 'Select one, multiple, or all products. Click "⚡ Sync Selected" to automatically create drafts on your Gumroad account.',
    duration: 9,
    actionTip: 'Syncs selected items via Gumroad REST API',
  },
  {
    id: 3,
    time: '0:17',
    title: '3. Publish on Gumroad & Link Checkout',
    badge: 'Step 3: Live Checkout URL',
    icon: ExternalLink,
    image: '/images/showcase-gumroad-publish.jpg',
    narration: 'Open Gumroad Products Dashboard, upload cover photos, toggle Publish, and link your live checkout URL back to your store.',
    duration: 9,
    actionTip: 'Direct 1-click international checkout',
  },
  {
    id: 4,
    time: '0:26',
    title: '4. Theme Studio & Live Device Simulator',
    badge: 'Step 4: Style & Test',
    icon: Palette,
    image: '/images/showcase-themes.jpg',
    narration: 'Choose from 8 industry presets (Cyber Tech, Luxury Fashion, Specialty Coffee) and preview in real-time on Desktop & iPhone.',
    duration: 9,
    actionTip: 'Responsive sub-second layout & font customization',
  },
  {
    id: 5,
    time: '0:35',
    title: '5. Pre-Checkout Shipping Address Capture',
    badge: 'Step 5: Customer Buys',
    icon: ShoppingBag,
    image: '/images/showcase-storefront.jpg',
    narration: 'When a shopper clicks "Buy Now", our pre-checkout modal captures full physical delivery addresses before routing to payment.',
    duration: 9,
    actionTip: 'Captures full Street, City, ZIP & Phone',
  },
  {
    id: 6,
    time: '0:44',
    title: '6. Review Orders & Fulfill Manually',
    badge: 'Step 6: Manual Fulfillment',
    icon: Truck,
    image: '/images/showcase-shipping-fulfillment.jpg',
    narration: 'Review captured orders in Store Admin, print packing slips, input USPS/FedEx tracking IDs, and fulfill physical goods manually!',
    duration: 10,
    actionTip: 'Live customer package tracking timeline',
  },
];

const TOTAL_DURATION = chapters.reduce((acc, c) => acc + c.duration, 0); // 54s total

export const VideoDemoModal: React.FC<VideoDemoModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Start sound on open if playing
  useEffect(() => {
    if (isOpen && isPlaying && !isMuted) {
      demoSoundtrack.play();
    } else {
      demoSoundtrack.pause();
    }
    return () => {
      demoSoundtrack.pause();
    };
  }, [isOpen, isPlaying, isMuted]);

  // Handle Mute toggle
  const handleToggleMute = () => {
    const muted = demoSoundtrack.toggleMute();
    setIsMuted(muted);
    if (!muted && isPlaying) {
      demoSoundtrack.play();
    }
  };

  // Keyboard controls
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          demoSoundtrack.stop();
          onClose();
        }
      }
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
      if (e.key === 'm') {
        handleToggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, onClose, isPlaying]);

  // Smooth 60fps timer loop (tick every 50ms)
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 0.05;
        if (next >= TOTAL_DURATION) {
          return 0; // Loop video smoothly
        }
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isOpen, isPlaying]);

  // Map elapsed time to active chapter
  useEffect(() => {
    let accumulated = 0;
    for (let i = 0; i < chapters.length; i++) {
      accumulated += chapters[i].duration;
      if (elapsed < accumulated) {
        setCurrentChapterIdx(i);
        break;
      }
    }
  }, [elapsed]);

  if (!isOpen) return null;

  const currentChapter = chapters[currentChapterIdx] || chapters[0];
  const progressPercent = Math.min(100, (elapsed / TOTAL_DURATION) * 100);

  const jumpToChapter = (idx: number) => {
    let start = 0;
    for (let i = 0; i < idx; i++) {
      start += chapters[i].duration;
    }
    setElapsed(start);
    setCurrentChapterIdx(idx);
    setIsPlaying(true);
    if (!isMuted) demoSoundtrack.play();
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const handleClose = () => {
    demoSoundtrack.stop();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-200">
      {/* Sleek, Compact Frame Container (max-w-3xl) */}
      <div
        ref={containerRef}
        className="relative w-full max-w-3xl bg-[#090B0E] border border-white/15 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-black flex flex-col max-h-[94vh]"
      >
        {/* ── Browser Mockup Header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#12141C]">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <div className="h-3.5 w-px bg-white/10 mx-1" />
            <span className="text-xs font-black text-white uppercase tracking-wider font-heading truncate">
              GumShop 60s Workflow Demo
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Royalty-Free Sound Toggle */}
            <button
              type="button"
              onClick={handleToggleMute}
              className={`p-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
                !isMuted
                  ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
              }`}
              title={isMuted ? 'Unmute Royalty-Free Audio (M)' : 'Mute Audio (M)'}
            >
              {!isMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="text-[10px] hidden sm:inline">{!isMuted ? 'Audio On' : 'Muted'}</span>
              {!isMuted && isPlaying && (
                <span className="flex items-center gap-0.5 h-2">
                  <span className="w-0.5 h-2 bg-indigo-400 animate-pulse" />
                  <span className="w-0.5 h-3 bg-indigo-400 animate-pulse delay-75" />
                  <span className="w-0.5 h-1.5 bg-indigo-400 animate-pulse delay-150" />
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-300 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── Video Player Canvas / Screen (Compact 16:9) ── */}
        <div className="relative aspect-video bg-[#050608] flex items-center justify-center overflow-hidden group select-none">
          {videoUrl ? (
            <iframe
              src={videoUrl}
              title="GumShop Platform Demo Video"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              {/* Dynamic Animated Scene with Ken-Burns Smooth Zoom */}
              <div className="absolute inset-0 w-full h-full overflow-hidden">
                <img
                  key={currentChapter.id}
                  src={currentChapter.image}
                  alt={currentChapter.title}
                  className={`w-full h-full object-cover transition-transform duration-[8000ms] ease-out ${
                    isPlaying ? 'scale-105' : 'scale-100'
                  }`}
                />
              </div>

              {/* Dynamic Interactive Callout Badge */}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-[10px] sm:text-xs font-bold text-white shadow-lg animate-in fade-in slide-in-from-top-2">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>{currentChapter.actionTip}</span>
                </div>
              </div>

              {/* Subtitle / Narration Overlay */}
              <div className="absolute inset-x-0 bottom-6 sm:bottom-8 px-4 sm:px-6 py-3 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left z-10">
                <div className="space-y-0.5 max-w-lg">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-bold text-[9px] uppercase tracking-wider">
                      {currentChapter.badge}
                    </span>
                    <span className="text-white font-bold text-xs sm:text-sm font-heading">
                      {currentChapter.title}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-300 leading-snug">
                    {currentChapter.narration}
                  </p>
                </div>

                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  <Link
                    to="/signup"
                    onClick={handleClose}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-[11px] uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5"
                  >
                    <span>Try Free</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Center Play/Pause Click Handler */}
              <button
                type="button"
                onClick={() => {
                  const next = !isPlaying;
                  setIsPlaying(next);
                  if (next && !isMuted) demoSoundtrack.play();
                  else demoSoundtrack.pause();
                }}
                className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors z-20"
                aria-label={isPlaying ? 'Pause Demo' : 'Play Demo'}
              >
                {!isPlaying && (
                  <div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-950 scale-110 transition-transform">
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  </div>
                )}
              </button>
            </div>
          )}

          {/* Smooth 60fps Scrubber Progress Bar */}
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10 z-30">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-75"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* ── Compact Player Control Bar ── */}
        <div className="px-4 py-2.5 bg-[#0F1118] border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {/* Controls: Play, Rewind, Time */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const next = !isPlaying;
                setIsPlaying(next);
                if (next && !isMuted) demoSoundtrack.play();
                else demoSoundtrack.pause();
              }}
              className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setElapsed(0);
                setCurrentChapterIdx(0);
                setIsPlaying(true);
                if (!isMuted) demoSoundtrack.play();
              }}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Replay from start"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <div className="font-mono text-[11px] text-gray-400">
              <span className="text-white font-bold">{Math.floor(elapsed)}s</span> / {TOTAL_DURATION}s
            </div>
          </div>

          {/* Chapter Selector Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-sm sm:max-w-md scrollbar-none">
            {chapters.map((ch, idx) => {
              const isCurrent = currentChapterIdx === idx;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => jumpToChapter(idx)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap transition-all ${
                    isCurrent
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow'
                      : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span>{ch.badge.replace('Step ', 'S')}</span>
                </button>
              );
            })}
          </div>

          {/* Direct CTA */}
          <Link
            to="/signup"
            onClick={handleClose}
            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold text-[11px] transition-all flex items-center gap-1"
          >
            <span>Create Store ↗</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
