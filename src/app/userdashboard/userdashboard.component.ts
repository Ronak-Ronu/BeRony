import { Component, OnInit } from '@angular/core';
import { account } from '../../lib/appwrite';
import { WriteserviceService } from '../writeservice.service';

@Component({
  selector: 'app-userdashboard',
  templateUrl: './userdashboard.component.html',
  styleUrl: './userdashboard.component.css'
})
export class UserdashboardComponent implements OnInit{

  username!:string
  loggedInUserAccount:any=null
  userId!:string
  activeSection: string = 'overview';
  posts:any[]=[]
  error:string="";
  bookmarkposts:any[]=[]
  userEmotion:string=""
  userBio:string=""
  userData: any;

  constructor(private service:WriteserviceService)
  {}
  ngOnInit(): void {
    this.getloggedinuserdata()

  }
  async getloggedinuserdata (){
    this.loggedInUserAccount = await account.get();
    if (this.loggedInUserAccount) {
      this.username=this.loggedInUserAccount.name;
      this.userId=this.loggedInUserAccount.$id;
      console.log(this.username);
      console.log(this.userId);
      this.service.getUserData(this.userId).subscribe(
        (data)=>{
          console.log(data);
          this.userData = data.user
        },
        (error)=>{
          console.log(error);
        }
      )
      this.fetchUserPosts();

      this.fetchbookmarks();
      
    }
  }
  setActiveSection(section: string)
  {
    this.activeSection = section;
  }
  fetchUserPosts(){
    this.service.getPostsByUsername(this.username).subscribe(
      {
        next: (data)=>{
          this.posts = data;
        },
        error: (err) => {
          this.error = 'Error fetching posts.';
          console.error(err);
        }
  
      }
    )
  }
  fetchbookmarks()
  {
    this.service.getBookmark(this.userId).subscribe(
      {
        next:(data)=>{
            this.bookmarkposts=data
            console.log(this.bookmarkposts);
            
        },
        error: (err) => {
          this.error = 'Error fetching bookmarks.';
          console.error(err);
        }
      }
    )
  }
  
}
