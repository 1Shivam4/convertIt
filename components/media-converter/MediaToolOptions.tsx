"use client";

import React from "react";
import { useMediaConversionStore } from "@/app/store/useMediaConversionStore";
import { MEDIA_RESOLUTIONS } from "@/app/utils/vars";
import { Gauge, VolumeX, Scissors, Zap, Tv2 } from "lucide-react";

interface MediaToolOptionsProps {
  disabled?: boolean;
  isAudioOnlyFile?: boolean;
}

const speedOptions = [0.5, 1.0, 1.5, 2.0];

export function MediaToolOptions({
  disabled = false,
  isAudioOnlyFile = false,
}: MediaToolOptionsProps) {
  const {
    selectedFormatId,
    resolution, setResolution,
    videoBitrate, setVideoBitrate,
    audioBitrate, setAudioBitrate,
    fps, setFps,
    startTime, setStartTime,
    endTime, setEndTime,
    muteAudio, setMuteAudio,
    speedFactor, setSpeedFactor,
  } = useMediaConversionStore();

  const isAudioOnly =
    isAudioOnlyFile ||
    ["mp3", "wav", "aac", "flac", "ogg"].includes(selectedFormatId.toLowerCase());
  const isGif = selectedFormatId.toLowerCase() === "gif";

  /* ── reusable label ──────────────────────────────────────────── */
  const Label = ({ children, value }: { children: React.ReactNode; value?: string }) => (
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-xs font-medium text-slate-400">{children}</span>
      {value && <span className="text-xs font-mono text-indigo-400">{value}</span>}
    </div>
  );

  /* ── reusable select ─────────────────────────────────────────── */
  const Select = ({
    value, onChange, children, disabled: d,
  }: {
    value: string | number;
    onChange: (v: string) => void;
    children: React.ReactNode;
    disabled?: boolean;
  }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={d || disabled}
      className="w-full bg-white/[0.04] border border-white/10 text-sm text-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500/60 transition-colors appearance-none cursor-pointer"
    >
      {children}
    </select>
  );

  return (
    <div className="space-y-5">
      {/* ── Heading ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-slate-400">
        <Gauge className="w-4 h-4 text-indigo-400" />
        <span className="text-xs font-semibold uppercase tracking-wider">
          {isAudioOnly ? "Audio Options" : "Encoding Options"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* ── Video Resolution ─────────────────────────────────── */}
        {!isAudioOnly && !isGif && (
          <div>
            <Label value={resolution === "original" ? "Original" : resolution}>
              <span className="flex items-center gap-1.5">
                <Tv2 className="w-3.5 h-3.5" /> Resolution
              </span>
            </Label>
            <Select value={resolution} onChange={(v) => setResolution(v as any)}>
              {MEDIA_RESOLUTIONS.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </Select>
          </div>
        )}

        {/* ── Video Bitrate ────────────────────────────────────── */}
        {!isAudioOnly && !isGif && (
          <div>
            <Label value={videoBitrate === "auto" ? "Auto" : videoBitrate}>Video Bitrate</Label>
            <Select value={videoBitrate} onChange={(v) => setVideoBitrate(v as any)}>
              <option value="auto">Auto (Recommended)</option>
              <option value="1m">1 Mbps — Compact</option>
              <option value="2.5m">2.5 Mbps — Standard HD</option>
              <option value="5m">5 Mbps — High Quality</option>
              <option value="8m">8 Mbps — Ultra</option>
            </Select>
          </div>
        )}

        {/* ── Audio Bitrate ────────────────────────────────────── */}
        {!muteAudio && (
          <div>
            <Label value={audioBitrate === "auto" ? "Auto" : audioBitrate}>Audio Bitrate</Label>
            <Select value={audioBitrate} onChange={(v) => setAudioBitrate(v as any)}>
              <option value="auto">Auto (Recommended)</option>
              <option value="128k">128 kbps — Standard</option>
              <option value="192k">192 kbps — High Quality</option>
              <option value="320k">320 kbps — Audiophile</option>
            </Select>
          </div>
        )}

        {/* ── Frame Rate ───────────────────────────────────────── */}
        {!isAudioOnly && (
          <div>
            <Label value={fps === 0 ? "Original" : `${fps} fps`}>Frame Rate</Label>
            <Select value={fps} onChange={(v) => setFps(Number(v))}>
              <option value={0}>Original</option>
              <option value={15}>15 fps — GIF / Low</option>
              <option value={24}>24 fps — Cinematic</option>
              <option value={30}>30 fps — Standard</option>
              <option value={60}>60 fps — Smooth</option>
            </Select>
          </div>
        )}
      </div>

      {/* ── Playback Speed ──────────────────────────────────────── */}
      <div>
        <Label value={`${speedFactor}×`}>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Playback Speed
          </span>
        </Label>
        <div className="grid grid-cols-4 gap-2">
          {speedOptions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeedFactor(s)}
              disabled={disabled}
              className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                speedFactor === s
                  ? "border-indigo-500 bg-indigo-500/15 text-indigo-300 shadow-sm shadow-indigo-500/10"
                  : "border-white/8 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-slate-300"
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      {/* ── Mute Audio toggle ───────────────────────────────────── */}
      {!isAudioOnly && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/8">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${muteAudio ? "bg-red-500/15 text-red-400" : "bg-white/6 text-slate-500"}`}>
              <VolumeX className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">Mute Audio Track</p>
              <p className="text-[11px] text-slate-500">Remove audio from output video</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={muteAudio}
            onClick={() => setMuteAudio(!muteAudio)}
            disabled={disabled}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
              muteAudio ? "bg-red-500" : "bg-white/15"
            }`}
          >
            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
              muteAudio ? "translate-x-4" : "translate-x-0"
            }`} />
          </button>
        </div>
      )}

      {/* ── Trim Clip ───────────────────────────────────────────── */}
      <div className="pt-1">
        <div className="flex items-center gap-2 mb-3">
          <Scissors className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Trim Clip</span>
          <span className="text-[10px] text-slate-600">(optional)</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Start Time (HH:MM:SS)</label>
            <input
              type="text"
              placeholder="00:00:05"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={disabled}
              className="w-full bg-white/[0.04] border border-white/10 text-sm text-slate-200 font-mono rounded-lg px-3 py-2 outline-none focus:border-indigo-500/60 transition-colors placeholder:text-slate-600"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">End Time (HH:MM:SS)</label>
            <input
              type="text"
              placeholder="00:01:30"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={disabled}
              className="w-full bg-white/[0.04] border border-white/10 text-sm text-slate-200 font-mono rounded-lg px-3 py-2 outline-none focus:border-indigo-500/60 transition-colors placeholder:text-slate-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
