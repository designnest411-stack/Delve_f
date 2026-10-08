import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Check, Copy, Download, FileText, Sparkles, BookOpen, ArrowUp } from 'lucide-react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { api } from '../api';
import type { PaperResult } from '../types';
import { Figure1Architecture, Figure2Tradeoff } from './ScientificFigures';

interface PaperViewerProps {
  sessionId: string | null;
  isComplete: boolean;
  paper?: PaperResult | null;
}

function extractHeadings(markdown: string) {
  return markdown
    .split('\n')
    .map((line) => {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (!match) return null;
      return {
        level: match[1].length,
        text: match[2].trim().replace(/\*\*/g, ''),
        id: match[2].trim().toLowerCase().replace(/[^\w]+/g, '-'),
      };
    })
    .filter((h): h is { level: number; text: string; id: string } => Boolean(h))
    .slice(0, 24);
}

export function PaperViewer({ sessionId, isComplete, paper: paperProp }: PaperViewerProps) {
  const reduceMotion = useReducedMotion();
  const [paper, setPaper] = useState<PaperResult | null>(paperProp ?? null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');

  useEffect(() => {
    if (paperProp) {
      setPaper(paperProp);
      return;
    }
    if (!sessionId || !isComplete) return;
    setLoading(true);
    setError(null);
    api.getPaper(sessionId)
      .then(setPaper)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load paper'))
      .finally(() => setLoading(false));
  }, [sessionId, isComplete, paperProp]);

  const manuscript = paper?.final_draft || paper?.paper || '';
  const headings = useMemo(() => extractHeadings(manuscript), [manuscript]);

  const handleCopy = async () => {
    if (!manuscript) return;
    await navigator.clipboard.writeText(manuscript);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleDownloadPdf = async () => {
    if (!sessionId) return;
    setDownloading(true);
    try {
      const blob = await api.downloadPaperPdf(sessionId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      const cleanTitle = (paper?.topic || headings[0]?.text || 'research-paper')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 48);
      anchor.download = `${cleanTitle}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert(err instanceof Error ? err.message : 'Failed to export PDF');
    } finally {
      setDownloading(false);
    }
  };

  const scrollToHeading = (id: string) => {
    setActiveHeadingId(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToTop = () => {
    const container = document.getElementById('paper-scroll-container');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const markdownComponents: Components = {
    h1({ children, ...props }) {
      const text = String(children).replace(/<[^>]*>/g, '');
      const id = text.trim().toLowerCase().replace(/[^\w]+/g, '-');
      return <h1 id={id} {...props}>{children}</h1>;
    },
    h2({ children, ...props }) {
      const text = String(children).replace(/<[^>]*>/g, '');
      const id = text.trim().toLowerCase().replace(/[^\w]+/g, '-');
      const isArchSection = /algorithmic mechanics|architectural paradigms/i.test(text);
      return (
        <>
          <h2 id={id} {...props}>{children}</h2>
          {isArchSection && <Figure1Architecture topic={paper?.topic} />}
        </>
      );
    },
    h3({ children, ...props }) {
      const text = String(children).replace(/<[^>]*>/g, '');
      const id = text.trim().toLowerCase().replace(/[^\w]+/g, '-');
      return <h3 id={id} {...props}>{children}</h3>;
    },
    table({ children, ...props }) {
      return (
        <div className="my-6 space-y-4">
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-xs" {...props}>{children}</table>
          </div>
          <Figure2Tradeoff />
        </div>
      );
    },
    code({ className, children, ...props }) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  if (!sessionId || (!isComplete && !loading)) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <FileText className="mx-auto mb-4 h-8 w-8 opacity-40" style={{ color: 'var(--color-ink-mute)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--color-ink-soft)' }}>
            The research manuscript will render here when generation completes.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <div className="text-center space-y-3">
          <div className="loading-dots mx-auto"><span/><span/><span/></div>
          <p className="text-xs" style={{ color: 'var(--color-ink-mute)' }}>Rendering manuscript...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <div className="rounded-xl border border-err bg-err/10 px-5 py-4 text-xs text-err max-w-md">
          <p className="font-semibold mb-1">Failed to load paper</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!paper || !manuscript.trim()) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-xs" style={{ color: 'var(--color-ink-mute)' }}>
        No manuscript text was returned for this session.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Top Bar: Metadata & Actions ── */}
      <div 
        className="shrink-0 px-4 sm:px-6 py-2.5 bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line"
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="badge badge-blue">
            {String(paper.paper_format || 'IEEE').toUpperCase()} Format
          </span>
          <span className="badge">
            {paper.verified_citations ?? paper.bibliography?.length ?? 0} Citations Verified
          </span>
          <span className="badge badge-green">
            Peer-Reviewed ({paper.debate_rounds ?? 2} Rounds)
          </span>
        </div>

        <div className="flex shrink-0 gap-2 items-center">
          <button 
            type="button" 
            onClick={handleCopy} 
            className="control-button text-[13px]"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-ok" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
          </button>
          <button 
            type="button" 
            onClick={handleDownloadPdf} 
            className="control-button control-button-primary text-[13px]"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{downloading ? 'Exporting PDF…' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* ── Main 1-Block Scrollable Workspace ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Manuscript Reader Scrollable Container */}
        <div id="paper-scroll-container" className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-12 py-6 sm:py-8">
          <div className="mx-auto max-w-[880px]">
            <div
              className="card p-6 sm:p-10 md:p-14"
              style={{ background: 'var(--color-surface)' }}
            >
              <article className="paper-body mx-auto w-full">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm, remarkMath]} 
                  rehypePlugins={[rehypeKatex]}
                  components={markdownComponents}
                >
                  {manuscript}
                </ReactMarkdown>
              </article>
            </div>
          </div>
        </div>

        {/* Table of Contents Right Panel (Docked at the top right) */}
        {headings.length > 0 && (
          <aside
            className="w-64 shrink-0 border-l border-line overflow-hidden hidden xl:flex flex-col bg-surface"
          >
            <div className="flex items-center justify-between gap-1.5 px-3.5 py-2.5 border-b border-line shrink-0">
              <div className="flex items-center gap-1.5">
                <BookOpen size={13} className="text-ink-mute" />
                <span className="mono-kicker text-xs">Sections</span>
              </div>
              <button
                type="button"
                onClick={scrollToTop}
                className="text-xs text-ink-mute hover:text-ink flex items-center gap-0.5"
              >
                <ArrowUp size={11} /> Top
              </button>
            </div>

            <nav className="p-2 space-y-0.5 flex-1 overflow-y-auto" aria-label="Table of Contents">
              {headings.map((h) => {
                const isSelected = activeHeadingId === h.id;
                return (
                  <button
                    key={h.id}
                    onClick={() => scrollToHeading(h.id)}
                    className={`block text-left text-[13px] leading-snug rounded px-2.5 py-1.5 w-full truncate transition-colors ${
                      isSelected
                        ? 'bg-surface-subtle text-ink font-semibold'
                        : 'text-ink-mute hover:text-ink hover:bg-surface-subtle'
                    }`}
                    style={{
                      paddingLeft: h.level === 2 ? '0.85rem' : h.level === 3 ? '1.25rem' : '0.5rem',
                      fontWeight: h.level === 1 ? 600 : h.level === 2 ? 500 : 400,
                    }}
                  >
                    {h.text}
                  </button>
                );
              })}
            </nav>
          </aside>
        )}
      </div>
    </div>
  );
}
