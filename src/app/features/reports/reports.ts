import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { TaskLogService } from '../../core/services/task-log.service';
import { TaskTypeService } from '../../core/services/task-type.service';

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function localDateStr(isoDate: string): string {
  return toDateInputValue(new Date(isoDate));
}

@Component({
  selector: 'app-reports',
  imports: [FormsModule, BaseChartDirective],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class ReportsComponent {
  taskLogService = inject(TaskLogService);
  taskTypeService = inject(TaskTypeService);

  fromDate = signal(toDateInputValue(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)));
  toDate = signal(toDateInputValue(new Date()));

  private filteredEntries = computed(() =>
    this.taskLogService.entriesInRange(this.fromDate(), this.toDate())
  );

  private dateRange = computed<string[]>(() => {
    const dates: string[] = [];
    const cur = new Date(this.fromDate() + 'T12:00:00');
    const to = new Date(this.toDate() + 'T12:00:00');
    while (cur <= to) {
      dates.push(toDateInputValue(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  });

  readonly barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      title: { display: true, text: 'Increments by Task Type' }
    },
    scales: {
      x: { stacked: true },
      y: { stacked: true, title: { display: true, text: '25-min increments' } }
    }
  };

  readonly lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Tasks Completed per Day' }
    },
    scales: {
      y: { title: { display: true, text: 'tasks logged' }, beginAtZero: true }
    }
  };

  barChartData = computed<ChartData<'bar'>>(() => {
    const dates = this.dateRange();
    const types = this.taskTypeService.taskTypes();
    const entries = this.filteredEntries();

    const datasets = types.map(type => ({
      label: type.name,
      data: dates.map(d =>
        entries
          .filter(e => e.taskTypeId === type.id && localDateStr(e.date) === d)
          .reduce((sum, e) => sum + e.increments, 0)
      ),
      backgroundColor: type.color
    }));

    return {
      labels: dates.map(d => {
        const dt = new Date(d + 'T12:00:00');
        return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      datasets
    };
  });

  lineChartData = computed<ChartData<'line'>>(() => {
    const dates = this.dateRange();
    const entries = this.filteredEntries();

    return {
      labels: dates.map(d => {
        const dt = new Date(d + 'T12:00:00');
        return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      datasets: [{
        label: 'Tasks',
        data: dates.map(d => entries.filter(e => localDateStr(e.date) === d).length),
        borderColor: '#4f86c6',
        backgroundColor: 'rgba(79,134,198,0.15)',
        fill: true,
        tension: 0.3
      }]
    };
  });

  onFromChange(value: string): void {
    this.fromDate.set(value);
  }

  onToChange(value: string): void {
    this.toDate.set(value);
  }
}
