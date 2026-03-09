'use client';

interface InfoTipProps {
  text: string;
}

export function InfoTip({ text }: InfoTipProps) {
  return (
    <div className="absolute top-1 right-1 group z-10">
      <div className="w-3.5 h-3.5 rounded-full bg-zinc-700/80 flex items-center justify-center cursor-help text-[8px] font-bold text-zinc-400 group-hover:bg-zinc-600 group-hover:text-zinc-200 transition-colors">
        !
      </div>
      <div className="hidden group-hover:block absolute right-0 top-5 w-52 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-[10px] text-zinc-300 leading-relaxed shadow-xl">
        {text}
      </div>
    </div>
  );
}
