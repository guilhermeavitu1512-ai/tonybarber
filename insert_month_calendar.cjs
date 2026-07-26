const fs = require('fs');
let code = fs.readFileSync('src/pages/public/BookingFlow.tsx', 'utf8');

const targetImport = `import { format, addDays, startOfToday`;
const beforeComponent = `
function MonthCalendar({ currentMonth, setCurrentMonth, selectedDate, setSelectedDate, monthAvailability }: any) {
  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });
  const startDayOfWeek = getDay(start); 
  
  const BOOKING_MAX_DATE = new Date("2026-12-31T23:59:59-03:00");
  const canGoNext = isBefore(currentMonth, startOfMonth(BOOKING_MAX_DATE));
  const canGoPrev = isAfter(currentMonth, startOfMonth(startOfToday()));
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={() => canGoPrev && setCurrentMonth(subMonths(currentMonth, 1))} 
          disabled={!canGoPrev}
          className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 disabled:opacity-30"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="font-bold text-lg capitalize">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</div>
        <button 
          onClick={() => canGoNext && setCurrentMonth(addMonths(currentMonth, 1))} 
          disabled={!canGoNext}
          className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 disabled:opacity-30"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-neutral-500 mb-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <div key={d}>{d}</div>)}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDayOfWeek }).map((_, i) => <div key={'empty-'+i} />)}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isSelected = isSameDay(day, selectedDate);
          const availability = monthAvailability[dateStr];
          
          let className = "p-2 rounded-xl flex flex-col items-center justify-center h-12 text-sm transition-colors border outline-none ";
          
          if (!availability) {
            className += "opacity-50 cursor-not-allowed border-transparent";
            return <div key={dateStr} className={className}>{format(day, 'd')}</div>;
          }
          
          if (availability.status === 'available') {
            className += "cursor-pointer hover:border-orange-500 ";
            if (isSelected) {
               className += "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20";
            } else {
               className += "bg-neutral-900 border-neutral-800";
            }
          } else {
            // Un-available day
            className += "opacity-[0.35] cursor-pointer border-transparent hover:bg-neutral-800 ";
            if (isSelected) {
               className += " border-neutral-600 bg-neutral-800";
            }
          }
          
          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(day)}
              className={className}
              aria-disabled={availability.status !== 'available'}
              aria-label={availability.status === 'available' ? 'Data disponível' : 'Data indisponível'}
            >
              <span className="font-medium">{format(day, 'd')}</span>
              {availability.status === 'available' && <div className="w-1 h-1 rounded-full bg-orange-500 mt-1 absolute bottom-1"></div>}
            </button>
          );
        })}
      </div>
      
      <div className="flex gap-4 mt-6 text-xs text-neutral-400 justify-center flex-wrap bg-neutral-900/50 p-3 rounded-xl border border-neutral-800">
         <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div> Disponível</div>
         <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm border border-neutral-600 bg-neutral-800 opacity-50"></div> Indisponível</div>
      </div>
    </div>
  );
}

export default function BookingFlow() {
`;

code = code.replace(`export default function BookingFlow() {`, beforeComponent);
fs.writeFileSync('src/pages/public/BookingFlow.tsx', code);
