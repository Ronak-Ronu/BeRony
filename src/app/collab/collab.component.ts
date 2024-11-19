import { Component, OnInit } from '@angular/core';
import { WriteserviceService } from '../writeservice.service';
import { io, Socket } from 'socket.io-client';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../environments/environment';
import { ToastrService } from 'ngx-toastr';

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
  constructor(
    private service: WriteserviceService,
    private route: ActivatedRoute,
    private toaster: ToastrService
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('userId') || '';
    this.postId = this.route.snapshot.paramMap.get('postId') || ''; 
    this.fetchPostContent();

    this.socket = io(environment.beronyAPI, {
      auth: {
          userId: this.userId,  
          postId: this.postId   
        }
      });
      this.service.text$.subscribe((newText: string) => {
        this.text = newText;
      });
      
      this.socket.on("textChange", (newText:string) => {
          this.text = newText;
      });
    }
    ngOnDestroy(): void {
      if (this.socket) {
        this.socket.disconnect();
      }
    }
  

  fetchPostContent(): void {
    this.service.getpublishpostdatabyid(this.postId).subscribe(
      (data) => {
        this.text = data.bodyofcontent; 
        this.postdata=data
      },
      (error) => {
        console.error('Error fetching post content:', error);
      }
    );
  }

  onTextChange(): void {
    this.socket.emit('textChange', this.text);
    console.log(this.text); 
  }
  onSaveChanges(): void {
    this.socket.emit('saveChanges', this.text);  
    this.clearCache();
  }
  clearCache(): void {
    this.service.clearPostsCache().subscribe(
      (response) => {
        console.log('Cache cleared successfully:', response);
        this.toaster.success("changes updated.")
      },
      (error) => {
        console.error('Error clearing cache:', error);
        
      }
    );
  }
}
