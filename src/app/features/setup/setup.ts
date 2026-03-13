import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TaskTypeService } from '../../core/services/task-type.service';

@Component({
  selector: 'app-setup',
  imports: [ReactiveFormsModule],
  templateUrl: './setup.html',
  styleUrl: './setup.css'
})
export class SetupComponent {
  taskTypeService = inject(TaskTypeService);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(1)]],
    color: ['#4f86c6']
  });

  onSubmit(): void {
    if (this.form.valid) {
      const { name, color } = this.form.value;
      this.taskTypeService.addTaskType(name!, color!);
      this.form.reset({ name: '', color: '#4f86c6' });
    }
  }

  delete(id: string): void {
    this.taskTypeService.deleteTaskType(id);
  }
}
