"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import { IEvent } from "@/@core/domain";

export function Calendar({ eventsList }: { eventsList: IEvent[] }) {
  return (
    <div>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="pt-br"
        height={500}
        dayHeaderClassNames="bg-[var(--color-surface-elevated)] text-[var(--color-text)]"
        dayCellClassNames="text-sm"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        allDayText="Dia Inteiro"
        buttonText={{
          today: "Hoje",
          month: "Mês",
          week: "Semana",
          day: "Dia",
        }}
        events={eventsList}
        editable={true}
      />
    </div>
  );
}
