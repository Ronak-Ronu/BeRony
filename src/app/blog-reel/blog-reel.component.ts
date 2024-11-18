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
  threshold: number = 200;
  loadingBlogs: boolean = false;  

  constructor(private readService: WriteserviceService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadBlogs();
    window.addEventListener('touchstart', this.onTouchStart.bind(this));
    window.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
  
  }

  loadBlogs() {
    if (this.loadingBlogs) {
      return;  
    }
    
    this.loadingBlogs = true;  
  
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
      },
      () => {
        this.loadingBlogs = false;  
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
  
    if (Math.abs(diffX) > this.threshold) {
      if (event.cancelable) {
        event.preventDefault();
      }
  
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
      this.loadBlogs();
    }
  }
  
  onSwipeRight() {
    if (this.startIndex - this.blogsPerPage >= 0) {
      this.startIndex -= this.blogsPerPage;
      this.updateCurrentBlogView();
    }
  }
  
  
}
