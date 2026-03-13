import { Injectable, signal } from '@angular/core';
import { TaskType } from '../models/task-type.model';
import { StorageService } from './storage.service';

const STORAGE_KEY = 'getrddone_task_types';

@Injectable({ providedIn: 'root' })
export class TaskTypeService {
  private _taskTypes = signal<TaskType[]>([]);
  readonly taskTypes = this._taskTypes.asReadonly();

  constructor(private storage: StorageService) {
    const saved = this.storage.get<TaskType[]>(STORAGE_KEY);
    if (saved) this._taskTypes.set(saved);
  }

  addTaskType(name: string, color: string): void {
    const newType: TaskType = { id: crypto.randomUUID(), name, color };
    this._taskTypes.update(types => [...types, newType]);
    this.persist();
  }

  deleteTaskType(id: string): void {
    this._taskTypes.update(types => types.filter(t => t.id !== id));
    this.persist();
  }

  private persist(): void {
    this.storage.set(STORAGE_KEY, this._taskTypes());
  }
}
