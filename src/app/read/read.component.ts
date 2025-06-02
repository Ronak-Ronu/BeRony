import { Component, OnInit, OnDestroy, ChangeDetectorRef, Renderer2 } from '@angular/core';
import { WriteserviceService } from '../writeservice.service';
import { WriteModel } from '../Models/writemodel';
import { account } from '../../lib/appwrite';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../environments/environment';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { trigger, state, style, animate, transition } from '@angular/animations';

interface ChatRoom {
  roomId: string;
  title: string;
  creatorId: string;
  creatorUsername: string;
  createdAt: string;
}

@Component({
  selector: 'app-read',
  templateUrl: './read.component.html',
  styleUrls: ['./read.component.css'],
  animations: [
    trigger('popupAnimation', [
      state('void', style({
        opacity: 0,
        transform: 'scale(0.8)'
      })),
      state('*', style({
        opacity: 1,
        transform: 'scale(1)'
      })),
      transition('void => *', [
        animate('300ms ease-out')
      ]),
      transition('* => void', [
        animate('200ms ease-in')
      ])
    ])
  ]
})
export class ReadComponent implements OnInit, OnDestroy {
  blogs: any[] = [];
  userData: any;
  loggedInUserAccount: any = null;
  username: string = '';
  searchQuery: string = '';
  searchResults: any[] = [];
  showFilters = true;
  userId: string = '';
  isloadingblogs: boolean = true;
  selectedTag: string | null = null;
  bucketName: string | null = null;
  project: string | null = null;
  mode: string | null = null;
  start = 0;
  limit = 5;
  useremotion: string = "🙂";
  recentsearch: string[] = [];
  showHistory: boolean = false;
  ischatroomvisible: boolean = false;
  private searchSubject = new Subject<string>();
  stories: any[] = [];
  selectedStory: any | null = null;
  rooms: ChatRoom[] = [];
  newRoomId: string = '';
  newRoomTitle: string = '';
  error: string = '';
  private subscriptions: Subscription = new Subscription();
  isTruncated: boolean = true;


  constructor(
    private readsevice: WriteserviceService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    this.bucketName = encodeURIComponent(environment.bucketName);
    this.project = encodeURIComponent(environment.project);
    this.mode = encodeURIComponent(environment.mode);

    // Fetch user data first
    await this.getloggedinuserdata();
    
    // Connect to Socket.io only after user data is set
    if (this.userId && this.username) {
      this.readsevice.connect(this.userId, this.username);
      this.subscriptions.add(
        this.readsevice.getRoomCreated().subscribe((room: ChatRoom) => {
          console.log('New room created:', room);
          this.rooms = [room, ...this.rooms];
          this.cdr.detectChanges();
        })
      );
      this.subscriptions.add(
        this.readsevice.getErrors().subscribe((error: string) => {
          this.error = error;
          this.toastr.error(error);
          setTimeout(() => (this.error = ''), 5000);
          this.cdr.detectChanges();
        })
      );
    } else {
      console.warn('User ID or username not set, skipping Socket.io connection');
      this.error = 'Please log in to create or join chat rooms';
      setTimeout(() => (this.error = ''), 5000);
    }

    this.readblogdata();
    this.loadStories();
    this.loadRooms();

    this.subscriptions.add(
      this.searchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe(query => {
        this.searchQuery = query;
        this.onSearch();
      })
    );
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
    this.subscriptions.unsubscribe();
  }

  onMouseMove(event: MouseEvent, element: EventTarget | null) {
    if (!(element instanceof HTMLElement)) return;
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
  
    element.style.setProperty('--x', `${x}px`);
    element.style.setProperty('--y', `${y}px`);
  }
  toggleTruncate() {
    this.isTruncated = !this.isTruncated;
  }
  onMouseLeave(element: EventTarget | null) {
    if (!(element instanceof HTMLElement)) return;
    element.style.setProperty('--x', '50%');
    element.style.setProperty('--y', '50%');
  }
  
