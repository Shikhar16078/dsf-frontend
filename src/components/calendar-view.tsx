'use client';

import { addDays, format, startOfWeek, subDays, eachDayOfInterval, getDay, parse } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Download, MoreVertical, Edit, Trash2 } from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSchedule } from '@/providers/schedule-provider';
import type { ScheduleEvent } from '@/types';

import { EventForm } from './event-form';
import { exportScheduleToIcs } from '@/lib/schedule';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const { events, removeEvent } = useSchedule();

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6),
  });

  const handleNextWeek = () => {
    setCurrentDate(addDays(currentDate, 7));
  };

  const handlePrevWeek = () => {
    setCurrentDate(subDays(currentDate, 7));
  };

  const handleEditEvent = (event: ScheduleEvent) => {
    setSelectedEvent(event);
    setFormOpen(true);
  };
  
  const handleAddNewEvent = () => {
    setSelectedEvent(null);
    setFormOpen(true);
  };

  const handleExport = () => {
    exportScheduleToIcs(events, weekStart);
  };
  
  const EventComponent = ({ event }: { event: ScheduleEvent }) => {
    const start = parse(event.startTime, 'HH:mm', new Date());
    const end = parse(event.endTime, 'HH:mm', new Date());

    const top = (start.getHours() * 60 + start.getMinutes()) / (24 * 60) * 100;
    const height = ((end.getTime() - start.getTime()) / (1000 * 60)) / (24 * 60) * 100;
    
    return (
      <div
        className="absolute w-full p-1 group"
        style={{
          top: `${top}%`,
          height: `${height}%`,
        }}
      >
        <div className="relative z-10 flex h-full flex-col rounded-lg bg-primary/80 p-2 text-primary-foreground shadow-lg backdrop-blur-sm transition-all duration-200 ease-in-out group-hover:bg-primary">
          <div className="flex items-start justify-between">
            <p className="text-sm font-semibold">{event.title}</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => handleEditEvent(event)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => removeEvent(event.id)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-xs">
            {event.startTime} - {event.endTime}
          </p>
        </div>
      </div>
    );
  };


  return (
    <div className="flex h-full flex-col p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-bold text-foreground">
            {format(weekStart, 'MMMM yyyy')}
          </h2>
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
            <Button onClick={handleAddNewEvent}>
                <Plus className="mr-2 h-4 w-4" /> Add Event
            </Button>
            <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" /> Export
            </Button>
        </div>
      </header>
        
      <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent ? 'Edit Event' : 'Add New Event'}</DialogTitle>
          </DialogHeader>
          <EventForm
            event={selectedEvent}
            onFinished={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      <div className="flex-grow overflow-hidden">
        <Card className="h-full">
            <CardContent className="h-full overflow-auto p-0">
                <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_1fr_1fr] h-full">
                    {/* Time column */}
                    <div className="sticky left-0 bg-card z-20">
                        <div className="h-12 border-b"></div> {/* Header space */}
                        {hours.map(hour => (
                            <div key={hour} className="relative flex h-16 items-center justify-center border-b">
                                <span className="text-xs text-muted-foreground">{hour}</span>
                            </div>
                        ))}
                    </div>
                    {/* Day columns */}
                    {weekDays.map(day => {
                        const dayKey = format(day, 'eeee').toLowerCase();
                        const dayEvents = events.filter(e => e.day === dayKey);

                        return (
                            <div key={day.toString()} className="border-l">
                                <div className="sticky top-0 z-10 flex h-12 flex-col items-center justify-center border-b bg-card">
                                    <span className="font-medium">{format(day, 'EEE')}</span>
                                    <span className="text-sm text-muted-foreground">{format(day, 'd')}</span>
                                </div>
                                <div className="relative h-[calc(24*4rem)]">
                                    {hours.map(hour => (
                                        <div key={`${day.toString()}-${hour}`} className="h-16 border-b" />
                                    ))}
                                    {dayEvents.map(event => (
                                        <EventComponent key={event.id} event={event} />
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}