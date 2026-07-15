/** 内置免版权曲库（文件位于 public/music-store，命名：歌手 - 歌名.mp3） */

export interface LibraryTrack {
  id: string;
  artist: string;
  title: string;
  /** 相对 public 的路径，如 /music-store/... */
  file: string;
}

function parseFilename(filename: string): Omit<LibraryTrack, "id" | "file"> {
  const base = filename.replace(/\.mp3$/i, "");
  const sep = " - ";
  const idx = base.indexOf(sep);
  if (idx === -1) {
    return { artist: "未知", title: base };
  }
  return {
    artist: base.slice(0, idx).trim() || "未知",
    title: base.slice(idx + sep.length).trim() || base,
  };
}

/** 曲库清单 — 与 public/music-store 内文件一一对应 */
const LIBRARY_FILES = [
  "-艾兜 - Sunshine.mp3",
  "KidNam索南; 曲甲 - 次仁拉索.mp3",
  "yihuik苡慧; 胡期皓 - 小时光.mp3",
  "小柔Channel - 与神明交错的少女.mp3",
  "张叶蕾; 蒋小呢 - 陪你去寻觅.mp3",
  "曲甲 - 奶油.mp3",
  "等一下就回家 - 正在读取.mp3",
  "蒋小呢 - 世纪末的爱.mp3",
  "魏巡 - 微光.mp3",
] as const;

export const MUSIC_LIBRARY: LibraryTrack[] = LIBRARY_FILES.map((filename, i) => {
  const { artist, title } = parseFilename(filename);
  return {
    id: `lib-${i}`,
    artist,
    title,
    file: `/music-store/${encodeURIComponent(filename)}`,
  };
});

export function getLibraryTrack(id: string): LibraryTrack | undefined {
  return MUSIC_LIBRARY.find((t) => t.id === id);
}
