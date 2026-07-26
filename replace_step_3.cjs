const fs = require('fs');
let code = fs.readFileSync('src/pages/public/BookingFlow.tsx', 'utf8');

const targetStep3 = `<div className="flex items-center mb-6">
                <button onClick={() => setStep(2)} className="mr-4 p-2 -ml-2 rounded-full hover:bg-neutral-800 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold">Quando você quer vir?</h2>
              </div>
              
              {/* Simple Date Picker Scroll */}
              <div className="flex overflow-x-auto pb-4 mb-6 gap-3 snap-x scrollbar-hide">
                {Array.from({ length: 14 }).map((_, i) => {
                  const date = addDays(startOfToday(), i);
                  const isSelected = selectedDate.getTime() === date.getTime();
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(date)}
                      className={\`snap-start shrink-0 w-20 py-3 rounded-xl border flex flex-col items-center justify-center transition-colors \${isSelected ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-neutral-800 hover:border-orange-300 hover:border-neutral-700 bg-neutral-900/50'}\`}
                    >
                      <span className="text-xs uppercase font-medium mb-1">{format(date, 'EEE', { locale: ptBR })}</span>
                      <span className="text-xl font-bold">{format(date, 'dd')}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mb-4">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-500" /> Horários Disponíveis
                </h3>
                
                {loadingSlots ? (
                  <div className="text-center py-8 text-neutral-500">Buscando horários...</div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-8 bg-[#111] rounded-xl border border-neutral-800">
                    <p className="text-neutral-500">Nenhum horário disponível neste dia.</p>
                    <p className="text-sm mt-1 text-neutral-400">Tente selecionar outra data ou profissional.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {availableSlots.map((slot, i) => {
                      const isSelected = selectedSlot?.getTime() === slot.getTime();
                      return (
                        <button
                          key={i}
                          onClick={() => { setSelectedSlot(slot); setStep(4); }}
                          className={\`py-3 rounded-xl font-medium transition-colors border \${isSelected ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20' : 'border-neutral-800 hover:border-orange-500 bg-neutral-900/50'}\`}
                        >
                          {format(slot, 'HH:mm')}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>`;

const newStep3 = `<div className="flex items-center mb-6">
                <button onClick={() => setStep(2)} className="mr-4 p-2 -ml-2 rounded-full hover:bg-neutral-800 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold">Quando você quer vir?</h2>
              </div>
              
              <MonthCalendar 
                 currentMonth={currentMonth} 
                 setCurrentMonth={setCurrentMonth} 
                 selectedDate={selectedDate} 
                 setSelectedDate={setSelectedDate} 
                 monthAvailability={monthAvailability}
              />
              
              <div className="mb-4">
                 {(() => {
                    const dateStr = format(selectedDate, 'yyyy-MM-dd');
                    const availability = monthAvailability[dateStr];
                    
                    if (!availability) {
                       return <div className="text-center py-8 text-neutral-500">Buscando disponibilidade...</div>;
                    }
                    
                    if (availability.status === 'available') {
                       return (
                          <>
                             <h3 className="font-bold mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-orange-500" /> {availability.slots.length} Horários Disponíveis
                             </h3>
                             <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                               {availability.slots.map((slot, i) => {
                                 const isSelected = selectedSlot?.getTime() === slot.getTime();
                                 return (
                                   <button
                                     key={i}
                                     onClick={() => { setSelectedSlot(slot); setStep(4); }}
                                     className={\`py-3 rounded-xl font-medium transition-colors border \${isSelected ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20' : 'border-neutral-800 hover:border-orange-500 bg-neutral-900/50'}\`}
                                   >
                                     {format(slot, 'HH:mm')}
                                   </button>
                                 );
                               })}
                             </div>
                          </>
                       );
                    }
                    
                    // Un-available day selected
                    let message = "Sem horários disponíveis.";
                    if (availability.status === 'fully_booked') message = "Todos os horários deste dia já foram reservados.";
                    else if (availability.status === 'barber_day_off') message = "Este profissional não atende neste dia.";
                    else if (availability.status === 'outside_working_schedule') message = "A barbearia não funciona nesta data.";
                    else if (availability.status === 'blocked') message = "Esta data está indisponível para agendamentos.";
                    else if (availability.status === 'past') message = "Esta data já passou.";
                    else if (availability.status === 'outside_booking_range') message = "Os agendamentos estão disponíveis somente até 31 de dezembro de 2026.";
                    
                    return (
                       <div className="text-center py-8 bg-[#111] rounded-xl border border-neutral-800 px-4">
                          <p className="text-neutral-300 font-bold mb-2">{message}</p>
                          <p className="text-sm mt-1 text-neutral-400 mb-6 max-w-sm mx-auto">Escolha outra data ou entre na lista de encaixe para receber um aviso caso surja uma vaga.</p>
                          
                          <div className="flex flex-col gap-3 max-w-xs mx-auto">
                             <button onClick={() => {
                                const { parseISO } = require('date-fns');
                                const sortedDates = Object.keys(monthAvailability).sort();
                                const nextAvail = sortedDates.find(d => d > dateStr && monthAvailability[d].status === 'available');
                                if (nextAvail) {
                                   const dateToSet = new Date(nextAvail + 'T12:00:00');
                                   setSelectedDate(dateToSet);
                                   const newMonth = startOfMonth(dateToSet);
                                   if (!isSameMonth(currentMonth, newMonth)) {
                                      setCurrentMonth(newMonth);
                                   }
                                }
                             }} className="w-full bg-neutral-800 hover:bg-neutral-700 text-white py-3 rounded-xl font-medium transition-colors border border-neutral-700 hidden">
                                Procurar próxima data
                             </button>
                             
                             <button onClick={() => setShowWaitlistForm(true)} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-medium transition-colors shadow-lg shadow-orange-500/20">
                                Entrar na lista de encaixe
                             </button>
                          </div>
                       </div>
                    );
                 })()}
              </div>`;

code = code.split(targetStep3).join(newStep3);
fs.writeFileSync('src/pages/public/BookingFlow.tsx', code);
