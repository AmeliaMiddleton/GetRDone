import { Component, Input } from '@angular/core';
import { TaskLogEntry } from '../../../../core/models/task-log-entry.model';
import { TaskType } from '../../../../core/models/task-type.model';

@Component({
  selector: 'app-task-log-list',
  templateUrl: './task-log-list.html',
  styleUrl: './task-log-list.css'
})
export class TaskLogListComponent {
  @Input() entries: TaskLogEntry[] = [];
  @Input() taskTypes: TaskType[] = [];

  resolveType(taskTypeId: string): TaskType {
    return this.taskTypes.find(t => t.id === taskTypeId) ?? { id: '', name: 'Unknown Task', color: '#9ca3af' };
  }

  formatIncrements(n: number): string {
    const minutes = n * 25;
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}min`;
  }
}
