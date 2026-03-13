import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { TaskType } from '../../../../core/models/task-type.model';

export interface AddTaskDialogData {
  taskTypes: TaskType[];
  selectedDate: string;
}

export interface AddTaskDialogResult {
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

  form = this.fb.group({
    taskTypeId: [this.data.taskTypes[0]?.id ?? '', Validators.required],
    increments: [1, [Validators.required, Validators.min(1), Validators.max(8)]],
    summary: ['']
  });

  get formattedDate(): string {
    return new Date(this.data.selectedDate).toLocaleDateString('en-US', {
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

  submit(): void {
    if (this.form.valid) {
      const { taskTypeId, increments, summary } = this.form.value;
      this.dialogRef.close({
        taskTypeId: taskTypeId!,
        increments: increments!,
        summary: summary ?? '',
        date: this.data.selectedDate
      });
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
