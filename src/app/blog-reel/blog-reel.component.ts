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

  constructor(private readService: WriteserviceService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadBlogs();
  }

  loadBlogs() {
    // Fetch a specific page of blogs based on startIndex and blogsPerPage
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
    this.cdr.detectChanges();  // Force change detection to update the view
  }

  onSwipeLeft() {
    if (this.startIndex + this.blogsPerPage < this.blogs.length) {
      this.startIndex += this.blogsPerPage;
      this.updateCurrentBlogView();
    } else {
      this.startIndex += this.blogsPerPage;
      this.loadBlogs(); // Fetch more blogs if we reach the end of loaded blogs
    }
  }

  onSwipeRight() {
    if (this.startIndex - this.blogsPerPage >= 0) {
      this.startIndex -= this.blogsPerPage;
      this.updateCurrentBlogView();
    }
  }
}
