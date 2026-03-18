import { Injectable, Signal, computed, signal } from '@angular/core';
import { TaskLogEntry } from '../models/task-log-entry.model';
import { StorageService } from './storage.service';

const STORAGE_KEY = 'getrddone_task_log_entries';

function isSameDay(isoA: string, isoB: string): boolean {
  return new Date(isoA).toDateString() === new Date(isoB).toDateString();
}

@Injectable({ providedIn: 'root' })
export class TaskLogService {
  private _entries = signal<TaskLogEntry[]>([]);
  readonly entries = this._entries.asReadonly();

  readonly datesWithEntries = computed(() =>
    new Set(this._entries().map(e => new Date(e.date).toDateString()))
  );

  constructor(private storage: StorageService) {
    const saved = this.storage.get<TaskLogEntry[]>(STORAGE_KEY);
    if (saved) this._entries.set(saved);
  }

  entriesForDate(dateSignal: Signal<string>): Signal<TaskLogEntry[]> {
    return computed(() =>
      this._entries().filter(e => isSameDay(e.date, dateSignal()))
    );
  }

  entriesInRange(fromDate: string, toDate: string): TaskLogEntry[] {
    const from = new Date(fromDate + 'T00:00:00');
    const to = new Date(toDate + 'T23:59:59.999');
    return this._entries().filter(e => {
      const d = new Date(e.date);
      return d >= from && d <= to;
    });
  }

  addEntry(entry: Omit<TaskLogEntry, 'id'>): void {
    const newEntry: TaskLogEntry = { ...entry, id: crypto.randomUUID() };
    this._entries.update(entries => [...entries, newEntry]);
    this.persist();
  }

  updateEntry(updated: TaskLogEntry): void {
    this._entries.update(entries => entries.map(e => e.id === updated.id ? updated : e));
    this.persist();
  }

  deleteEntry(id: string): void {
    this._entries.update(entries => entries.filter(e => e.id !== id));
    this.persist();
  }

  private persist(): void {
    this.storage.set(STORAGE_KEY, this._entries());
  }
}
