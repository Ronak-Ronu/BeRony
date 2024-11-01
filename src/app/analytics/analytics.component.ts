import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls:['./analytics.component.css']
})
export class AnalyticsComponent {
  @Input() posts:any[]=[];

  reactionCountsData: any[] = [];

  colorScheme: any = {
    domain: ['#FFABAB', '#FFC3A0', '#D5AAFF'] 
  };

  ngOnInit() {
    this.updateReactionCounts();

    console.log(this.reactionCountsData);
    console.log(this.posts);
    
    
    
  }

  updateReactionCounts() {
    const reactionCounts = {
      Funny: 0,
      Sad: 0,
      LoveIt: 0
    };

    // Calculate reaction counts from all posts
    this.posts.forEach(post => {
      reactionCounts.Funny += post.funnycount || 0;
      reactionCounts.Sad += post.sadcount || 0;
      reactionCounts.LoveIt += post.loveitcount || 0;
    });

    
    this.reactionCountsData = [
      { name: 'Funny', value: reactionCounts.Funny },
      { name: 'Sad', value: reactionCounts.Sad },
      { name: 'Love it', value: reactionCounts.LoveIt }
    ];
  }


}
