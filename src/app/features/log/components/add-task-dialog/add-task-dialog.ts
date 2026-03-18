import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { TaskType } from '../../../../core/models/task-type.model';
import { TaskLogEntry } from '../../../../core/models/task-log-entry.model';

export interface AddTaskDialogData {
  taskTypes: TaskType[];
  selectedDate: string;
  editEntry?: TaskLogEntry;
}

export interface AddTaskDialogResult {
  id?: string;
  taskTypeId: string;
  increments: number;
  summary: string;
  date: string;
}

@Component({
  selector: 'app-add-task-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './add-task-dialog.html',
  styleUrl: './add-task-dialog.css'
})
export class AddTaskDialogComponent {
  dialogRef = inject<DialogRef<AddTaskDialogResult>>(DialogRef);
  data = inject<AddTaskDialogData>(DIALOG_DATA);
  private fb = inject(FormBuilder);

  isEditing = !!this.data.editEntry;

  form = this.fb.group({
    taskTypeId: [this.data.editEntry?.taskTypeId ?? '', Validators.required],
    increments: [this.data.editEntry?.increments ?? 1, [Validators.required, Validators.min(1), Validators.max(8)]],
    summary: [this.data.editEntry?.summary ?? '']
  });

  get formattedDate(): string {
    return new Date(this.data.selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  get durationLabel(): string {
    const n = this.form.value.increments ?? 1;
    const minutes = n * 25;
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}min`;
  }

  get taskTypeInvalid(): boolean {
    const ctrl = this.form.get('taskTypeId')!;
    return ctrl.invalid && ctrl.touched;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { taskTypeId, increments, summary } = this.form.value;
    this.dialogRef.close({
      id: this.data.editEntry?.id,
      taskTypeId: taskTypeId!,
      increments: increments!,
      summary: summary ?? '',
      date: this.data.selectedDate
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
