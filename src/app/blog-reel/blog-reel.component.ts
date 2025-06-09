// Updated Component
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { WriteserviceService } from '../writeservice.service';

@Component({
  selector: 'app-blog-reel',
  templateUrl: './blog-reel.component.html',
  styleUrls: ['./blog-reel.component.css']
})
export class BlogReelComponent implements OnInit {
  @ViewChild('sliderContainer') sliderContainer!: ElementRef;
  
  blogs: any[] = [];
  currentIndex = 0;
  offsetX = 0;
  startX = 0;
  isSwiping = false;
  threshold = 100; // Increased threshold for better swipe detection
  loadingBlogs = false;  
  containerWidth = 0;

  constructor(
    private readService: WriteserviceService, 
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadBlogs();
    this.calculateContainerWidth();
    window.addEventListener('resize', () => this.calculateContainerWidth());
  }

  calculateContainerWidth() {
    this.containerWidth = window.innerWidth;
    this.updatePosition();
  }

  loadBlogs() {
    if (this.loadingBlogs) return;
    
    this.loadingBlogs = true;
    const startIndex = this.blogs.length;

    this.readService.getpublishpostdata(startIndex, 3).subscribe({ // Load 3 at a time
      next: (data: any[]) => {
        if (data.length > 0) {
          this.blogs = [...this.blogs, ...data];
        }
      },
      error: (error) => console.error("Error fetching blogs:", error),
      complete: () => {
        this.loadingBlogs = false;
        this.cdr.detectChanges();
      }
    });
  }

  onTouchStart(event: TouchEvent) {
    this.startX = event.touches[0].clientX;
    this.isSwiping = true;
  }

  onTouchMove(event: TouchEvent) {
    if (!this.isSwiping) return;
    
    const currentX = event.touches[0].clientX;
    const diff = currentX - this.startX;
    this.offsetX = -(this.currentIndex * this.containerWidth) + diff;
  }

  onTouchEnd(event: TouchEvent) {
    if (!this.isSwiping) return;
    
    const endX = event.changedTouches[0].clientX;
    const diff = endX - this.startX;
    const absDiff = Math.abs(diff);
    
    if (absDiff > this.threshold) {
      if (diff > 0) {
        this.prevSlide();
      } else {
        this.nextSlide();
      }
    } else {
      this.updatePosition();
    }
    
    this.isSwiping = false;
  }

  nextSlide() {
    if (this.currentIndex < this.blogs.length - 1) {
      this.currentIndex++;
    } else if (!this.loadingBlogs) {
      this.loadBlogs();
    }
    this.updatePosition();
  }

  prevSlide() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updatePosition();
    }
  }

  updatePosition() {
    this.offsetX = -this.currentIndex * this.containerWidth;
  }
}