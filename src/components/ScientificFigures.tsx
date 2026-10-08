import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Layers, Sparkles, Activity, CheckCircle2 } from 'lucide-react';

interface FigureProps {
  topic?: string;
}

export const Figure1Architecture: React.FC<FigureProps> = ({ topic }) => {
  const isMed = /medical|segmentation|vision|image|tumor|organ/i.test(topic || '');

  return (
    <figure className="my-8 rounded-xl border border-line bg-surface/70 p-5 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-line text-xs">
        <span className="font-semibold text-ink flex items-center gap-1.5">
          <Layers size={14} className="text-blue" />
          Figure 1: End-to-End Architectural Pipeline & Feature Integration
        </span>
        <span className="badge badge-blue text-[10px]">Methodology Flow</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center text-xs">
        {/* Step 1: Input */}
        <div className="rounded-lg border border-line bg-surface p-3 flex flex-col items-center text-center shadow-2xs">
          <div className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-1.5">
            <Cpu size={16} />
          </div>
          <span className="font-semibold text-ink text-[11px] mb-0.5">Input Modality</span>
          <span className="text-[10px] text-ink-mute font-mono">
            {isMed ? 'X ∈ ℝ^(H×W×C)\n(CT / MRI)' : 'Domain Input X\nRaw High-Res Stream'}
          </span>
        </div>

        {/* Step 2: Dual Branch */}
        <div className="flex flex-col gap-2">
          <div className="rounded-lg border border-blue/30 bg-blue/5 p-2 text-center shadow-2xs">
            <span className="font-semibold text-blue text-[11px] block">Local CNN Branch</span>
            <span className="text-[9.5px] text-ink-mute">Dynamic Deformable Conv (DDConv)</span>
          </div>
          <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-2 text-center shadow-2xs">
            <span className="font-semibold text-purple-600 dark:text-purple-400 text-[11px] block">Global Context ViT/SSM</span>
            <span className="text-[9.5px] text-ink-mute">Shifted-Window Attention / Mamba SSM</span>
          </div>
        </div>

        {/* Step 3: Adaptive Fusion */}
        <div className="rounded-lg border border-teal-500/30 bg-teal-500/5 p-3 flex flex-col items-center text-center shadow-2xs">
          <div className="p-1.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 mb-1.5">
            <Sparkles size={16} />
          </div>
          <span className="font-semibold text-teal-700 dark:text-teal-300 text-[11px] mb-0.5">Adaptive Fusion Block</span>
          <span className="text-[9.5px] text-ink-mute">
            Φ(f_CNN, f_ViT) • 2D DCT Frequency Refinement
          </span>
        </div>

        {/* Step 4: Progressive Decoder */}
        <div className="rounded-lg border border-line bg-surface p-3 flex flex-col items-center text-center shadow-2xs">
          <div className="p-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 mb-1.5">
            <Layers size={16} />
          </div>
          <span className="font-semibold text-ink text-[11px] mb-0.5">Progressive Decoder</span>
          <span className="text-[9.5px] text-ink-mute">
            Multi-Scale Upsampling & Boundary Alignment
          </span>
        </div>

        {/* Step 5: Output Mask */}
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 flex flex-col items-center text-center shadow-2xs">
          <div className="p-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 mb-1.5">
            <CheckCircle2 size={16} />
          </div>
          <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-[11px] mb-0.5">Output Mask</span>
          <span className="text-[10px] text-ink-mute font-mono">
            {isMed ? 'S ∈ {0,1}^(H×W)\nDSC / HD95 Loss' : 'Prediction Map\nOptimized Verification'}
          </span>
        </div>
      </div>

      <figcaption className="mt-3 pt-2 border-t border-line text-[11px] text-ink-mute italic text-center">
        Figure 1: Architectural framework of hybrid vision transformer and convolutional networks with multi-scale feature integration.
      </figcaption>
    </figure>
  );
};

export const Figure2Tradeoff: React.FC = () => {
  const models = [
    { name: 'CVMH-UNet [1]', cat: 'Mamba SSM', dsc: 90.2, lat: 14.8, params: 28, color: 'bg-teal-500' },
    { name: 'CiT-Net [5]', cat: 'Hybrid CNN-ViT', dsc: 89.4, lat: 24.5, params: 42, color: 'bg-blue' },
    { name: 'GMSA [6]', cat: 'Grouped ViT', dsc: 88.9, lat: 28.2, params: 38, color: 'bg-amber-500' },
    { name: 'MCPA [3]', cat: 'Multi-Scale ViT', dsc: 88.7, lat: 42.1, params: 55, color: 'bg-purple-500' },
    { name: 'Lgenet [4]', cat: 'External-Corr ViT', dsc: 91.1, lat: 68.4, params: 96, color: 'bg-rose-500' },
  ];

  return (
    <figure className="my-8 rounded-xl border border-line bg-surface/70 p-5 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-line text-xs">
        <span className="font-semibold text-ink flex items-center gap-1.5">
          <Activity size={14} className="text-amber-500" />
          Figure 2: Empirical Pareto Frontier — Accuracy vs. Edge Latency Trade-off
        </span>
        <span className="badge badge-amber text-[10px]">Clinical Benchmark</span>
      </div>

      <div className="space-y-3">
        {models.map((m) => {
          const isRealTime = m.lat <= 33.3;
          return (
            <div key={m.name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg border border-line bg-surface hover:border-line-hard transition-colors">
              <div className="flex items-center gap-2.5 min-w-[170px]">
                <div className={`h-2.5 w-2.5 rounded-full ${m.color}`} />
                <div>
                  <span className="font-bold text-ink text-xs block">{m.name}</span>
                  <span className="text-[10px] text-ink-mute">{m.cat} • {m.params}M params</span>
                </div>
              </div>

              {/* Visual Bars */}
              <div className="flex-1 grid grid-cols-2 gap-3 max-w-md">
                {/* Accuracy */}
                <div>
                  <div className="flex justify-between text-[10.5px] mb-1 font-medium text-ink-soft">
                    <span>DSC Score</span>
                    <span className="font-bold text-ink">{m.dsc}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${(m.dsc - 80) * 8}%` }} 
                      transition={{ duration: 0.6 }}
                      className={`h-full ${m.color}`} 
                    />
                  </div>
                </div>

                {/* Latency */}
                <div>
                  <div className="flex justify-between text-[10.5px] mb-1 font-medium text-ink-soft">
                    <span>Edge Latency</span>
                    <span className={`font-bold ${isRealTime ? 'text-ok' : 'text-err'}`}>{m.lat} ms</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${Math.min(100, (m.lat / 70) * 100)}%` }} 
                      transition={{ duration: 0.6 }}
                      className={`h-full ${isRealTime ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                    />
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="shrink-0 text-right">
                {isRealTime ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    ✓ Real-time (&lt;33ms)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                    Offline Diagnostic
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <figcaption className="mt-4 pt-2.5 border-t border-line text-[11px] text-ink-mute italic text-center">
        Figure 2: Empirical trade-off between segmentation accuracy (DSC %) and real-time edge inference latency across representative paradigms. The 33.3ms threshold marks the clinical 30 FPS boundary.
      </figcaption>
    </figure>
  );
};
