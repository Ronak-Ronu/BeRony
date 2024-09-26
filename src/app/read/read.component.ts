import { Component, OnInit } from '@angular/core';
import { WriteserviceService } from '../writeservice.service';
import { WriteModel } from '../Models/writemodel';
import { account } from '../../lib/appwrite';
// import { ActivatedRoute } from '@angular/router';
// import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-read',
  templateUrl: './read.component.html',
  styleUrl: './read.component.css'
})
export class ReadComponent implements OnInit{
  blogs: WriteModel[] = [];
  loggedInUserAccount:any=null
  username!:string
  searchQuery:string=''
  searchResults: any[] = [];
  showFilters = false;
  userId!:string
  

  ngOnInit(): void {
    this.readblogdata()
    this.getloggedinuserdata()

  }

  constructor(private readsevice:WriteserviceService,private toastr: ToastrService){}

  
  readblogdata(){

    this.readsevice.getpublishpostdata(this.searchQuery).subscribe(
      (data:WriteModel[])=>{
          this.blogs=data
          console.log(this.blogs);
          
      }
    )
  }
  onSearch()
  {
    this.readblogdata(); 

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



  deletepost(post:WriteModel)
  {
    try {

      if (post.userId===this.userId) {
        this.readsevice.deletepostbyid(post._id)
        console.log("post deleted");
        this.toastr.success("We will miss this post")
        this.ngOnInit()
      }
      this.toastr.error("you are not author of this post");
      console.log("you are not author of this post.");
      

    } catch (error) {
      console.log("cannot delete post",error);
      
    }
  
  }


  getBackgroundImage(item: WriteModel): string {
    return `url(${item.imageUrl})`;
  }




}
