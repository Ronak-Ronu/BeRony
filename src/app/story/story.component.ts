import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WriteserviceService } from '../writeservice.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-story',
  templateUrl: './story.component.html',
  styleUrls: ['./story.component.css']
})
export class StoryComponent implements OnInit {
  story: any | null = null;
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private readsevice: WriteserviceService,
    private toastr: ToastrService,
    private router: Router
  ) {
    console.log('StoryComponent initialized');
  }

  ngOnInit(): void {
    const storyId = this.route.snapshot.paramMap.get('id');
    console.log('Story ID:', storyId);
    if (storyId) {
      console.log('Fetching story for ID:', storyId);
      this.readsevice.getStoryById(storyId).subscribe({
        next: (story) => {
          console.log('Story received:', story);
          this.story = story;
          this.isLoading = false;
          const expiresAt = new Date(story.expiresAt).getTime();
          const now = Date.now();
          if (expiresAt < now) {
            console.log('Story expired:', story.expiresAt);
            this.story = null;
            this.toastr.error('This story has expired');
            setTimeout(() => this.router.navigate(['/read']), 3000);
          }
        },
        error: (error) => {
          console.error('Error fetching story:', error);
          this.isLoading = false;
          this.toastr.error('Failed to load story: ' + (error.error?.message || 'Unknown error'));
          setTimeout(() => this.router.navigate(['/read']), 3000);
        }
      });
    } else {
      console.error('No story ID provided');
      this.isLoading = false;
      this.toastr.error('Invalid story ID');
      this.router.navigate(['/read']);
    }
  }


  shareStory() {
    if (navigator.share) {
        navigator.share({
            title: '#ShareStoryFromBeRony',
            text: '👋 I found this amazing story on berony you might like. 👉',
            url: window.location.href,
        })
        .then(() => console.log('Share successful'))
        .catch((error) => console.error('Error sharing:', error));
    } else {
        const url = window.location.href;
        navigator.clipboard.writeText(url)
            .then(() => {
                this.toastr.success('URL copied to clipboard! 📋');
            })
            .catch((error) => {
                console.error('Error copying to clipboard:', error);
                this.toastr.error('Failed to copy the URL.');
            });
    }
}
goToAuthorProfile(authorUserId: string): void {
  this.router.navigate(['/profile/', authorUserId]);
}


  goBack(): void {
    this.router.navigate(['/read']);
  }
}