import { Component, OnInit, AfterViewInit } from '@angular/core';
import { account } from '../../lib/appwrite';
import { WriteserviceService } from '../writeservice.service';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../environments/environment';
import * as fabric from 'fabric';
import axios from 'axios';

@Component({
  selector: 'app-userdashboard',
  templateUrl: './userdashboard.component.html',
  styleUrls: ['./userdashboard.component.css'],
})
export class UserdashboardComponent implements OnInit, AfterViewInit {
  username: string = 'Guest 🫣';
  loggedInUserAccount: any = null;
  userId!: string;
  activeSection: string = 'overview';
  posts: any[] = [];
  error: string = '';
  bookmarkposts: any[] = [];
  userEmotion: string = '';
  userBio: string = '';
  userData: any;
  isEmailVerified: boolean = false;
  isViewingOwnProfile: boolean = false;
  bucketName: string | null = null;
  project: string | null = null;
  mode: string | null = null;
  imageurl: string | null = null;
  routeUserId: string | null = '';
  loading: boolean = true;
  loggedinuserid!: string;
  viewprofileuserId!: string;
  isFollowing: boolean = false;
  followingtrue: boolean = false;
  follwingfalse: boolean = false;
  isPlanting: boolean = false;
  userBadges: any[] = [];
  file: File | null = null;
  uploading = false;
  canvas!: fabric.Canvas;
  pickedcolor: string = '#000000';
  brushsize: number = 11;
  brushtype: string = 'pencil';
  showEditor: boolean = false;
  isDragging: boolean = false;
  gifSearchQuery: string = '';
  gifs: any[] = [];
  showStickerWindow: boolean = false;

