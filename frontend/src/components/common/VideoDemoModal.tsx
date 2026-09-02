import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  Download,
  Palette,
  Smartphone,
  ShoppingBag,
  PackageCheck,
} from 'lucide-react';

interface VideoDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string; // Optional custom external MP4 / YouTube URL
}

const chapters = [
  {
    id: 1,
    time: '0:00',
    title: '1. Store Creation in 60s',
    badge: 'Instant Setup',
    icon: LayoutDashboard,
    image: '/images/showcase-dashboard.jpg',
    narration: 'Sign up in seconds. GumShop instantly provisions your isolated multi-tenant store with zero credit card required.',
    duration: 8,
  },
  {
    id: 2,
    time: '0:08',
    title: '2. 1-Click Product Importer',
    badge: 'Universal Scraper',
    icon: Download,
    image: '/images/showcase-importer.jpg',
    narration: 'Paste any Shopify, WooCommerce, or website link. GumShop extracts 24+ products with automatic 50% discount price modifiers.',
    duration: 9,
  },
  {
    id: 3,
    time: '0:17',
    title: '3. Theme & Appearance Studio',
    badge: '8 Presets',
    icon: Palette,
    image: '/images/showcase-themes.jpg',
    narration: 'Choose from 8 industry themes (Tech, Fashion, Wellness, Coffee, Streetwear) and fine-tune colors, fonts, and corner radii.',
    duration: 8,
  },
  {
    id: 4,
    time: '0:25',
    title: '4. Live Multi-Device Simulator',
    badge: 'Instant Preview',
    icon: Smartphone,
    image: '/images/showcase-themes.jpg',
    narration: 'Test your responsive storefront directly in Admin using the interactive Desktop (100%) and iPhone (390px) simulator.',
    duration: 8,
  },
  {
    id: 5,
    time: '0:33',
    title: '5. Pre-Checkout Shipping Capture',
    badge: 'Lead Generation',
    icon: ShoppingBag,
    image: '/images/showcase-storefront.jpg',
    narration: 'Capture full customer delivery addresses before redirecting to encrypted Lemon Squeezy or Gumroad international checkout.',
    duration: 9,
  },
  {
    id: 6,
    time: '0:42',
    title: '6. Orders & Revenue Dashboard',
    badge: 'Fulfillment Desk',
    icon: PackageCheck,
    image: '/images/showcase-orders.jpg',
    narration: 'Track live orders, update fulfillment tags (Processing, In Transit, Fulfilled), and export batch CSV shipping slips in 1 click.',
    duration: 9,
  },
];

const TOTAL_DURATION = chapters.reduce((acc, c) => acc + c.duration, 0); // 51 seconds total

export const VideoDemoModal: React.FC<VideoDemoModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard controls
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, onClose]);

  // Video timer loop
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 0.5;
        if (next >= TOTAL_DURATION) {
          return 0; // Loop video
        }
        return next;
      });
    }, 500);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        ref={containerRef}
        className="relative w-full max-w-5xl bg-[#090B0E] border border-white/15 rounded-3xl overflow-hidden shadow-2xl shadow-black flex flex-col max-h-[92vh]"
      >
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#12141C]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/70" />
              <span className="w-3 h-3 rounded-full bg-amber-500/70" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white uppercase tracking-wider font-heading">
                GumShop Interactive Platform Tour
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                <Sparkles className="w-3 h-3" />
                60s Walkthrough
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-300 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Video Player Canvas / Screen ── */}
        <div className="relative aspect-video bg-[#050608] flex items-center justify-center overflow-hidden group">
          {videoUrl ? (
            <iframe
              src={videoUrl}
              title="GumShop Platform Demo Video"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Dynamic Chapter Scene Screenshot */}
              <img
                key={currentChapter.id}
                src={currentChapter.image}
                alt={currentChapter.title}
                className="w-full h-full object-cover transition-opacity duration-700 animate-in fade-in"
              />

              {/* Subtitle / Narration Teleprompter Overlay */}
              <div className="absolute inset-x-0 bottom-14 px-4 sm:px-8 py-3 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-wider">
                      {currentChapter.badge}
                    </span>
                    <span className="text-white font-bold text-xs sm:text-sm">
                      {currentChapter.title}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-300 leading-snug">
                    {currentChapter.narration}
                  </p>
                </div>

                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  <Link
                    to="/signup"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center gap-1.5"
                  >
                    <span>Start Free (60s)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Big Center Play/Pause Overlay Indicator on click */}
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors"
                aria-label={isPlaying ? 'Pause Demo' : 'Play Demo'}
              >
                {!isPlaying && (
                  <div className="w-16 h-16 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-2xl shadow-indigo-950 scale-110 transition-transform">
                    <Play className="w-7 h-7 fill-current ml-1" />
                  </div>
                )}
              </button>
            </div>
          )}

          {/* Scrubber Progress Bar */}
          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* ── Player Control Bar ── */}
        <div className="px-5 py-3 bg-[#0F1118] border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          {/* Play/Pause, Rewind, Time */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setElapsed(0);
                setCurrentChapterIdx(0);
                setIsPlaying(true);
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Replay from start"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="font-mono text-xs text-gray-400">
              <span className="text-white font-bold">{Math.floor(elapsed)}s</span> / {TOTAL_DURATION}s
            </div>
          </div>

          {/* Chapter Quick Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-xl scrollbar-none">
            {chapters.map((ch, idx) => {
              const isCurrent = currentChapterIdx === idx;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => jumpToChapter(idx)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                    isCurrent
                      ? 'bg-white/20 text-white border border-white/20'
                      : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span>{ch.badge}</span>
                </button>
              );
            })}
          </div>

          {/* CTA Links */}
          <div className="flex items-center gap-2">
            <Link
              to="/store/demo"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-bold transition-all border border-white/10"
            >
              Live Demo Store ↗
            </Link>
            <Link
              to="/signup"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <span>Create Store</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
