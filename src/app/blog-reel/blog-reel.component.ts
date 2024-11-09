import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { WriteserviceService } from '../writeservice.service';
import { WriteModel } from '../Models/writemodel';

@Component({
  selector: 'app-blog-reel',
  templateUrl: './blog-reel.component.html',
  styleUrls: ['./blog-reel.component.css'],
})
export class BlogReelComponent implements OnInit {
  blogs: any[] = [];
  currentBlogView: any[] = [];
  startIndex: number = 0;
  blogsPerPage: number = 1;
  startX: number = 0;
  threshold: number = 100; // Minimum distance to detect a swipe

  constructor(private readService: WriteserviceService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadBlogs();
  }

  loadBlogs() {
    this.readService.getpublishpostdata(this.startIndex, this.blogsPerPage).subscribe(
      (data: any[]) => {
        if (data.length > 0) {
          this.blogs = [...this.blogs, ...data];
          this.updateCurrentBlogView();
        } else {
          console.log("No more blogs to load.");
        }
      },
      (error) => {
        console.error("Error fetching blogs:", error);
      }
    );
  }

  updateCurrentBlogView() {
    this.currentBlogView = this.blogs.slice(this.startIndex, this.startIndex + this.blogsPerPage);
    this.cdr.detectChanges();
  }

  onTouchStart(event: TouchEvent) {
    this.startX = event.touches[0].clientX;
  }

  onTouchMove(event: TouchEvent) {
    const moveX = event.touches[0].clientX;
    const diffX = this.startX - moveX;

    // Check if the swipe distance exceeds the threshold
    if (Math.abs(diffX) > this.threshold) {
      // Prevent scrolling if we are swiping
      event.preventDefault();
      if (diffX > 0) {
        this.onSwipeLeft();
      } else {
        this.onSwipeRight();
      }
    }
  }

  onSwipeLeft() {
    if (this.startIndex + this.blogsPerPage < this.blogs.length) {
      this.startIndex += this.blogsPerPage;
      this.updateCurrentBlogView();
    } else {
      this.loadBlogs(); // Fetch more blogs if we reach the end
    }
  }

  onSwipeRight() {
    if (this.startIndex - this.blogsPerPage >= 0) {
      this.startIndex -= this.blogsPerPage;
      this.updateCurrentBlogView();
    }
  }
}
