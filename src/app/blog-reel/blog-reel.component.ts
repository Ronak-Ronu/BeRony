import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { Router } from '@angular/router';
import { WriteserviceService } from '../writeservice.service';
import { account } from '../../lib/appwrite';

@Component({
  selector: 'app-blog-reel',
  templateUrl: './blog-reel.component.html',
  styleUrls: ['./blog-reel.component.css'],
})
export class BlogReelComponent implements OnInit {
  @ViewChildren('reelSlide') reelSlides!: QueryList<ElementRef>;

  blogs: any[] = [];
  currentIndex = 0;
  loadingBlogs = false;
  isScrolling = false;

  // Touch swipe tracking
  private touchStartY = 0;
  private touchStartX = 0;

  // User auth & reactions
  loggedInUserAccount: any = null;
  userId = '';
  username = '';

  // Per-post reaction state: { postId: { funny: bool, sad: bool, loveit: bool } }
  userReactions: { [postId: string]: { [emoji: string]: boolean } } = {};

  constructor(
    private readService: WriteserviceService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.getUser();
    this.loadBlogs();
  }

  async getUser(): Promise<void> {
    try {
      this.loggedInUserAccount = await account.get();
      if (this.loggedInUserAccount) {
        this.userId = this.loggedInUserAccount.$id;
        this.username = this.loggedInUserAccount.name;
      }
    } catch {
      // guest
    }
  }

  loadBlogs(): void {
    if (this.loadingBlogs) return;
    this.loadingBlogs = true;
    const start = this.blogs.length;

    this.readService.getpublishpostdata(start, 6).subscribe({
      next: (data: any[]) => {
        if (data.length > 0) {
          this.blogs = [...this.blogs, ...data];
          // seed reaction state for new posts
          data.forEach((post) => {
            if (!this.userReactions[post._id]) {
              this.userReactions[post._id] = {
                funny: !!localStorage.getItem(`reaction_${post._id}_funny`),
                sad: !!localStorage.getItem(`reaction_${post._id}_sad`),
                loveit: !!localStorage.getItem(`reaction_${post._id}_loveit`),
              };
            }
          });
        }
      },
      error: (err) => console.error('Error fetching blogs:', err),
      complete: () => {
        this.loadingBlogs = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  goTo(index: number): void {
    if (index < 0 || index >= this.blogs.length || this.isScrolling) return;
    this.isScrolling = true;
    this.currentIndex = index;
    this.scrollToCurrentSlide();
    // Pre-load more when near the end
    if (this.currentIndex >= this.blogs.length - 2 && !this.loadingBlogs) {
      this.loadBlogs();
    }
    setTimeout(() => (this.isScrolling = false), 600);
  }

  next(): void { this.goTo(this.currentIndex + 1); }
  prev(): void { this.goTo(this.currentIndex - 1); }

  private scrollToCurrentSlide(): void {
    const slides = this.reelSlides?.toArray();
    if (slides && slides[this.currentIndex]) {
      slides[this.currentIndex].nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
    this.cdr.detectChanges();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') this.next();
    if (event.key === 'ArrowUp'   || event.key === 'ArrowLeft')  this.prev();
  }

  // ── Touch swipe ────────────────────────────────────────────────────────────

  onTouchStart(event: TouchEvent): void {
    this.touchStartY = event.touches[0].clientY;
    this.touchStartX = event.touches[0].clientX;
  }

  onTouchEnd(event: TouchEvent): void {
    const dy = this.touchStartY - event.changedTouches[0].clientY;
    const dx = this.touchStartX - event.changedTouches[0].clientX;
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 60) {
      dy > 0 ? this.next() : this.prev();
    }
  }

  // ── Likes ─────────────────────────────────────────────────────────────────

  addLike(post: any, emoji: string): void {
    if (!this.loggedInUserAccount) {
      return; // silently ignore; button shows "login" tooltip
    }
    const key = `reaction_${post._id}_${emoji}`;
    const already = !!localStorage.getItem(key);

    if (already) {
      localStorage.removeItem(key);
      this.userReactions[post._id][emoji] = false;
      this.updateCount(post, emoji, -1);
    } else {
      localStorage.setItem(key, 'true');
      this.userReactions[post._id][emoji] = true;
      this.updateCount(post, emoji, 1);
    }
  }

  private updateCount(post: any, emoji: string, delta: number): void {
    this.readService.updateReaction(post._id, emoji, delta >= 0).subscribe({
      next: (updated: any) => {
        const idx = this.blogs.findIndex((b) => b._id === post._id);
        if (idx !== -1) {
          this.blogs[idx].funnycount = updated.funnycount;
          this.blogs[idx].sadcount   = updated.sadcount;
          this.blogs[idx].loveitcount = updated.loveitcount;
          this.cdr.detectChanges();
        }
      },
    });
  }

  totalLikes(post: any): number {
    return (post.sadcount || 0) + (post.loveitcount || 0) + (post.funnycount || 0);
  }

  hasReacted(postId: string, emoji: string): boolean {
    return this.userReactions[postId]?.[emoji] ?? false;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  readPost(postId: string): void {
    this.router.navigate(['/reading', postId]);
  }

  stripHTML(html: string): string {
    return html?.replace(/<\/?[^>]+(>|$)/g, '') ?? '';
  }

  trackByPost(_: number, post: any): string {
    return post._id;
  }
}
