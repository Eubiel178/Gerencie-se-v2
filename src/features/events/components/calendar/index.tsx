"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import { IEvent } from "@/features/events/domain";

import styles from "./calendar.module.css";

export function Calendar({ eventsList }: { eventsList: IEvent[] }) {
  return (
    <div className={styles.wrapper}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="pt-br"
        height={500}
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
