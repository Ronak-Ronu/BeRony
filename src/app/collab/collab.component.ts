// collab.component.ts
import { Component, OnInit } from '@angular/core';
import { WriteserviceService } from '../writeservice.service';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { account } from '../../lib/appwrite';

@Component({
  selector: 'app-collab',
  templateUrl: './collab.component.html',
  styleUrls: ['./collab.component.css']
})
export class CollabComponent implements OnInit {
  text: string = '';
  postId: string = '';
  userId: string = '';
  postdata: any;
  username: string = '';
  editingUser: string = '';
  loggedInUserAccount: any;

  constructor(
    private service: WriteserviceService,
    private route: ActivatedRoute,
    private toaster: ToastrService
  ) {}

  async ngOnInit(): Promise<void> {
    this.userId = this.route.snapshot.paramMap.get('userId') || '';
    this.postId = this.route.snapshot.paramMap.get('postId') || '';
    try {
      await this.getloggedinusername();
      this.service.connect(this.userId, this.username, this.postId);
      this.service.joinPostRoom(this.postId);
      this.fetchPostContent();

      this.service.listenForTextChange().subscribe((newText) => {
        this.text = newText;
        // console.log('Text updated:', newText);
      });

      this.service.listenForStartEditing().subscribe((username) => {
        // console.log('Received startEditing for user:', username);
        this.editingUser = username;
      });

      this.service.listenForSocketError().subscribe((error) => {
        // console.error('Socket error:', error);
        this.toaster.error(error);
      });
    } catch (error) {
      // console.error('Error in ngOnInit:', error);
      this.toaster.error('Something went wrong');
    }
  }

  ngOnDestroy(): void {
    this.service.leaveRoom(this.postId);
  }

  async getloggedinusername(): Promise<void> {
    try {
      this.loggedInUserAccount = await account.get();
      if (this.loggedInUserAccount) {
        this.userId = this.loggedInUserAccount.$id;
        const userData = await this.service.getUserData(this.userId).toPromise();
        this.username = userData.username || this.loggedInUserAccount.name || this.loggedInUserAccount.email;
        if (!this.username) {
          // console.error('Username is empty');
          this.toaster.error('User not authenticated');
        }
        // console.log('Logged-in username:', this.username);
      } else {
        // console.error('No logged-in user found');
        this.toaster.error('User not authenticated');
      }
    } catch (error) {
      // console.error('Error getting logged-in user:', error);
      this.toaster.error('Something went wrong');
      throw error;
    }
  }

  fetchPostContent(): void {
    this.service.getpublishpostdatabyid(this.postId).subscribe(
      (data) => {
        this.text = data.bodyofcontent;
        this.postdata = data;
        // console.log('Post data fetched:', this.postdata);
      },
      (error) => {
        // console.error('Error fetching post content:', error);
        this.toaster.error('Failed to fetch post content');
      }
    );
  }

  onTextChange(): void {
    this.service.onTextChange(this.text);
    console.log('Text changed:', this.text);
  }

  startEditing(): void {
    console.log('Emitting startEditing for user:', this.username);
    this.service.startEditing(this.username);
  }

  onSaveChanges(): void {
    this.service.saveChanges(this.text);
    this.clearCache();
  }

  clearCache(): void {
    this.service.clearPostsCache().subscribe(
      (response) => {
        this.toaster.success('Changes updated.');
      },
      (error) => {
        console.error('Error clearing cache:', error);
        this.toaster.error('Failed to clear cache');
      }
    );
  }
}