import { Component, computed, EventEmitter, Input, OnChanges, Output, signal } from '@angular/core';

interface CalendarDay {
  date: Date;
  inCurrentMonth: boolean;
}

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.html',
  styleUrl: './calendar.css'
})
export class CalendarComponent implements OnChanges {
  @Input() selectedDate!: string;
  @Input() datesWithEntries: Set<string> = new Set();
  @Output() daySelected = new EventEmitter<string>();

  viewMonth = signal(new Date().getMonth());
  viewYear = signal(new Date().getFullYear());

  readonly WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  readonly MONTHS = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

  calendarDays = computed<CalendarDay[]>(() => {
    const month = this.viewMonth();
    const year = this.viewYear();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay(); // 0=Sun
    const start = new Date(year, month, 1 - startOffset);

    const days: CalendarDay[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push({ date: d, inCurrentMonth: d.getMonth() === month });
    }
    return days;
  });

  monthLabel = computed(() => `${this.MONTHS[this.viewMonth()]} ${this.viewYear()}`);

  ngOnChanges(): void {
    // When selectedDate changes externally, sync the view to show that month
    if (this.selectedDate) {
      const d = new Date(this.selectedDate);
      this.viewMonth.set(d.getMonth());
      this.viewYear.set(d.getFullYear());
    }
  }

  prevMonth(): void {
    if (this.viewMonth() === 0) {
      this.viewMonth.set(11);
      this.viewYear.update(y => y - 1);
    } else {
      this.viewMonth.update(m => m - 1);
    }
  }

  nextMonth(): void {
    if (this.viewMonth() === 11) {
      this.viewMonth.set(0);
      this.viewYear.update(y => y + 1);
    } else {
      this.viewMonth.update(m => m + 1);
    }
  }

  isSelected(day: CalendarDay): boolean {
    return day.date.toDateString() === new Date(this.selectedDate).toDateString();
  }

  hasEntries(day: CalendarDay): boolean {
    return this.datesWithEntries.has(day.date.toDateString());
  }

  selectDay(day: CalendarDay): void {
    this.daySelected.emit(day.date.toISOString());
  }
}
