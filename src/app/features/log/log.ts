import { Component, inject, signal } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { TaskLogService } from '../../core/services/task-log.service';
import { TaskTypeService } from '../../core/services/task-type.service';
import { TaskLogEntry } from '../../core/models/task-log-entry.model';
import { CalendarComponent } from './components/calendar/calendar';
import { TaskLogListComponent } from './components/task-log-list/task-log-list';
import { AddTaskDialogComponent, AddTaskDialogData, AddTaskDialogResult } from './components/add-task-dialog/add-task-dialog';

@Component({
  selector: 'app-log',
  imports: [CalendarComponent, TaskLogListComponent],
  templateUrl: './log.html',
  styleUrl: './log.css'
})
export class LogComponent {
  private dialog = inject(Dialog);
  taskLogService = inject(TaskLogService);
  taskTypeService = inject(TaskTypeService);

  selectedDate = signal(new Date().toISOString());
  entriesForSelectedDate = this.taskLogService.entriesForDate(this.selectedDate);

  onDaySelected(isoDate: string): void {
    this.selectedDate.set(isoDate);
  }

  openAddTaskDialog(): void {
    const ref = this.dialog.open<AddTaskDialogResult, AddTaskDialogData>(AddTaskDialogComponent, {
      data: {
        taskTypes: this.taskTypeService.taskTypes(),
        selectedDate: this.selectedDate()
      }
    });

    ref.closed.subscribe(result => {
      if (result) {
        this.taskLogService.addEntry(result);
      }
    });
  }

  openEditDialog(entry: TaskLogEntry): void {
    const ref = this.dialog.open<AddTaskDialogResult, AddTaskDialogData>(AddTaskDialogComponent, {
      data: {
        taskTypes: this.taskTypeService.taskTypes(),
        selectedDate: entry.date,
        editEntry: entry
      }
    });

    ref.closed.subscribe(result => {
      if (result) {
        this.taskLogService.updateEntry({ ...result, id: entry.id, date: entry.date });
      }
    });
  }

  deleteEntry(id: string): void {
    if (confirm('Delete this log entry? This cannot be undone.')) {
      this.taskLogService.deleteEntry(id);
    }
  }

  get selectedDateLabel(): string {
    return new Date(this.selectedDate()).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
  }
}
