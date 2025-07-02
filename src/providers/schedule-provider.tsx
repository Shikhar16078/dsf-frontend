'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { loadScheduleFromLocal, saveScheduleToLocal } from '@/lib/schedule';
import type { ScheduleEvent } from '@/types';

interface ScheduleContextType {
  events: ScheduleEvent[];
  addEvent: (event: ScheduleEvent) => void;
  updateEvent: (event: ScheduleEvent) => void;
  removeEvent: (id: string) => void;
  addEventsFromSuggestion: (suggestion: string) => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setEvents(loadScheduleFromLocal());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveScheduleToLocal(events);
    }
  }, [events, isLoaded]);

  const addEvent = useCallback((event: ScheduleEvent) => {
    setEvents(prev => [...prev, event]);
    toast({ title: "Event Added", description: `"${event.title}" was added to your schedule.`});
  }, []);

  const updateEvent = useCallback((updatedEvent: ScheduleEvent) => {
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    toast({ title: "Event Updated", description: `"${updatedEvent.title}" was updated.`});
  }, []);

  const removeEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    toast({ title: "Event Removed", description: `An event was removed from your schedule.`});
  }, []);

  const addEventsFromSuggestion = useCallback((suggestion: string) => {
    const lines = suggestion.split('\n').filter(line => line.trim() !== '');
    const newEvents: ScheduleEvent[] = [];
    const dayMap: {[key: string]: string[]} = {
        'M': ['monday'], 'Tu': ['tuesday'], 'W': ['wednesday'], 'Th': ['thursday'], 'F': ['friday'],
        'MWF': ['monday', 'wednesday', 'friday'],
        'TTh': ['tuesday', 'thursday'],
    };

    lines.forEach(line => {
        const match = line.match(/^(.*): (\w+(?:,\w+)*) (\d{1,2}:\d{2}[ap]m) - (\d{1,2}:\d{2}[ap]m)$/);
        if (match) {
            const [, title, dayStr, startTimeStr, endTimeStr] = match;

            const formatTime = (time: string) => {
                let [hour, minutePart] = time.slice(0, -2).split(':');
                const period = time.slice(-2);
                let hourNum = parseInt(hour);
                if (period === 'pm' && hourNum < 12) hourNum += 12;
                if (period === 'am' && hourNum === 12) hourNum = 0;
                return `${String(hourNum).padStart(2, '0')}:${minutePart}`;
            };
            
            const days = dayMap[dayStr] || [dayStr.toLowerCase()];
            days.forEach(day => {
                newEvents.push({
                    id: `${Date.now()}-${title}-${day}`,
                    title: title.trim(),
                    day,
                    startTime: formatTime(startTimeStr),
                    endTime: formatTime(endTimeStr),
                });
            });
        }
    });

    if (newEvents.length > 0) {
        setEvents(prev => [...prev, ...newEvents]);
        toast({ title: "Schedule Updated", description: "AI suggestions have been added to your calendar." });
    } else {
        toast({ title: "Parsing Error", description: "Could not automatically parse the schedule suggestion.", variant: "destructive" });
    }
}, []);

  return (
    <ScheduleContext.Provider value={{ events, addEvent, updateEvent, removeEvent, addEventsFromSuggestion }}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
}
