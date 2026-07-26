import { addMinutes, isBefore, parseISO, isSameDay, format, startOfDay, endOfDay, isAfter, areIntervalsOverlapping, addHours } from 'date-fns';
import { Appointment, Barber, Block, Service, WeeklySchedule } from '../types';

export const MIN_ADVANCE_MINUTES = 60; // 1 hour advance booking required
export const CANCEL_WINDOW_HOURS = 24; // 24 hours required to cancel

/**
 * Parses time string (HH:MM) and sets it to the given date
 */
export function setTimeOnDate(date: Date, timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
}

/**
 * Checks if a given time slot is available for a barber
 */
export function isSlotAvailable(
  startTime: Date,
  endTime: Date,
  barber: Barber,
  appointments: Appointment[],
  blocks: Block[],
  now: Date = new Date()
): boolean {
  // 1. Check if it's in the past or before minimum advance time
  const minBookingTime = addMinutes(now, MIN_ADVANCE_MINUTES);
  if (isBefore(startTime, minBookingTime)) {
    return false;
  }

  // 2. Check if it's within barber's working hours for that day of the week
  const dayOfWeek = startTime.getDay();
  const daySchedule = barber.schedule[dayOfWeek];
  
  if (!daySchedule || !daySchedule.isOpen) {
    return false;
  }

  const shiftStart = setTimeOnDate(startTime, daySchedule.openTime);
  const shiftEnd = setTimeOnDate(startTime, daySchedule.closeTime);

  if (isBefore(startTime, shiftStart) || isAfter(endTime, shiftEnd)) {
    return false;
  }

  // 2b. Check for lunch break (13:00 to 14:00)
  const lunchStart = setTimeOnDate(startTime, "13:00");
  const lunchEnd = setTimeOnDate(startTime, "14:00");

  if (
    areIntervalsOverlapping(
      { start: startTime, end: endTime },
      { start: lunchStart, end: lunchEnd },
      { inclusive: false }
    )
  ) {
    return false;
  }

  // 3. Check for overlapping appointments
  const hasAppointmentOverlap = appointments.some(app => {
    if (app.status === 'cancelled') return false;
    
    const appStart = parseISO(app.startTime);
    const appEnd = parseISO(app.endTime);
    
    // Using areIntervalsOverlapping: {start, end} overlaps with {start, end}?
    // Exclusive means if one ends exactly when another starts, it's not an overlap.
    return areIntervalsOverlapping(
      { start: startTime, end: endTime },
      { start: appStart, end: appEnd },
      { inclusive: false }
    );
  });

  if (hasAppointmentOverlap) return false;

  // 4. Check for overlapping manual blocks
  const hasBlockOverlap = blocks.some(block => {
    const blockStart = parseISO(block.startTime);
    const blockEnd = parseISO(block.endTime);
    
    return areIntervalsOverlapping(
      { start: startTime, end: endTime },
      { start: blockStart, end: blockEnd },
      { inclusive: false }
    );
  });

  if (hasBlockOverlap) return false;

  return true;
}

/**
 * Generates available 60-minute slots for a given day and service
 */
export function generateAvailableSlots(
  date: Date,
  barber: Barber,
  service: Service,
  appointments: Appointment[],
  blocks: Block[],
  now: Date = new Date()
): Date[] {
  const availableSlots: Date[] = [];
  const dayOfWeek = date.getDay();
  const daySchedule = barber.schedule[dayOfWeek];

  if (!daySchedule || !daySchedule.isOpen) {
    return []; // Barber not working today
  }

  const shiftStart = setTimeOnDate(date, daySchedule.openTime);
  const shiftEnd = setTimeOnDate(date, daySchedule.closeTime);
  
  // Start checking from shift start
  let currentSlot = shiftStart;
  
  while (isBefore(currentSlot, shiftEnd)) {
    // For services longer than 60 mins, we ceil to next hour slot if it's over e.g. 80 mins
    // Since it's fixed hourly slots, the service blocks X hours
    // The prompt says: "serviço de 2h ... todos os horários cheios que ele ocupa devem desaparecer juntos"
    // Duration is in minutes. If it's 80 minutes, it will span 2 hourly slots (80 > 60).
    const durationHours = Math.ceil(service.durationMinutes / 60);
    const requiredMinutes = durationHours * 60;
    const slotEnd = addMinutes(currentSlot, requiredMinutes);
    
    // Check if slot + service duration fits within shift and isn't overlapping
    if (
      !isAfter(slotEnd, shiftEnd) &&
      isSlotAvailable(currentSlot, slotEnd, barber, appointments, blocks, now)
    ) {
      // Check if it's exactly on the hour
      if (currentSlot.getMinutes() === 0) {
        availableSlots.push(currentSlot);
      }
    }
    
    // Increment by 60 minutes for the next potential slot
    currentSlot = addMinutes(currentSlot, 60);
  }

  return availableSlots;
}

/**
 * Determines if an appointment can be cancelled based on the policy
 */
export function canCancelAppointment(appointment: Appointment, now: Date = new Date()): boolean {
  if (appointment.status === 'cancelled' || appointment.status === 'completed') {
    return false;
  }
  
  const startTime = parseISO(appointment.startTime);
  const cancelDeadline = addHours(now, CANCEL_WINDOW_HOURS);
  
  // You can only cancel if the start time is strictly after the cancel deadline
  // e.g. if cancel window is 24h, you can only cancel if appointment is > 24h away
  return isAfter(startTime, cancelDeadline);
}
