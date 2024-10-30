import { Component, OnInit,ChangeDetectorRef } from '@angular/core';
import { WriteserviceService } from '../writeservice.service';
import { WriteModel } from '../Models/writemodel';
import { account } from '../../lib/appwrite';
// import { ActivatedRoute } from '@angular/router';
// import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-read',
  templateUrl: './read.component.html',
  styleUrls: ['./read.component.css']
})

export class ReadComponent implements OnInit{
  blogs: WriteModel[] = [];
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


  ngOnInit(): void {
    this.bucketName=environment.bucketName;
    this.project=environment.project;
    this.mode=environment.mode;
    this.readblogdata()
    this.getloggedinuserdata()

  }

  constructor(private readsevice:WriteserviceService,private toastr: ToastrService,private cdr: ChangeDetectorRef){}

  
  readblogdata(){
    try {
    this.isloadingblogs = true;
    this.readsevice.getpublishpostdata(this.start,this.limit).subscribe(
      (data:WriteModel[])=>{
          this.blogs=this.blogs.concat(data);
          this.isloadingblogs=false
          console.log(this.blogs);
          
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
        (data:WriteModel[])=>{
            this.blogs=data;
            this.isloadingblogs=false
            console.log(this.blogs);
            
        }
      )
        } catch (error) {
            console.log(error);
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
        this.ngOnInit()
        this.cdr.detectChanges(); 
        // this.blogs = this.blogs.filter(b => b._id !== post._id);
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

}
