import { CalendarView } from '@/components/calendar-view';
import { Chatbot } from '@/components/chatbot';
import { ScheduleProvider } from '@/providers/schedule-provider';

export default function Home() {
  return (
    <ScheduleProvider>
      <main className="grid h-screen w-full grid-cols-1 md:grid-cols-3 xl:grid-cols-4">
        <div className="col-span-1 md:col-span-2 xl:col-span-3 h-full overflow-y-auto">
          <CalendarView />
        </div>
        <aside className="col-span-1 flex h-full flex-col border-l border-border bg-muted/20">
          <Chatbot />
        </aside>
      </main>
    </ScheduleProvider>
  );
}
