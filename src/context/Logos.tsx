export const PayMeLogo = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <div className="w-12 h-12 bg-[#FFCC99] rounded-xl flex items-center justify-center shrink-0">
      <div className="w-[80%] h-[80%] bg-white rounded-lg flex items-center justify-center">
        <div className="w-[60%] h-[60%] bg-[#E8620A] rounded-md" />
      </div>
    </div>
    <div className="flex flex-col">
      <span className="font-black text-2xl tracking-tighter text-[#1A1A1A] leading-none">PAY-ME</span>
      <span className="text-[8px] font-bold text-gray-400 tracking-[0.2em] uppercase">BY ORANGE BANK</span>
      <div className="h-1 w-full bg-[#E8620A] mt-1 rounded-full"></div>
    </div>
  </div>
);

