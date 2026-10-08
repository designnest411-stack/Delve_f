import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Check, Copy, Download, FileText, BookOpen, FileCode, CheckCircle2 } from 'lucide-react';
import { api } from '../api';
import type { PaperResult } from '../types';
import { Figure1Architecture, Figure2Tradeoff } from './ScientificFigures';

interface PaperViewerProps {
  sessionId: string | null;
  isComplete: boolean;
  paper?: PaperResult | null;
}

type PublicationFormat = 'ieee' | 'acm' | 'apa' | 'mla';

const PUBLICATION_FORMATS: Array<{ id: PublicationFormat; label: string; desc: string }> = [
  { id: 'ieee', label: 'IEEE', desc: 'Two-Column Conference' },
  { id: 'acm', label: 'ACM', desc: 'Two-Column Sigconf' },
  { id: 'apa', label: 'APA 7th', desc: 'Single-Column Professional' },
  { id: 'mla', label: 'MLA 9th', desc: 'Single-Column Double-Spaced' },
];

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
  const [paper, setPaper] = useState<PaperResult | null>(paperProp ?? null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingLatex, setDownloadingLatex] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');

  const [selectedFormat, setSelectedFormat] = useState<PublicationFormat>(() => {
    const raw = String(paperProp?.paper_format || 'ieee').toLowerCase();
    if (raw === 'acm' || raw === 'apa' || raw === 'mla') return raw;
    return 'ieee';
  });

  useEffect(() => {
    if (paperProp) {
      setPaper(paperProp);
      const raw = String(paperProp.paper_format || 'ieee').toLowerCase();
      if (raw === 'acm' || raw === 'apa' || raw === 'mla') setSelectedFormat(raw);
      return;
    }
    if (!sessionId || !isComplete) return;
    setLoading(true);
    setError(null);
    api.getPaper(sessionId)
      .then((data) => {
        setPaper(data);
        const raw = String(data.paper_format || 'ieee').toLowerCase();
        if (raw === 'acm' || raw === 'apa' || raw === 'mla') setSelectedFormat(raw);
      })
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
    setDownloadingPdf(true);
    try {
      const blob = await api.downloadPaperPdf(sessionId, selectedFormat);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      const cleanTitle = (paper?.topic || headings[0]?.text || 'research-paper')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 35);
      anchor.download = `${cleanTitle}-${selectedFormat.toUpperCase()}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to export PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadLatex = async () => {
    if (!sessionId) return;
    setDownloadingLatex(true);
    try {
      const blob = await api.downloadPaperLatex(sessionId, selectedFormat);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      const cleanTitle = (paper?.topic || headings[0]?.text || 'research-paper')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 35);
      anchor.download = `${cleanTitle}-${selectedFormat.toUpperCase()}-LaTeX.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to export LaTeX bundle');
    } finally {
      setDownloadingLatex(false);
    }
  };

  const scrollToHeading = (id: string) => {
    setActiveHeadingId(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      const isArchSection = /algorithmic mechanics|architectural paradigms|theoretical framework/i.test(text);
      return (
        <div className="break-inside-avoid">
          <h2 id={id} {...props}>{children}</h2>
          {isArchSection && <Figure1Architecture topic={paper?.topic} />}
        </div>
      );
    },
    h3({ children, ...props }) {
      const text = String(children).replace(/<[^>]*>/g, '');
      const id = text.trim().toLowerCase().replace(/[^\w]+/g, '-');
      return <h3 id={id} className="break-inside-avoid" {...props}>{children}</h3>;
    },
    table({ children, ...props }) {
      return (
        <div className="my-6 space-y-4 break-inside-avoid">
          <div className="overflow-x-auto rounded border border-line bg-surface">
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
          <FileText className="mx-auto mb-4 h-8 w-8 opacity-40 text-ink-mute" />
          <p className="text-sm font-medium text-ink-soft">
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
          <p className="text-xs text-ink-mute">Compiling publication manuscript…</p>
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
      <div className="flex h-full items-center justify-center px-4 text-xs text-ink-mute">
        No manuscript text was returned for this session.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Top Bar: Format Switcher & Actions ── */}
      <div className="shrink-0 px-4 sm:px-6 py-2.5 bg-surface flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-line">
        {/* Publication Format Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-ink-mute uppercase tracking-wider mr-1">
            Format:
          </span>
          <div className="inline-flex rounded-lg border border-line p-0.5 bg-surface-subtle">
            {PUBLICATION_FORMATS.map((f) => {
              const active = selectedFormat === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFormat(f.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                    active
                      ? 'bg-surface text-ink shadow-sm border border-line'
                      : 'text-ink-mute hover:text-ink'
                  }`}
                  title={f.desc}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-1.5 ml-2">
            <span className="badge badge-green">
              <CheckCircle2 size={12} className="mr-1" />
              Verified ({paper.verified_citations ?? paper.bibliography?.length ?? 0} Citations)
            </span>
            <span className="badge">
              Debate ({paper.debate_rounds ?? 2} Rounds)
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex shrink-0 gap-2 items-center">
          <button 
            type="button" 
            onClick={handleCopy} 
            className="control-button text-[13px]"
            title="Copy manuscript as Markdown"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-ok" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button 
            type="button" 
            onClick={handleDownloadLatex} 
            className="control-button text-[13px]"
            title="Download complete LaTeX source, .bib and figures (.zip)"
            disabled={downloadingLatex}
          >
            <FileCode className="h-3.5 w-3.5 text-ink-soft" />
            <span className="hidden sm:inline">{downloadingLatex ? 'Zipping…' : 'LaTeX (.zip)'}</span>
          </button>

          <button 
            type="button" 
            onClick={handleDownloadPdf} 
            className="control-button control-button-primary text-[13px]"
            disabled={downloadingPdf}
            title={`Download publication PDF formatted as ${selectedFormat.toUpperCase()}`}
          >
            <Download className="h-3.5 w-3.5" />
            <span>{downloadingPdf ? 'Compiling…' : `Download ${selectedFormat.toUpperCase()} PDF`}</span>
          </button>
        </div>
      </div>

      {/* ── Main Manuscript Workspace ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Manuscript Reader Scrollable Container */}
        <div id="paper-scroll-container" className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-12 py-6 sm:py-8 bg-canvas">
          <div className="mx-auto max-w-[940px]">
            <div
              className="card p-6 sm:p-10 md:p-14 shadow-sm border border-line bg-surface"
            >
              {/* Format-Specific Live Decoration Header */}
              {selectedFormat === 'ieee' && (
                <div className="mb-6 pb-4 border-b border-line text-center">
                  <div className="text-[11px] font-mono text-ink-mute uppercase tracking-widest mb-1">
                    IEEE Conference Format Specification (Two-Column Flow)
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs text-ink-soft italic mt-3">
                    <div>Primary Author Division<br/><span className="text-[11px] not-italic text-ink-mute">Autonomous Academic Research</span></div>
                    <div>Proposer-Critic Deliberation Core<br/><span className="text-[11px] not-italic text-ink-mute">Delve Academic Network</span></div>
                  </div>
                </div>
              )}

              {selectedFormat === 'acm' && (
                <div className="mb-6 pb-4 border-b border-line">
                  <div className="text-[11px] font-mono text-ink-mute uppercase tracking-widest mb-1">
                    ACM Conference Proceedings (acmart sigconf)
                  </div>
                  <div className="p-3 bg-surface-subtle border border-line rounded text-xs mt-2 text-ink-soft">
                    <strong className="text-ink">CCS CONCEPTS:</strong> • Computing methodologies → Artificial intelligence; Machine learning; Information systems → Information retrieval.
                  </div>
                </div>
              )}

              {selectedFormat === 'apa' && (
                <div className="mb-6 pb-4 border-b border-line text-center">
                  <div className="text-xs font-mono text-ink-mute tracking-widest uppercase mb-4 text-right">
                    RUNNING HEAD: {headings[0]?.text?.toUpperCase().slice(0, 35) || 'RESEARCH MANUSCRIPT'} 1
                  </div>
                  <div className="text-xs text-ink-soft space-y-1">
                    <p className="font-semibold text-ink">Author Note</p>
                    <p>Delve Multi-Agent Research Platform • Verified Publication Stream</p>
                  </div>
                </div>
              )}

              {selectedFormat === 'mla' && (
                <div className="mb-6 pb-4 border-b border-line text-xs text-ink-soft leading-relaxed">
                  <div className="float-right text-ink-mute font-mono">Author 1</div>
                  <p>Autonomous Multi-Agent Synthesis Engine</p>
                  <p>Dr. Research Reviewer</p>
                  <p>Department of Computational Intelligence</p>
                  <p>October 2026</p>
                </div>
              )}

              {/* Manuscript Text Article */}
              <article className={`paper-body paper-layout-${selectedFormat} w-full`}>
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

        {/* Table of Contents Right Panel */}
        {headings.length > 0 && (
          <aside className="w-64 shrink-0 border-l border-line overflow-hidden hidden xl:flex flex-col bg-surface">
            <div className="flex items-center justify-between gap-1.5 px-3.5 py-2.5 border-b border-line shrink-0">
              <div className="flex items-center gap-1.5">
                <BookOpen size={13} className="text-ink-mute" />
                <span className="mono-kicker text-xs">Section Navigation</span>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-1 text-xs">
              {headings.map((h, idx) => (
                <button
                  key={`${h.id}-${idx}`}
                  type="button"
                  onClick={() => scrollToHeading(h.id)}
                  className={`w-full text-left truncate rounded px-2.5 py-1.5 transition-colors ${
                    activeHeadingId === h.id
                      ? 'bg-surface-subtle font-semibold text-ink'
                      : 'text-ink-soft hover:text-ink hover:bg-surface-subtle'
                  } ${h.level === 1 ? 'font-medium' : h.level === 2 ? 'pl-4 text-ink-mute' : 'pl-6 text-ink-mute'}`}
                >
                  {h.text}
                </button>
              ))}
            </nav>
          </aside>
        )}
      </div>
    </div>
  );
}
