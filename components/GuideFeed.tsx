"use client";

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DISCLAIMER_AUDIO, DISCLAIMER_VOICE } from "@/lib/constants";

type ArticleId = "steps" | "local-music" | "disclaimer" | "bgm";

interface Article {
  id: ArticleId;
  title: string;
  summary: string;
  body: ReactNode;
}

const ARTICLES: Article[] = [
  {
    id: "steps",
    title: "使用步骤说明",
    summary: "从写下心情到生成你的专属 Sub 音频，五步走完。",
    body: (
      <>
        <p>打开「酥饼」，点右上角<strong>新建</strong>，按下面五步完成即可：</p>
        <div className="guide-steps">
          {[
            {
              n: 1,
              title: "写下当下状态",
              desc: "用一两句话描述此刻的心情或想改变的事。",
              img: "/guide/01-input.png",
            },
            {
              n: 2,
              title: "确认肯定语",
              desc: "系统会生成几句短肯定语，可读一读，觉得顺口再继续。",
              img: "/guide/02-affirmation.png",
            },
            {
              n: 3,
              title: "用自己的声音录音",
              desc: "建议朗读 10–30 秒。需勾选本人声音授权后才能进入下一步。",
              img: "/guide/03-record.png",
            },
            {
              n: 4,
              title: "选择背景音",
              desc: "推荐使用「曲库选择」或「AI 生成纯音乐」，一键可用。",
              img: "/guide/04-background.png",
            },
            {
              n: 5,
              title: "微调并生成",
              desc: "调好人声音量与总时长后合成，作品会出现在「我的」里。",
              img: "/guide/05-mixconsole.png",
            },
          ].map((s) => (
            <figure key={s.n} className="guide-step">
              <div className="guide-step-head">
                <span className="guide-step-num">{s.n}</span>
                <div>
                  <strong>{s.title}</strong>
                  <span>{s.desc}</span>
                </div>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.img} alt={`步骤 ${s.n}：${s.title}`} className="guide-step-shot" />
            </figure>
          ))}
        </div>
        <p className="note">提示：请用系统浏览器（Safari / Chrome）打开并允许麦克风；微信内置浏览器有时会限制录音。</p>
      </>
    ),
  },
  {
    id: "local-music",
    title: "本地音乐怎么办？",
    summary: "官方平台不好下歌？这里告诉你更省事的做法。",
    body: (
      <>
        <p>
          市面上的音乐 App 通常<strong>不允许</strong>把歌曲下载成可随意上传的
          mp3，手机也不方便导出。对接官方曲库还需要版权与商务合作，短期内不现实。
        </p>
        <h3>推荐做法</h3>
        <p>
          在「选择背景音」里优先用<strong>曲库选择</strong>或<strong>AI 生成纯音乐</strong>：免下载、免版权负担，也更适合潜听。
        </p>
        <h3>什么时候才上传本地音频？</h3>
        <ul>
          <li>你自己录的氛围音、白噪、雨声等；</li>
          <li>明确拥有使用权的免版权 / 授权素材；</li>
          <li>电脑里已有的 wav / m4a / mp3，用文件选择导入。</li>
        </ul>
        <p className="note">请勿上传未获授权的商业歌曲。若无法上传，使用曲库或 AI 生成即可完成全部创作。</p>
      </>
    ),
  },
  {
    id: "disclaimer",
    title: "免责说明",
    summary: "陪伴向工具说明，使用前请阅读。",
    body: (
      <>
        <p>{DISCLAIMER_AUDIO}</p>
        <p>{DISCLAIMER_VOICE}</p>
        <ul>
          <li>本产品提供情绪陪伴与自我暗示类音频生成，不替代专业心理咨询或医疗建议。</li>
          <li>录音须为本人声音，或您已获对方明确授权的声音。</li>
          <li>上传背景音素材的版权与合规责任由上传者自行承担。</li>
          <li>生成内容仅供个人正向使用；请勿用于骚扰、欺诈或其他违法用途。</li>
        </ul>
        <p className="note">若你正在经历严重心理困扰，请优先联系线下专业人士或当地心理援助热线。</p>
      </>
    ),
  },
  {
    id: "bgm",
    title: "背景音乐说明",
    summary: "四种背景音来源怎么选、各自适合什么场景。",
    body: (
      <>
        <p>
          在「选择背景音」这一步，你可以任选一种方式为肯定语配上氛围。四种入口如下：
        </p>
        <h3>1. AI 生成纯音乐</h3>
        <p>
          系统按「自信 / 放松 / 专注 / 重启」等氛围现场生成垫音，可试听并叠加赫兹基准音。
          无需下载任何歌曲，适合快速出片、版权无负担，也更贴近潜听场景。
        </p>
        <h3>2. 上传本地音频</h3>
        <p>
          从手机或电脑选择你已有的 wav / m4a / mp3。适合使用自录环境音、白噪，
          或你明确拥有商用授权的素材。请勿上传未获授权的商业歌曲。
        </p>
        <h3>3. 曲库选择</h3>
        <p>
          应用内置的免版权精选曲目，以播放列表形式点选、试听后即可用作背景。
          不用自己找文件，听感比纯程序生成更完整，是最省事的推荐路径之一。
        </p>
        <h3>4. 官方音乐平台</h3>
        <p>
          预留对接网易云 / QQ 音乐等官方曲库的入口，当前<strong>暂未连接</strong>，
          仅作占位展示。正式接入前请使用上面三种方式完成创作。
        </p>
        <p className="note">
          潜听建议：背景音可偏大、人声偏小，让肯定语融在音乐里，而不是盖过整首歌。
        </p>
      </>
    ),
  },
];

export default function GuideFeed() {
  const [openId, setOpenId] = useState<ArticleId | null>(null);
  const article = ARTICLES.find((a) => a.id === openId) ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        {!article ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pb-1">
              {ARTICLES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setOpenId(a.id)}
                  className="glass flex w-full items-center gap-2.5 rounded-2xl px-3.5 py-3 text-left transition-colors hover:bg-white/45"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--color-mist)]">{a.title}</p>
                    <p className="mt-0.5 truncate text-[11px] text-[var(--color-haze)]">
                      {a.summary}
                    </p>
                  </div>
                  <span className="shrink-0 text-[var(--color-haze)]" aria-hidden>
                    ›
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.article
            key={article.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.22 }}
            className="glass flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl"
          >
            <div className="flex shrink-0 items-center gap-2 border-b border-black/[0.05] px-3 py-2.5">
              <button
                type="button"
                onClick={() => setOpenId(null)}
                className="rounded-full px-2 py-1 text-sm text-[var(--color-haze)] transition-colors hover:bg-black/[0.04] hover:text-[var(--color-mist)]"
              >
                ← 返回
              </button>
              <p className="min-w-0 flex-1 truncate text-center text-xs font-medium text-[var(--color-mist-soft)]">
                {article.title}
              </p>
              <span className="w-10" aria-hidden />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 pb-5 pt-4">
              <div className="guide-article-body">{article.body}</div>
            </div>
          </motion.article>
        )}
      </AnimatePresence>
    </div>
  );
}
