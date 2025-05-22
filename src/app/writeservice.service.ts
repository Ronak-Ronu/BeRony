import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { WriteModel } from './Models/writemodel';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../environments/environment';
import { io, Socket } from 'socket.io-client';

interface ChatMessage {
  roomId: string;
  userId: string;
  username: string;
  message?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'gif';
  createdAt: string;
}

interface ChatRoom {
  roomId: string;
  title: string;
  creatorId: string;
  creatorUsername: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class WriteserviceService {
  url: string;
  findposturl: string;
  drafturl: string;
  postid: any;
  accessKey: string;
  baseurl: string;
  private socket: Socket;
  textSubject = new BehaviorSubject<string>('');
  text$ = this.textSubject.asObservable();
  private messagesSubject = new Subject<ChatMessage>();
  private chatHistorySubject = new Subject<ChatMessage[]>();
  private errorSubject = new Subject<string>();
  private roomCreatedSubject = new Subject<ChatRoom>();

  constructor(private http: HttpClient) {
    // this.url = 'http://localhost:3000/api/posts';
    // this.drafturl = 'http://localhost:3000/api/drafts';
    // this.findposturl = 'http://localhost:3000/api/findpost';
    // this.baseurl = 'http://localhost:3000'; 


    this.url=`${environment.beronyAPI}/api/posts`
    this.drafturl=`${environment.beronyAPI}/api/drafts`
    this.findposturl=`${environment.beronyAPI}/api/findpost`
    this.baseurl=`${environment.beronyAPI}`

    this.accessKey = environment.Unsplash_ACCESSKEY;

    console.log('Initializing Socket.io client to:', this.baseurl);
    this.socket = io(this.baseurl);
  }

  connect(userId: string, username: string): void {
    console.log('Connecting Socket.io with:', { userId, username });
    if (!userId || !username) {
      console.error('Cannot connect: userId and username are required');
      this.errorSubject.next('Please provide userId and username');
      return;
    }
    this.socket.auth = { userId, username };
    this.socket.connect();

    this.socket.on('connect', () => {
      console.log('Socket.io connected successfully');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      this.errorSubject.next('Failed to connect to chat server');
    });

    this.socket.on('chatMessage', (message: ChatMessage) => {
      console.log('Received chat message:', message);
      this.messagesSubject.next(message);
    });

    this.socket.on('chatHistory', (history: ChatMessage[]) => {
      console.log('Received chat history:', history);
      this.chatHistorySubject.next(history);
    });

    this.socket.on('chatError', (error: { message: string }) => {
      console.error('Chat error:', error.message);
      this.errorSubject.next(error.message);
    });

    this.socket.on('roomCreated', (room: ChatRoom) => {
      console.log('Room created event received:', room);
      this.roomCreatedSubject.next(room);
    });

    this.socket.on('roomError', (error: { message: string }) => {
      console.error('Room error:', error.message);
      this.errorSubject.next(error.message);
    });
    this.socket.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        this.socket.connect(); // Try reconnect
      }
    });
    
  }

  joinRoom(roomId: string, userId: string, username: string): void {
    console.log('Joining room:', { roomId, userId, username });
    this.socket.auth = { userId, username };
    if (!this.socket.connected) {
      this.socket.connect();
    }
    this.socket.emit('joinChatRoom', roomId);
    this.socket.emit('getChatHistory', roomId);
  }
  

  leaveRoom(roomId: string): void {
    console.log('Leaving room:', roomId);
    this.socket.emit('leaveChatRoom', roomId);
    this.socket.disconnect();
  }

  sendMessage(roomId: string, message: string, mediaFile: File | null): void {
    console.log('Sending message:', { roomId, message, mediaFile: mediaFile ? mediaFile.name : null });
    if (mediaFile) {
      const reader = new FileReader();
      reader.onload = () => {
        const media = {
          buffer: reader.result as string,
          mimetype: mediaFile.type
        };
        this.socket.emit('sendChatMessage', { roomId, message, media });
      };
      reader.onerror = () => {
        console.error('Error reading file:', reader.error);
        this.errorSubject.next('Failed to read media file');
      };
      reader.readAsDataURL(mediaFile);
    } else {
      this.socket.emit('sendChatMessage', { roomId, message });
    }
  }

  createRoom(roomId: string, title: string, creatorId: string, creatorUsername: string): Observable<ChatRoom> {
    const url = `${this.baseurl}/api/chat/rooms`;
    console.log('Sending create room request to:', url, { roomId, title, creatorId, creatorUsername });
    const requestBody = { roomId, title, creatorId, creatorUsername };
    return this.http.post<ChatRoom>(url, requestBody);
  }

  getRooms(): Observable<ChatRoom[]> {
    const url = `${this.baseurl}/api/chat/rooms`;
    console.log('Fetching rooms from:', url);
    return this.http.get<ChatRoom[]>(url);
  }

  getMessages(): Observable<ChatMessage> {
    return this.messagesSubject.asObservable();
  }

  getChatHistory(): Observable<ChatMessage[]> {
    return this.chatHistorySubject.asObservable();
  }
  getChatHistoryHttp(roomId: string): Observable<ChatMessage[]> {
    const url = `${this.baseurl}/api/chat/messages/${roomId}`;
    console.log('Fetching chat history from:', url);
    return this.http.get<ChatMessage[]>(url);
  }

  getErrors(): Observable<string> {
    return this.errorSubject.asObservable();
  }

  getRoomCreated(): Observable<ChatRoom> {
    return this.roomCreatedSubject.asObservable();
  }

  publishblog(formData: FormData): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.post(this.url, formData).subscribe({
        next: (res) => resolve(res),
        error: (err) => reject(err),
      });
    });
  }

  draftblog(draftdata: WriteModel) {
    console.log("this is publish blog service");
    this.http.post<WriteModel>(this.drafturl, draftdata).subscribe((res: any) => {
      console.log("blog saved to draft");
    });
  }

  getdraftblog(): Observable<WriteModel[]> {
    return this.http.get<WriteModel[]>(this.drafturl);
  }

  getpublishpostdata(start: number, limit: number): Observable<WriteModel[]> {
    const params: any = {};
    if (start) params.start = start;
    if (limit) params.limit = limit;
    console.log("Fetching posts with params:", params);
    return this.http.get<WriteModel[]>(this.url, { params });
  }

  clearPostsCache(): Observable<any> {
    return this.http.delete(`${this.baseurl}/api/clear-posts`);
  }

  deleteTree(userId: String): Observable<any> {
    return this.http.delete(`${this.baseurl}/api/tree/${userId}`);
  }

  getsearchpostdata(tag: string | null = null, query: string = '') {
    const params: any = {};
    if (tag) params.tags = tag;
    if (query) params.q = query;
    console.log("querying", params);
    return this.http.get<WriteModel[]>(this.findposturl, { params });
  }

  getpublishpostdatabyid(id: string): Observable<WriteModel> {
    return this.http.get<WriteModel>(this.url + "/" + id);
  }

  deletepostbyid(id: string) {
    this.http.delete<WriteModel>(this.url + "/" + id).subscribe();
    console.log("deleted" + id);
  }

  deletedraft(id: string) {
    this.http.delete<WriteModel>(this.drafturl + "/" + id).subscribe();
    console.log("draft deleted");
  }

  updateReaction(postId: string, emoji: string, increment: boolean) {
    return this.http.patch(`${this.url}/like/${postId}`, { emoji, increment });
  }

  searchPhotos(query: string, page: number = 1, perPage: number = 10): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Client-ID ${this.accessKey}`);
    console.log(query);
    return this.http.get(`https://api.unsplash.com/search/photos?query=${query}&page=${page}&per_page=${perPage}`, { headers });
  }

  addPostBookmark(userId: string, postId: string): Observable<any> {
    const body = { postId };
    return this.http.post(`${this.baseurl}/api/users/${userId}/bookmarks`, body);
  }

  addUserToDB(userId: string, username: string, userEmail: string): Observable<any> {
    const body = { userId, username, userEmail };
    console.log('Request Body:', body);
    return this.http.post(`${this.baseurl}/api/user/register`, body);
  }

  getBookmark(userId: string): Observable<any> {
    return this.http.get(`${this.baseurl}/api/users/${userId}/bookmarks`);
  }

  removeBookmark(userId: string, postId: string): Observable<any> {
    return this.http.delete(`${this.baseurl}/api/users/${userId}/bookmarks/${postId}`);
  }

  getPostsByUsername(username: string): Observable<any> {
    return this.http.get(`${this.baseurl}/api/user/${username}/posts`);
  }

  updateuserBio(userId: string, userBio: string): Observable<any> {
    return this.http.patch(`${this.baseurl}/api/user/${userId}/bio`, { userBio: userBio });
  }

  updateuserEmail(userId: string, userEmail: string): Observable<any> {
    return this.http.patch(`${this.baseurl}/api/user/${userId}/email`, { userEmail: userEmail });
  }

  getUserData(userId: string): Observable<any> {
    return this.http.get(`${this.baseurl}/api/user/${userId}`);
  }

  updateuserEmotion(userId: string, userEmotion: string): Observable<any> {
    return this.http.patch(`${this.baseurl}/api/user/${userId}/emotion`, { userEmotion: userEmotion });
  }

  searchUsers(query: string): Observable<any> {
    return this.http.get(`${this.baseurl}/api/search?query=${query}`);
  }

  followUser(currentuserid: string, method: string, userid: string): Observable<any> {
    return this.http.post(`${this.baseurl}/api/${currentuserid}/${method}/${userid}`, {});
  }

  unfollowUser(currentuserid: string, method: string, userid: string): Observable<any> {
    return this.http.post(`${this.baseurl}/api/${currentuserid}/${method}/${userid}`, {});
  }

  addCollaborator(postId: string, collaboratorId: string): Observable<any> {
    return this.http.post(`${this.baseurl}/api/${postId}/add-collaborator`, { collaboratorId });
  }

  sendCollaborateInvite(userEmail: string, authorMail: string, authorName: string, postTitle: string, postDescription: string, workspaceLink: string): Observable<any> {
    const body = { userEmail, authorMail, authorName, postTitle, postDescription, workspaceLink };
    return this.http.post(`${this.baseurl}/api/send-collab-invite`, body);
  }

  uploadStory(userId: string, formData: FormData): Observable<any> {
    return this.http.post(`${this.baseurl}/api/stories`, formData);
  }
  getAllStories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseurl}/api/stories`);
  }

  getStoryById(storyId: string): Observable<any> {
    return this.http.get<any>(`${this.baseurl}/api/stories/${storyId}`);
  }


  ngOnDestroy() {
  this.messagesSubject.complete();
  this.chatHistorySubject.complete();
  this.errorSubject.complete();
  this.roomCreatedSubject.complete();
}

}