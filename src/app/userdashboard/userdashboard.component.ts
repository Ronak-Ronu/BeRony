import { Component, OnInit } from '@angular/core';
import { account } from '../../lib/appwrite';
import { WriteserviceService } from '../writeservice.service';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-userdashboard',
  templateUrl: './userdashboard.component.html',
  styleUrls: ['./userdashboard.component.css']
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
  isEmailVerified:boolean=false


  constructor(private service:WriteserviceService,
    private route: ActivatedRoute,
    private toastr: ToastrService

  )
  {}
  async ngOnInit() {
    this.getloggedinuserdata()

    const userId = this.route.snapshot.queryParamMap.get('userId');
    const secret = this.route.snapshot.queryParamMap.get('secret');
    if (userId && secret) {
      try {
        await account.updateVerification(userId, secret);
        this.toastr.success('Email verified successfully!');
        // this.router.navigate(['/userdashboard']);
      } catch (error: any) {
        this.toastr.error('Email verification failed.');
        console.error('Verification error:', error);
      }
    } 

  }
  async getloggedinuserdata (){
    this.loggedInUserAccount = await account.get();
    if (this.loggedInUserAccount) {
      this.username=this.loggedInUserAccount.name;
      this.userId=this.loggedInUserAccount.$id;
      this.isEmailVerified = this.loggedInUserAccount.emailVerification; 

      console.log(this.username);
      console.log(this.userId);
      this.service.getUserData(this.userId).subscribe(
        (data)=>{
          console.log(data);
          this.userData = data.user
          this.fetchUserPosts();
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