  constructor(
    private service: WriteserviceService,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {}

  async ngOnInit() {
    this.loading = true;
    this.bucketName = encodeURIComponent(environment.bucketName);
    this.project = encodeURIComponent(environment.project);
    this.mode = encodeURIComponent(environment.mode);

    this.loggedInUserAccount = await account.get();
    this.loggedinuserid = this.loggedInUserAccount?.$id || '';

    this.route.paramMap.subscribe((params) => {
      this.routeUserId = params.get('userId');

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

  ngAfterViewInit() {
    // Canvas initialization is handled in openEditor
  }

  openEditor() {
    this.showEditor = true;
    setTimeout(() => {
      this.canvas = new fabric.Canvas('fabricCanvasdashboard', {
        isDrawingMode: false,
      });
      this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
      this.canvas.freeDrawingBrush.color = this.pickedcolor;
      this.canvas.freeDrawingBrush.width = this.brushsize;
    }, 0);
  }

  closeEditor() {
    this.showEditor = false;
    this.file = null;
    this.isDragging = false;
    this.showStickerWindow = false;
    this.gifSearchQuery = '';
    this.gifs = [];
    if (this.canvas) {
      this.canvas.clear();
      this.canvas.dispose();
    }
  }

  toggleStickerWindow() {
    this.showStickerWindow = !this.showStickerWindow;
    if (this.showStickerWindow) {
      this.searchGifs();
    } else {
      this.gifs = [];
      this.gifSearchQuery = '';
    }
  }

  async searchGifs() {
    const apiKey = environment.giphyAPIKEY;
    try {
      const response = await axios.get(`https://api.giphy.com/v1/stickers/search`, {
        params: {
          api_key: apiKey,
          q: this.gifSearchQuery,
          limit: 16,
        },
      });
      this.gifs = response.data.data;
    } catch (error) {
      console.error('Error fetching GIFs', error);
      this.toastr.error('Failed to fetch GIFs');
    }
  }

  selectGif(gif: any) {
    const gifUrl = gif.images.fixed_height.url;
    const imageElement = document.createElement('img');
    imageElement.crossOrigin = 'anonymous';
    imageElement.src = gifUrl;

    imageElement.onload = () => {
      const image = new fabric.Image(imageElement, {
        left: this.canvas.getWidth() / 2,
        top: this.canvas.getHeight() / 2,
        originX: 'center',
        originY: 'center',
      });
      this.canvas.add(image);
      this.canvas.setActiveObject(image);
      image.scale(0.7);
      this.canvas.renderAll();
      this.showStickerWindow = false;
      this.gifSearchQuery = '';
      this.gifs = [];
    };

    imageElement.onerror = () => {
      this.toastr.error('Failed to load GIF');
    };
  }

  selectBrush(type: string) {
    this.brushtype = type;
    switch (type) {
      case 'pencil':
        this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
        break;
      case 'spray':
        this.canvas.freeDrawingBrush = new fabric.SprayBrush(this.canvas);
        break;
      case 'circle':
        this.canvas.freeDrawingBrush = new fabric.CircleBrush(this.canvas);
        break;
      default:
        this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
    }
    this.canvas.freeDrawingBrush.color = this.pickedcolor;
    this.canvas.freeDrawingBrush.width = this.brushsize;
    this.canvas.isDrawingMode = true;
  }

  setBrushColor() {
    if (this.canvas && this.canvas.freeDrawingBrush) {
      this.canvas.freeDrawingBrush.color = this.pickedcolor;
    }
  }

  setBrushSize() {
    if (this.canvas && this.canvas.freeDrawingBrush) {
      this.canvas.freeDrawingBrush.width = this.brushsize;
    }
  }

  addText() {
    const text = new fabric.Textbox('Type Your Text Here', {
      left: this.canvas.getWidth() / 3,
      top: this.canvas.getHeight() / 3,
      width: this.canvas.getWidth() * 0.4,
      originX: 'center',
      originY: 'center',
      fill: this.pickedcolor,
    });
    this.canvas.add(text);
    this.canvas.renderAll();
  }

  async getloggedinuserdata() {
    this.loggedInUserAccount = await account.get();
    if (this.loggedInUserAccount) {
      this.username = this.loggedInUserAccount.name;
      this.loggedinuserid = this.loggedInUserAccount.$id;
      this.isEmailVerified = this.loggedInUserAccount.emailVerification;
      this.imageurl = `https://cloud.appwrite.io/v1/storage/buckets/${this.bucketName}/files/${this.userId}/view?project=${this.project}&mode=${this.mode}`;

      this.service.getUserData(this.userId || '').subscribe(
        (data) => {
          this.userData = data.user;
          this.fetchUserPosts();
          this.loading = false;
        },
        (error) => {
          console.log(error);
        }
      );

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

  setActiveSection(section: string) {
    this.activeSection = section;
  }

  fetchUserPosts() {
    this.service.getPostsByUsername(this.username).subscribe({
      next: (data) => {
        this.posts = data;
      },
      error: (err) => {
        this.error = 'Error fetching posts.';
        this.toastr.error('no post found.');
        console.error(err);
        this.loading = false;
      },
    });
  }

  fetchUserData(userId: string) {
    this.service.getUserData(userId).subscribe(
      (data) => {
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

  fetchbookmarks() {
    this.service.getBookmark(this.userId || '').subscribe({
      next: (data) => {
        this.bookmarkposts = data;
      },
      error: (err) => {
        this.error = 'Error fetching bookmarks.';
        console.error(err);
      },
    });
  }

  shareProfile() {
    if (navigator.share) {
      navigator.share({
        title: 'Check this author on BeRony ',
        text: '👋 I found this amazing content writer on berony which you might like!',
        url: window.location.href,
      });
    } else {
      const url = window.location.href;
      navigator.clipboard.writeText(url).then(() => {
        alert('URL copied to clipboard! 📋');
      });
    }
  }

  followUser(currentuserid: string, userid: string) {
    this.service.followUser(currentuserid, 'Follow', userid).subscribe(
      (response) => {
        this.toastr.success(response.message);
      },
      (error) => {
        this.toastr.warning(error.error.message);
        this.followingtrue = true;
      }
    );
  }

  unfollowUser(currentuserid: string, userid: string) {
    this.service.unfollowUser(currentuserid, 'Unfollow', userid).subscribe(
      (response) => {
        this.toastr.success(response.message);
      },
      (error) => {
        this.toastr.warning(error.error.message);
      }
    );
  }

  plantTree() {
    const userId = this.loggedinuserid;
    window.location.href = `https://beronyuseraddtree1234.web.app/${userId}`;
  }

  profilecard() {
    const userId = this.loggedinuserid;
    const queryParams = new URLSearchParams({
      username: this.username || 'Unknown User',
      userBio: this.userBio || 'No bio',
      userEmotion: this.userEmotion || '😊',
      imageurl: this.imageurl || '',
      totalPosts: this.posts.length.toString() || '0',
    }).toString();

    window.location.href = `https://beronyuseraddtree1234.web.app/threedprofile/${userId}?${queryParams}`;
  }

  unplantTree() {
    const userId = this.loggedinuserid;
    this.service.deleteTree(userId).subscribe(
      (response) => {
        this.toastr.success('Tree Unplanted 😥');
      },
      (error) => {
        this.toastr.warning('Something went wrong!');
      }
    );
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.file = input.files[0];
      this.handleFile(this.file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files && files[0]) {
      if (files[0].type.startsWith('image/') || files[0].type.startsWith('video/')) {
        this.file = files[0];
        this.handleFile(this.file);
      } else {
        this.toastr.error('Please drop an image or video file.');
      }
    }
  }

  handleFile(file: File): void {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const imgUrl = e.target?.result;
        if (typeof imgUrl === 'string') {
          this.openEditor();
          const imageElement = document.createElement('img');
          imageElement.src = imgUrl;
          imageElement.onload = () => {
            const image = new fabric.Image(imageElement, {
              selectable: true,
              scaleX: 400 / imageElement.width,
              scaleY: 600 / imageElement.height,
            });
            this.canvas.add(image);
            this.canvas.setActiveObject(image);
            this.canvas.renderAll();
          };
        } else {
          console.error('Image data could not be read as a string.');
        }
      };
    } else if (file.type.startsWith('video/')) {
      this.uploadStory(file);
    }
  }

  uploadStory(file?: File): void {
    const uploadFile = file || this.file;
    if (!this.userId || !uploadFile) {
      this.toastr.error('Please select a file to add story!');
      return;
    }

    if (uploadFile.type.startsWith('image/') && this.canvas) {
      this.uploading = true;
      this.canvas.getElement().toBlob((blob) => {
        if (blob) {
          const canvasFile = new File([blob], `story-${this.userId}.png`, {
            type: 'image/png',
          });
          this.uploadToServer(canvasFile);
        } else {
          this.uploading = false;
          this.toastr.error('Failed to process image');
        }
      }, 'image/png');
    } else if (uploadFile.type.startsWith('video/')) {
      this.uploading = true;
      this.uploadToServer(uploadFile);
    }
  }

  private uploadToServer(file: File): void {
    this.service.uploadStory(this.userId, file).subscribe({
      next: (response) => {
        this.uploading = false;
        this.toastr.success('Story uploaded, hurray!');
        this.closeEditor();
      },
      error: (error) => {
        this.uploading = false;
        this.toastr.error('Something went wrong');
        console.error(error);
      },
    });
  }
}