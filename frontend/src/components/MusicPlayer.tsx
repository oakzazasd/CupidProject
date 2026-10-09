import { useEffect, useRef, useState } from "react";
import { ExternalLink, Music4, Pause, Play, Volume2, VolumeX } from "lucide-react";

interface MusicPlayerProps {
  youtubeId: string | null;
  fallbackUrl: string;
  autoplayAttempt: boolean;
}

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise<void>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return ytApiPromise;
}

export function MusicPlayer({ youtubeId, fallbackUrl, autoplayAttempt }: MusicPlayerProps) {
  const playerRef = useRef<any>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(60);
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState<string>("เพลงเศร้าสำหรับหัวใจพัง 💔");
  const [autoplayTried, setAutoplayTried] = useState(false);

  useEffect(() => {
    if (!youtubeId || !mountRef.current) return;
    let disposed = false;
    loadYouTubeApi().then(() => {
      if (disposed || !mountRef.current) return;
      const isPlaylist = /^(PL|OL|RD|UU)/i.test(youtubeId);
      playerRef.current = new window.YT.Player(mountRef.current, {
        videoId: isPlaylist ? undefined : youtubeId,
        playerVars: isPlaylist
          ? { listType: "playlist", list: youtubeId, playsinline: 1, rel: 0 }
          : { playsinline: 1, rel: 0 },
        events: {
          onReady: () => {
            setReady(true);
            try {
              playerRef.current.setVolume(volume);
              const data = playerRef.current.getVideoData?.();
              if (data?.title) setTitle(data.title);
            } catch {
              /* noop */
            }
            if (autoplayAttempt && !autoplayTried) {
              setAutoplayTried(true);
              try {
                playerRef.current.playVideo();
              } catch {
                /* autoplay blocked — user can press play */
              }
            }
          },
          onStateChange: (ev: any) => {
            setPlaying(ev.data === window.YT.PlayerState.PLAYING);
          },
          onError: () => setReady(false),
        },
      });
    });
    return () => {
      disposed = true;
      try {
        playerRef.current?.destroy?.();
      } catch {
        /* noop */
      }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeId]);

  if (!youtubeId) {
    return (
      <div className="glass-subtle p-5 text-center">
        <Music4 size={26} className="mx-auto mb-2 text-indigo-300" />
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          เจ้าของเว็บยังไม่ได้ตั้งค่าเพลย์ลิสต์ แต่เปิดเพลงเศร้าบน YouTube ให้ได้เหมือนกัน
        </p>
        <a className="btn btn-romance mt-3" href={fallbackUrl} target="_blank" rel="noreferrer">
          <ExternalLink size={15} />
          เปิดเพลงเศร้าบน YouTube
        </a>
      </div>
    );
  }

  function togglePlay() {
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pauseVideo();
    else p.playVideo();
  }

  function toggleMute() {
    const p = playerRef.current;
    if (!p) return;
    if (muted) p.unMute();
    else p.mute();
    setMuted(!muted);
  }

  return (
    <div className="glass-subtle overflow-hidden p-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-white/10">
          <div ref={mountRef} className="h-full w-full" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{title}</p>
          <p className="text-[0.7rem] text-muted">
            {playing ? "กำลังเล่น — เศร้าได้เต็มที่" : ready ? "พร้อมเล่นเมื่อหัวใจพร้อม" : "กำลังโหลดเพลง..."}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <button
          className="btn btn-primary !px-3.5"
          onClick={togglePlay}
          disabled={!ready}
          aria-label={playing ? "หยุดเพลง" : "เล่นเพลง"}
        >
          {playing ? <Pause size={17} /> : <Play size={17} />}
        </button>
        <button
          className="btn btn-ghost !px-3"
          onClick={toggleMute}
          disabled={!ready}
          aria-label={muted ? "เปิดเสียง" : "ปิดเสียง"}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          className="flex-1 accent-[#8B5CF6]"
          aria-label="ระดับเสียง"
          onChange={(e) => {
            const v = Number(e.target.value);
            setVolume(v);
            try {
              playerRef.current?.setVolume(v);
            } catch {
              /* noop */
            }
          }}
        />
      </div>
    </div>
  );
}