  readblogdata(): void {
    try {
      this.isloadingblogs = true;
      this.readsevice.getpublishpostdata(this.start, this.limit).subscribe(
        (data: WriteModel[]) => {
          this.blogs = this.blogs.concat(data);
          this.isloadingblogs = false;
          this.addUserEmotion();
          this.cdr.detectChanges();
        },
        (error) => {
          console.error('Error fetching blogs:', error);
          this.isloadingblogs = false;
          this.toastr.error('Failed to load blogs');
          this.cdr.detectChanges();
        }
      );
    } catch (error) {
      console.error(error);
      this.isloadingblogs = false;
      this.cdr.detectChanges();
    }
  }

  readqueryblogdata(): void {
    try {
      this.isloadingblogs = true;
      this.readsevice.getsearchpostdata(this.selectedTag, this.searchQuery).subscribe(
        (data: WriteModel[]) => {
          this.blogs = data;
          this.isloadingblogs = false;
          this.savesearchquery(this.searchQuery);
          this.addUserEmotion();
          this.cdr.detectChanges();
        },
        (error) => {
          console.error('Error searching blogs:', error);
          this.isloadingblogs = false;
          this.toastr.error('Failed to search blogs');
          this.cdr.detectChanges();
        }
      );
    } catch (error) {
      console.error(error);
      this.isloadingblogs = false;
      this.cdr.detectChanges();
    }
  }

  onSearchInput(query: string): void {
    this.searchSubject.next(query);
  }

  onSearch(): void {
    this.blogs = [];
    this.readqueryblogdata();
  }

