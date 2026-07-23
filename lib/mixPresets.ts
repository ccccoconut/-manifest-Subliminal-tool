import type { MixParams } from "@/lib/types";

/** 一键调参只覆盖混音相关字段，不改背景音来源 / 配方 / 总时长 */
export type MixPresetPatch = Pick<
  MixParams,
  | "bgVolume"
  | "voiceVolume"
  | "voiceSpeed"
  | "overlayTracks"
  | "stagger"
  | "binaural"
  | "binauralHz"
  | "effect8d"
  | "distance"
>;

export interface MixPreset {
  id: string;
  name: string;
  blurb: string;
  patch: MixPresetPatch;
}

export const MIX_PRESETS: MixPreset[] = [
  {
    id: "daily",
    name: "日常潜听",
    blurb: "人声极轻。",
    patch: {
      bgVolume: 0.95,
      voiceVolume: 0.35,
      voiceSpeed: 3.5,
      stagger: 0,
      binaural: false,
      binauralHz: 7,
      effect8d: false,
      distance: "mid",
    },
  },
  {
    id: "deep",
    name: "深度显化",
    blurb: "多层人声+轻环绕。",
    patch: {
      bgVolume: 0.95,
      voiceVolume: 0.42,
      voiceSpeed: 4.5,
      stagger: 0.6,
      binaural: false,
      binauralHz: 7,
      effect8d: true,
      distance: "mid",
    },
  },
];

export function applyMixPreset(params: MixParams, preset: MixPreset): MixParams {
  return { ...params, ...preset.patch };
}

export function matchMixPresetId(params: MixParams): string | null {
  for (const preset of MIX_PRESETS) {
    const p = preset.patch;
    if (
      params.bgVolume === p.bgVolume &&
      params.voiceVolume === p.voiceVolume &&
      params.voiceSpeed === p.voiceSpeed &&
      params.overlayTracks === p.overlayTracks &&
      params.stagger === p.stagger &&
      params.binaural === p.binaural &&
      params.binauralHz === p.binauralHz &&
      params.effect8d === p.effect8d &&
      params.distance === p.distance
    ) {
      return preset.id;
    }
  }
  return null;
}
