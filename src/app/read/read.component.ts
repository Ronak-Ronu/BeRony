import { Component, OnInit,ChangeDetectorRef } from '@angular/core';
import { WriteserviceService } from '../writeservice.service';
import { WriteModel } from '../Models/writemodel';
import { account } from '../../lib/appwrite';
// import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../environments/environment';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { trigger, state, style, animate, transition } from '@angular/animations';

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

export class ReadComponent implements OnInit{
  blogs: WriteModel[] = [];
  userData:any
  loggedInUserAccount:any=null
  username!:string
  searchQuery:string=''
  searchResults: any[] = [];
  showFilters = false;
  userId!:string
  isloadingblogs:boolean=true
  selectedTag: string | null = null;
  bucketName:string | null = null;
  project:string | null = null;
  mode:string | null = null;
  start = 0;
  limit = 5; 
  useremotion:string="🙂"
  recentsearch: string[] = [];
  showHistory: boolean=false;
  private searchSubject = new Subject<string>();
  stories: any[] = [];
  selectedStory: any | null = null;
  



ngOnInit(): void {
    this.bucketName=encodeURIComponent(environment.bucketName);
    this.project=encodeURIComponent(environment.project);
    this.mode=encodeURIComponent(environment.mode);    
    this.readblogdata()
    this.getloggedinuserdata()
    this.searchSubject.pipe(
      debounceTime(300), // Wait 300ms after last keystroke
      distinctUntilChanged() // Only emit if the value has changed
    ).subscribe(query => {
      this.searchQuery = query;
      this.onSearch();
    });
    this.loadStories()
  }
  ngOnDestroy() {
    this.searchSubject.complete();
  }
  constructor(private readsevice:WriteserviceService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ){}

  
  readblogdata(){
    try {
    this.isloadingblogs = true;
    this.readsevice.getpublishpostdata(this.start,this.limit).subscribe(
      (data:WriteModel[])=>{
          this.blogs=this.blogs.concat(data);
          this.isloadingblogs=false
          console.log(this.blogs);
          this.addUserEmotion()
      }
    )
      } catch (error) {
          console.log(error);
          this.isloadingblogs=false
      } 
  }

  readqueryblogdata()
  {
    try {
      this.isloadingblogs = true;
      this.readsevice.getsearchpostdata(this.selectedTag,this.searchQuery).subscribe(
        (  data:WriteModel[])=>{
          this.blogs=data;
          this.isloadingblogs=false
          this.savesearchquery(this.searchQuery);
          this.addUserEmotion();
        }
      )
      } catch (error) {
            // console.log(error);
            this.isloadingblogs=false
        }
  }

  onSearchInput(query: string) {
    this.searchSubject.next(query);
  }

  onSearch() {
    this.blogs = [];
    this.readqueryblogdata();
  }
  savesearchquery(query:string)
    {  let searches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    
    // Remove duplicates and keep only latest 5 searches
    searches = [query, ...searches.filter((q: string) => q !== query)].slice(0, 5);
    
    localStorage.setItem('recentSearches', JSON.stringify(searches));
    this.recentsearch = searches;
  }

  showRecentSearches() {
    this.loadRecentSearch(); 
    this.showHistory=true
  }
  hideRecentSearches() {
    setTimeout(() => {
      this.showHistory = false; 
    }, 200); 
  }
  loadRecentSearch()
  {
    this.recentsearch = JSON.parse(localStorage.getItem('recentSearches') || '[]')

  }
  selectSearch(query: string) {
    this.searchQuery = query;
    this.onSearch();
  }

  clearhistory()
  {
    localStorage.removeItem('recentSearches');
    this.recentsearch=[];
  }
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  getid(item:WriteModel)
  {
    console.log(item._id);
    console.log(item.title);

  }


  async getloggedinuserdata (){
    this.loggedInUserAccount = await account.get();
    if (this.loggedInUserAccount) {
      this.username=this.loggedInUserAccount.name;
      this.userId=this.loggedInUserAccount.$id;
     
    }
  }



 async deletepost(post:WriteModel)
  {
    try {

      if (post.userId===this.userId && this.loggedInUserAccount) {
       await this.readsevice.deletepostbyid(post._id)
       console.log("post deleted");
       this.toastr.success("We will miss this post")
       this.blogs = this.blogs.filter(b => b._id !== post._id);
      }
      else{
        this.toastr.error("you are not author of this post");
        console.log("you are not author of this post.");
      }
      
    } catch (error) {
      console.log("cannot delete post",error); 
    }
  }


  getBackgroundImage(item: WriteModel): string {
    return `url(${item.imageUrl})`;
  }


  filterByTag(usersselectedtag:string)
  {
    this.blogs=[]
    this.selectedTag = this.selectedTag === usersselectedtag ? null : usersselectedtag
    console.log(this.selectedTag);
    this.readqueryblogdata()
  }
  seemore()
  {
    this.start+=this.limit;
    this.readblogdata();
  }
  addPostBookmark(savepostid:string)
  {
    this.readsevice.addPostBookmark(this.userId, savepostid).subscribe(
      () => {
        console.log(savepostid);
        
          console.log("Bookmark added successfully");
          this.toastr.success("Bookmarked")
      },
      (error) => { 
          console.error("Error adding bookmark:", error.error.message);
          this.toastr.error(error.error.message)
      }
  );
  }

  addUserEmotion(){
    this.blogs.forEach((blog, index) => {
      this.readsevice.getUserData(blog.userId).subscribe(
        (data) => {
          // Add the `useremotion` to the corresponding blog item
          this.blogs[index] = { ...blog, userEmotion: data.user.userEmotion };
          this.cdr.detectChanges(); // Update the view with the new data
        },
        (error) => {
          console.error(`Error fetching emotion for user ${blog.userId}:`, error);
        }
      );
    });
  }

  goToAuthorProfile(authorUserId:string)
  {
    this.router.navigate(['/profile/',authorUserId])
    console.log(authorUserId);
    
  }

  loadStories(): void {
    this.readsevice.getAllStories().subscribe({
      next: (stories) => {
        this.stories = stories;
      },
      error: (error) => {
        console.error('Error fetching stories:', error);
      }
    });
  }

  openStory(story: any): void {
    this.selectedStory = story;
  }

  closeStory(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Close only if clicking the overlay (not the story content)
    if (target.classList.contains('fullscreen-overlay')) {
      this.selectedStory = null;
    }
  }

}