  savesearchquery(query: string): void {
    let searches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    searches = [query, ...searches.filter((q: string) => q !== query)].slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(searches));
    this.recentsearch = searches;
  }

  showRecentSearches(): void {
    this.loadRecentSearch();
    this.showHistory = true;
  }

  hideRecentSearches(): void {
    setTimeout(() => {
      this.showHistory = false;
    }, 200);
  }

  loadRecentSearch(): void {
    this.recentsearch = JSON.parse(localStorage.getItem('recentSearches') || '[]');
  }

  selectSearch(query: string): void {
    this.searchQuery = query;
    this.onSearch();
  }

  clearhistory(): void {
    localStorage.removeItem('recentSearches');
    this.recentsearch = [];
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  getid(item: WriteModel): void {
    console.log(item._id);
    console.log(item.title);
  }

  async getloggedinuserdata(): Promise<void> {
    try {
      this.loggedInUserAccount = await account.get();
      if (this.loggedInUserAccount) {
        this.username = this.loggedInUserAccount.name || 'Guest_' + Math.random().toString(36).substr(2, 5);
        this.userId = this.loggedInUserAccount.$id;
        console.log('Logged in user:', { userId: this.userId, username: this.username });
        this.cdr.detectChanges();
      } else {
        console.warn('No logged-in user found');
        this.username = 'Guest_' + Math.random().toString(36).substr(2, 5);
        this.userId = 'user_' + Math.random().toString(36).substr(2, 9);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      this.username = 'Guest_' + Math.random().toString(36).substr(2, 5);
      this.userId = 'user_' + Math.random().toString(36).substr(2, 9);
    }
  }

  async deletepost(post: WriteModel): Promise<void> {
    try {
      if (post.userId === this.userId && this.loggedInUserAccount) {
        await this.readsevice.deletepostbyid(post._id);
        this.toastr.success("We will miss this post");
        this.blogs = this.blogs.filter(b => b._id !== post._id);
        this.cdr.detectChanges();
      } else {
        this.toastr.error("You are not the author of this post");
      }
    } catch (error) {
      console.error("Cannot delete post:", error);
      this.toastr.error("Failed to delete post");
    }
  }

  getBackgroundImage(item: WriteModel): string {
    return `url(${item.imageUrl})`;
  }

  filterByTag(usersselectedtag: string): void {
    this.blogs = [];
    this.selectedTag = this.selectedTag === usersselectedtag ? null : usersselectedtag;
    this.readqueryblogdata();
  }

  seemore(): void {
    this.start += this.limit;
    this.readblogdata();
  }

  addPostBookmark(savepostid: string): void {
    this.readsevice.addPostBookmark(this.userId, savepostid).subscribe(
      () => {
        this.toastr.success("Bookmarked");
      },
      (error) => {
        console.error("Error adding bookmark:", error.error.message);
        this.toastr.error(error.error.message);
      }
    );
  }

  addUserEmotion(): void {
    this.blogs.forEach((blog, index) => {
      this.readsevice.getUserData(blog.userId).subscribe(
        (data) => {
          this.blogs[index] = { ...blog, userEmotion: data.user.userEmotion };
          this.cdr.detectChanges();
        },
        (error) => {
          console.error(`Error fetching emotion for user ${blog.userId}:`, error);
        }
      );
    });
  }

  goToAuthorProfile(authorUserId: string): void {
    this.router.navigate(['/profile/', authorUserId]);
  }

  loadStories(): void {
    this.readsevice.getAllStories().subscribe({
      next: (stories) => {
        this.stories = stories;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching stories:', error);
        this.toastr.error('Failed to load stories');
      }
    });
  }

  openStory(story: any): void {
    this.selectedStory = story;
  }

  closeStory(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('fullscreen-overlay')) {
      this.selectedStory = null;
    }
  }

  loadRooms(): void {
    console.log('Loading rooms...');
    this.readsevice.getRooms().subscribe({
      next: (rooms: ChatRoom[]) => {
        console.log('Rooms loaded:', rooms);
        this.rooms = rooms;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error loading rooms:', {
          status: err.status,
          statusText: err.statusText,
          url: err.url,
          message: err.message,
          error: err.error
        });
        const errorMessage = err.error?.message || err.message || 'Failed to load chat rooms';
        this.error = errorMessage;
        this.toastr.error(errorMessage);
        setTimeout(() => (this.error = ''), 5000);
        this.cdr.detectChanges();
      }
    });
  }



  createRoom(): void {
    console.log('Attempting to create room:', { roomId: this.newRoomId, title: this.newRoomTitle, userId: this.userId, username: this.username });
    if (!this.newRoomId || !this.newRoomTitle) {
      this.error = 'Please enter both Room ID and Title';
      this.toastr.error(this.error);
      setTimeout(() => (this.error = ''), 5000);
      this.cdr.detectChanges();
      return;
    }
    const roomIdRegex = /^[a-z0-9-]+$/;
    if (!roomIdRegex.test(this.newRoomId)) {
      this.error = 'Room ID must be lowercase, alphanumeric, with hyphens only';
      this.toastr.error(this.error);
      setTimeout(() => (this.error = ''), 5000);
      this.cdr.detectChanges();
      return;
    }
    if (!this.userId || !this.username) {
      this.error = 'User not logged in. Please log in to create a room';
      this.toastr.error(this.error);
      setTimeout(() => (this.error = ''), 5000);
      this.cdr.detectChanges();
      return;
    }

    this.readsevice.createRoom(this.newRoomId, this.newRoomTitle, this.userId, this.username).subscribe({
      next: (room: ChatRoom) => {
        console.log('Room created successfully:', room);
        this.toastr.success(`Room "${room.title}" created!`);
        this.router.navigate([`/chat/${room.roomId}/${this.newRoomTitle}`]);
        this.newRoomId = '';
        this.newRoomTitle = '';
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error creating room:', err);
        this.error = err.error?.message || 'Failed to create room';
        this.toastr.error(this.error);
        setTimeout(() => (this.error = ''), 5000);
        this.cdr.detectChanges();
      }
    });
  }

  joinRoom(roomId: string,roomtitle:string): void {
    // console.log('Joining room:', roomId);
    this.router.navigate([`/chat/${roomId}/${roomtitle}`]);
  }
  showChatRoom(){
    this.ischatroomvisible=!this.ischatroomvisible
  }


  getStoryShareUrl(story: any): string {
    const baseUrl = window.location.origin;
    // Assuming stories have a unique ID; adjust based on your story model
    return `${baseUrl}/story/${story._id}`;
  }
  private copyToClipboard(text: string, successMessage: string): void {
    navigator.clipboard.writeText(text)
      .then(() => {
        this.toastr.success(successMessage);
      })
      .catch((error) => {
        console.error('Error copying to clipboard:', error);
        this.toastr.error('Failed to copy link');
      });
  }

  share(story: string) {
    const shareUrl = this.getStoryShareUrl(story);
    if (navigator.share) {

        navigator.share({
            title: '#ShareStoryFromBeRony',
            text: '👋 check out this story on berony',
            url: shareUrl,
        })
        .then(() => console.log('Share successful'))
        .catch((error) => console.error('Error sharing:', error));
    } else {
        const url = shareUrl;
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


}