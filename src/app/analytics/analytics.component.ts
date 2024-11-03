import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit {
  @Input() posts: any[] = [];
  reactionCountsData: any[] = [];
  colorScheme: any = {
    domain: ['#FFABAB', '#FFC3A0', '#D5AAFF']
  };

  ngOnInit() {
    this.updateReactionCounts();
  }

  updateReactionCounts() {
    this.reactionCountsData = this.posts.map(post => ({
      title: post.title,
      counts: {
        Funny: post.funnycount || 0,
        Sad: post.sadcount || 0,
        LoveIt: post.loveitcount || 0
      }
    }));
  }

  getMaxYAxisValue() {
    const maxCounts = this.posts.map(post => Math.max(post.funnycount || 0, post.sadcount || 0, post.loveitcount || 0));
    return Math.max(...maxCounts, 100); // Returns maximum value or defaults to 100
  }
}
