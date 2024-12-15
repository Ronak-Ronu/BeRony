import { Component, OnInit,ChangeDetectorRef } from '@angular/core';
import { WriteserviceService } from '../writeservice.service';
import { WriteModel } from '../Models/writemodel';
import { account } from '../../lib/appwrite';
// import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-read',
  templateUrl: './read.component.html',
  styleUrls: ['./read.component.css']
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


ngOnInit(): void {
    this.bucketName=encodeURIComponent(environment.bucketName);
    this.project=encodeURIComponent(environment.project);
    this.mode=encodeURIComponent(environment.mode);    
    this.readblogdata()
    this.getloggedinuserdata()
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
            this.addUserEmotion();
        }
      )
      } catch (error) {
            // console.log(error);
            this.isloadingblogs=false
        }
  }

  onSearch()
  {
    this.blogs=[]
    this.readqueryblogdata(); 

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
}
