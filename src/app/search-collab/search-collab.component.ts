import { Component, OnInit } from '@angular/core';
import { WriteserviceService } from '../writeservice.service';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { account } from '../../lib/appwrite';
import { WriteModel } from '../Models/writemodel';
import { environment } from '../../environments/environment';
@Component({
  selector: 'app-search-collab',
  templateUrl: './search-collab.component.html',
  styleUrl: './search-collab.component.css'
})
export class SearchCollabComponent implements OnInit {

  postId: string='';
  searchQuery: string = '';
  users: any[] = [];
  loggedInUserAccount:any=null
  username:string=''
  collaboUserEmail:string=''
  authorEmail:string=''
  post!:WriteModel
  postTitle:string=''
  postDescription:string=''
  userData: any;
  message: string = ''; 
  currenturl:string='';
  userId:string='';
  
  constructor(
    private service:WriteserviceService,
    private route:ActivatedRoute,
    private toaster:ToastrService
  ){  }

   ngOnInit(): void  {
    console.log("hello");
    this.postId = this.route.snapshot.paramMap.get('postId') || '';
    this.readblogdatabyid();
    console.log(this.postId);
    this.getloggedinuserdata()
    // http://localhost:4200/collab/userid/postid
  }

  async getloggedinuserdata (){
    this.loggedInUserAccount = await account.get();
      this.username=this.loggedInUserAccount.name;
      this.authorEmail=this.loggedInUserAccount.email
      this.userId=this.loggedInUserAccount.$id;

      console.log(this.username);
      console.log(this.userId);
      console.log(this.authorEmail);
      this.currenturl=`http://localhost:4200/collab/${this.userId}/${this.postId}`
      // this.currenturl=`http://berony.web.app/collab/${this.userId}/${this.postId}`
      
      console.log(this.currenturl);


    }
  searchUsers(): void {
    if (this.searchQuery.trim() === '') return;

    this.service.searchUsers(this.searchQuery).subscribe(
      (response) => {
        this.users = response;
        console.log(this.users);

      },
      (error) => {
        console.error('Error fetching users:', error);
      }
    );
  }
  addCollaborator(userId: string): void {
    this.service.addCollaborator(this.postId, userId).subscribe(
      () => {
        this.service.getUserData(userId).subscribe(
          (data)=>{
            this.userData = data.user
            this.collaboUserEmail=data.user.userEmail
            console.log(data);
            console.log(this.collaboUserEmail);
            this.updateCollaborator();
          },
          (error)=>{
            console.log(error);
          }
        )
        this.message = 'Collaborator added successfully!';
        this.toaster.success("Invitation sended")
        
      },
      (error) => {
        this.message = 'Error adding collaborator: ' + error.error.message;
        this.toaster.warning(error.error.message)
      }
    );
  }
  updateCollaborator() {
    // console.log("Checking values before sending email:");
    // console.log("collaboUserEmail:", this.collaboUserEmail);
    // console.log("authorEmail:", this.authorEmail);
    // console.log("username:", this.username);
    // console.log("postTitle:", this.postTitle);
    // console.log("postDescription:", this.postDescription);
    // console.log("currentUrl:", this.currenturl);
  
    if (!this.collaboUserEmail || !this.authorEmail || !this.username || !this.postTitle || !this.postDescription || !this.currenturl) {
      console.error("Missing required field(s). Please check.");
      return; 
    }
  
    this.service.sendCollaborateInvite(
      this.collaboUserEmail,
      this.authorEmail,
      this.username,
      this.postTitle,
      this.postDescription,
      this.currenturl
    ).subscribe({
      next: (data) => {
        console.log("Email sent:", data);
      },
      error: (error) => {
        console.error("Error sending email", error);
      }
    });
  }
  

  readblogdatabyid(){
      this.service.getpublishpostdatabyid(this.postId).subscribe({
              next: (data: WriteModel) => {
                  this.post = data;
                  console.log(this.post);
                  this.postTitle=data.title
                  this.postDescription=data.endnotecontent
              },
              error: (error) => {
                  console.error('Error fetching post data:', error);
              }
          });
        } 
}
