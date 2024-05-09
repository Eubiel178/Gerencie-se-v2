"use client";

import { tv } from "tailwind-variants";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import { Wrapper } from "@/components";

import { IEvent } from "@/@core/domain";

const styles = tv({
  slots: {
    dayHeader: "bg-gray-600 text-white",
    dayCell: "text-sm",
  },
});

export function Calendar({ eventsList }: { eventsList: IEvent[] }) {
  const tv = styles();

  return (
    <Wrapper
      display="block"
      color="primary"
      background="light"
      shadow="small"
      padding="medium"
    >
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="pt-br"
        height={500}
        dayHeaderClassNames={tv.dayHeader()}
        dayCellClassNames={tv.dayCell()}
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
    </Wrapper>
  );
}
