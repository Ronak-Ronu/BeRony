// activity-heatmap.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { WriteserviceService } from '../writeservice.service';

@Component({
  selector: 'app-activity-heatmap',
  templateUrl: './activity-heatmap.component.html',
  styleUrls: ['./activity-heatmap.component.css']
})
export class ActivityHeatmapComponent implements OnInit {
  @Input() userId: string = '';
  heatmapData: any[] = [];
  months: string[] = [];
  weekdays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  loading: boolean = true;
  maxCount: number = 0;
  totalContributions: number = 0;
  private monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  constructor(private service: WriteserviceService) {}

  ngOnInit() {
    if (this.userId) {
      this.loadHeatmapData();
    }
  }

  loadHeatmapData() {
    this.service.getUserContributions(this.userId).subscribe(
      (data: any) => {
        this.processHeatmapData(data);
        this.loading = false;
      },
      (error) => {
        console.error('Failed to load heatmap data', error);
        this.loading = false;
      }
    );
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDisplayDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    return `${this.monthNames[month - 1]} ${day}, ${year}`;
  }

  private getDaysInYear(): Date[] {
    const days: Date[] = [];
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const startDate = new Date(oneYearAgo);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    for (let i = 0; i < 371; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    
    return days;
  }

  processHeatmapData(data: { [date: string]: number }) {
    if (!data || Object.keys(data).length === 0) {
      console.warn('No contribution data received, initializing empty heatmap');
      this.heatmapData = Array(7).fill(null).map(() => Array(53).fill(null));
      this.months = Array(53).fill('');
      this.totalContributions = 0;
      this.maxCount = 0;
      return;
    }
  
    const days = this.getDaysInYear();
    const gridData: any[] = Array(7).fill(null).map(() => []);
    this.months = [];
    this.maxCount = 0;
    this.totalContributions = 0;
  
    for (let i = 0; i < 53; i++) {
      this.months.push('');
    }
  
    days.forEach((date, index) => {
      const dateStr = this.formatDate(date);
      const count = data[dateStr] || 0;
      this.totalContributions += count;
      if (count > this.maxCount) this.maxCount = count;
  
      const weekIndex = Math.floor(index / 7);
      const dayIndex = index % 7;
  
      gridData[dayIndex][weekIndex] = {
        date: dateStr,
        count,
        formattedDate: this.formatDisplayDate(dateStr)
      };
  
      if (date.getDate() === 1 && weekIndex < 53) {
        this.months[weekIndex] = this.monthNames[date.getMonth()];
      }
    });
  
    this.heatmapData = gridData.map(week => week.slice(0, 53));
  }
  getColor(count: number): string {
    const colors = [
      '#ebedf0', 
      '#d6e4ff', 
      '#adc8ff', 
      '#85adff', 
      '#5c91ff', 
      '#4a5ac8'  
    ];
  
    if (count === 0) return colors[0];
    if (count === 1) return colors[1];
    if (count === 2) return colors[2];
    if (count >= 3 && count <= 4) return colors[3];
    if (count >= 5 && count <= 7) return colors[4];
    return colors[5]; 
  }

  getTooltipText(day: any): string {
    if (!day) return 'No data';
    if (day.count === 0) return `No contributions on ${day.formattedDate}`;
    return `${day.count} contribution${day.count > 1 ? 's' : ''} on ${day.formattedDate}`;
  }
}