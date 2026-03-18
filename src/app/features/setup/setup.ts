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
    color: [this.nextDistinctColor()]
  });

  get colorAlreadyUsed(): boolean {
    const color = this.form.value.color?.toLowerCase();
    return this.taskTypeService.taskTypes().some(t => t.color.toLowerCase() === color);
  }

  onSubmit(): void {
    if (this.form.valid && !this.colorAlreadyUsed) {
      const { name, color } = this.form.value;
      this.taskTypeService.addTaskType(name!, color!);
      this.form.reset({ name: '', color: this.nextDistinctColor() });
    }
  }

  delete(id: string): void {
    this.taskTypeService.deleteTaskType(id);
  }

  private nextDistinctColor(): string {
    const existingHues = this.taskTypeService.taskTypes().map(t => this.hexToHue(t.color));

    let bestHue = 0;
    let bestMinDist = -1;
    for (let h = 0; h < 360; h += 3) {
      const minDist = existingHues.length === 0
        ? 360
        : Math.min(...existingHues.map(eh => {
            const d = Math.abs(h - eh);
            return Math.min(d, 360 - d);
          }));
      if (minDist > bestMinDist) {
        bestMinDist = minDist;
        bestHue = h;
      }
    }

    return this.hslToHex(bestHue, 60, 52);
  }

  private hexToHue(hex: string): number {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max === min) return 0;
    const d = max - min;
    let h = 0;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
    return h * 360;
  }

  private hslToHex(h: number, s: number, l: number): string {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * c).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }
}
