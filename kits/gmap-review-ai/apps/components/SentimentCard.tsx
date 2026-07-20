// app/components/SentimentCard.tsx
export default function SentimentCard({ rating, total }: any) {
  return (
    <div className="bg-white/[0.02] border border-white/5 p-12 rounded-[3rem] flex flex-col justify-center items-center text-center">
      <span className="text-teal-400 font-mono tracking-[0.4em] uppercase text-[10px] mb-6">Market Sentiment</span>
      <div className="text-[10rem] font-black italic leading-none tracking-tighter text-white">
        {rating || '0.0'}
      </div>
      <div className="mt-4 text-white/30 font-medium uppercase tracking-widest text-[10px]">
        Based on {total} live reviews
      </div>
    </div>
  );
}