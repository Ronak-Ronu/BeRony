import { Component, Input, OnInit } from '@angular/core';
import { WriteserviceService } from '../writeservice.service';
import { io, Socket } from 'socket.io-client';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { account } from '../../lib/appwrite';

@Component({
  selector: 'app-collab',
  templateUrl: './collab.component.html',
  styleUrls: ['./collab.component.css']
})
export class CollabComponent implements OnInit {
  private socket!: Socket;
  text: string = ''; 
  postId: string = ''; 
  userId: string = ''; 
  postdata:any
  username: string = ''
  editingUser: string =''
  loggedInUserAccount:any 
  constructor(
    private service: WriteserviceService,
    private route: ActivatedRoute,
    private toaster: ToastrService
  ) {}

  ngOnInit(): void {
    
    this.userId = this.route.snapshot.paramMap.get('userId') || '';
    this.postId = this.route.snapshot.paramMap.get('postId') || ''; 

    this.getloggedinusername().then(() => {
      this.initializeSocket(); 
      this.fetchPostContent();
    }).catch((error)=>{
      console.log(error);
      this.toaster.error("something went wrong")
    });


    }
  
    
  ngOnDestroy(): void {
      if (this.socket) {
        this.socket.disconnect();
      }
    }
  
    initializeSocket(): void {
      this.socket = io(
        
        environment.beronyAPI
        ,
        // "http://localhost:3000",
        {
        auth: {
          userId: this.userId,
          postId: this.postId,
          username: this.username,
        },
      });
    
      this.socket.on("textChange", (newText: string) => {
        this.text = newText;
      });
    
      this.socket.on("startEditing", (username: string) => {
        this.editingUser = username;
        // console.log(`${username} is editing right now.`);
      });
    }

  fetchPostContent(): void {
    this.service.getpublishpostdatabyid(this.postId).subscribe(
      (data) => {
        this.text = data.bodyofcontent; 
        this.postdata=data
        // console.log(this.postdata);
      },
      (error) => {
        console.error('Error fetching post content:', error);
      }
    );
  }
  async getloggedinusername(){
    this.loggedInUserAccount = await account.get();
    if (this.loggedInUserAccount) {
      this.username=this.loggedInUserAccount.name;
    }
    // console.log(this.username);
    
  }

  onTextChange(): void {
    this.socket.emit('textChange', this.text);

    console.log(this.text); 
  }
  startEditing(): void {
    this.socket.emit("startEditing",this.username);
  }


  onSaveChanges(): void {
    this.socket.emit('saveChanges', this.text);  
    this.clearCache();
  }
  clearCache(): void {
    this.service.clearPostsCache().subscribe(
      (response) => {
        // console.log('Cache cleared successfully:', response);
        this.toaster.success("changes updated.")
      },
      (error) => {
        console.error('Error clearing cache:', error);
        
      }
    );
  }

  
}
