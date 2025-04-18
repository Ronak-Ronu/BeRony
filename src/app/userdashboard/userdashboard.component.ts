import { Component, OnInit } from '@angular/core';
import { account } from '../../lib/appwrite';
import { WriteserviceService } from '../writeservice.service';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-userdashboard',
  templateUrl: './userdashboard.component.html',
  styleUrls: ['./userdashboard.component.css'],

})
export class UserdashboardComponent implements OnInit{

  username:string="Guest 🫣"
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
  isViewingOwnProfile:boolean=false
  bucketName:string | null = null;
  project:string | null = null;
  mode:string | null = null;
  imageurl:string | null = null
  routeUserId:string | null=''
  loading: boolean = true;
  loggedinuserid!:string;
  viewprofileuserId!:string;
  isFollowing: boolean = false;
  followingtrue:boolean = false;
  follwingfalse: boolean = false;
  isPlanting:boolean=false;
  userBadges: any[] = [];

  constructor(private service:WriteserviceService,
    private route: ActivatedRoute,
    private toastr: ToastrService
  )
  {}
  async ngOnInit() {
    this.loading = true;
    this.bucketName = encodeURIComponent(environment.bucketName);
    this.project = encodeURIComponent(environment.project);
    this.mode = encodeURIComponent(environment.mode);
  
    this.loggedInUserAccount = await account.get();
    this.loggedinuserid = this.loggedInUserAccount?.$id || '';
  
    this.route.paramMap.subscribe((params) => {
      this.routeUserId = params.get('userId'); 
      console.log('routeUserId:', this.routeUserId);
  
      if (this.routeUserId) {
        this.userId = this.routeUserId; 
        this.isViewingOwnProfile = this.userId === this.loggedinuserid;
      } else {
        this.userId = this.loggedinuserid;
        this.isViewingOwnProfile = true;
      }
          this.getloggedinuserdata();
    this.fetchUserData(this.userId);

    });
  }
  
    async getloggedinuserdata (){
    this.loggedInUserAccount = await account.get();
    if (this.loggedInUserAccount) {
      this.username=this.loggedInUserAccount.name;
      // this.userId=this.loggedInUserAccount.$id;
      this.loggedinuserid=this.loggedInUserAccount.$id;
      console.log(this.loggedinuserid);
      
      this.isEmailVerified = this.loggedInUserAccount.emailVerification; 
      this.imageurl= `https://cloud.appwrite.io/v1/storage/buckets/${this.bucketName}/files/${this.userId}/view?project=${this.project}&mode=${this.mode}`

      console.log(this.username);
      console.log(this.userId);
      this.service.getUserData(this.userId || '').subscribe(
        (data)=>{
          console.log(data);
          this.userData = data.user
          this.fetchUserPosts();
          this.loading = false;
        },
        (error)=>{
          console.log(error);
        }
      )

      this.fetchbookmarks();
      
    }
  }
  async verifyEmail(userId: string, secret: string) {
    try {
      await account.updateVerification(userId, secret);
      this.toastr.success('Email verified successfully!');
    } catch (error: any) {
      this.toastr.error('Email verification failed.');
      console.error('Verification error:', error);
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
          this.toastr.error('no post found.');
          console.error(err);
          this.loading = false;
        }
  
      }
    )
  }

  fetchUserData(userId: string ) {
    this.service.getUserData(userId).subscribe(
      (data) => {
        console.log('Fetched user data:', data);  
        this.userData = data.user;
        this.username = data.user.username;
        this.userEmotion = data.user.userEmotion;
        this.userBio = data.user.userBio;
        this.userBadges = data.user.badges || [];  
        this.fetchUserPosts();
      },
      (error) => {
        this.toastr.error('User does not exist.');
        console.error('Error fetching user data:', error);
        this.loading = false;
      }
    );
  }
  
  fetchbookmarks()
  {
    this.service.getBookmark(this.userId || '').subscribe(
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
  shareProfile()
{
  if (navigator.share) {
    navigator.share({
        title: 'Check this author on BeRony ',
        text: '👋 I found this amazing content writer on berony which you might like!',
        url: window.location.href,
    })
    .then(() => console.log('Share successful'))
    .catch((error) => console.error('Error sharing:', error));
} else {
    // If sharing is not supported, copy the URL to the clipboard
    const url = window.location.href;
    navigator.clipboard.writeText(url)
        .then(() => {
            alert('URL copied to clipboard! 📋');
        })
        .catch((error) => {
            console.error('Error copying to clipboard:', error);
            alert('Failed to copy the URL.');
        });
}
}
followUser(currentuserid: string,userid:string)
{
  // console.log(currentuserid,userid);

  this.service.followUser(currentuserid,"Follow",userid).subscribe(
    (response)=>{
      // console.log(response.message);
      this.toastr.success(response.message)

    },
    (error)=>{
      // console.log(error.error.message);
      this.toastr.warning(error.error.message)
        this.followingtrue=true;
    }
  )
}
unfollowUser(currentuserid: string,userid:string)
{
  // console.log(currentuserid,userid);

  this.service.unfollowUser(currentuserid,"Unfollow",userid).subscribe(
    (response)=>{
      // console.log(response.message);
      this.toastr.success(response.message)

    },
    (error)=>{
      // console.log(error.error.message);
      this.toastr.warning(error.error.message)
      
    }
  )
}

plantTree() {
  const userId = this.loggedinuserid; 
  
  window.location.href = `https://beronyuseraddtree1234.web.app/${userId}`;
  // window.location.href = `http://localhost:5173/${userId}`;
  
  }
  

  // profilecard() {
  //   const userId = this.loggedinuserid; 
  //   window.location.href = `https://beronyuseraddtree1234.web.app/threedprofile/${userId}`;
  //   // window.location.href = `http://localhost:5173/${userId}`;
  //   }

  profilecard() {
    const userId = this.loggedinuserid;
    const queryParams = new URLSearchParams({
      username: this.username || "Unknown User",
      userBio: this.userBio || "No bio",
      userEmotion: this.userEmotion || "😊",
      imageurl: this.imageurl || "",
      totalPosts: this.posts.length.toString() || "0",
    }).toString();
  
    window.location.href = `https://beronyuseraddtree1234.web.app/threedprofile/${userId}?${queryParams}`;
    // For local testing:
    // window.location.href = `http://localhost:5173/threedprofile/${userId}?${queryParams}`;
  }
unplantTree(){
  const userId = this.loggedinuserid; 
  this.service.deleteTree(userId).subscribe(
    (response)=>{
      this.toastr.success("Tree Unplanted 😥")
    },
    (error)=>{
      this.toastr.warning("Something went wrong!")
    }
  )
}
  
}
  