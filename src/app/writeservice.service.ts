import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { WriteModel } from './Models/writemodel';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../environments/environment'
// import { io } from 'socket.io-client';

 interface PromptRequest {
  prompt: string;
}

@Injectable()
export class WriteserviceService {
  url:string;
  findposturl:string;
  drafturl:string;
  postid:any;
  accessKey:string
  baseurl:string
  
  // private socket = io(environment.beronyAPI); 
  private textSubject = new BehaviorSubject<string>(''); 
  text$ = this.textSubject.asObservable();

  constructor(private http:HttpClient) {

    this.url=`${environment.beronyAPI}/api/posts`
    this.drafturl=`${environment.beronyAPI}/api/drafts`
    this.findposturl=`${environment.beronyAPI}/api/findpost`
    this.baseurl=`${environment.beronyAPI}/api`
    this.accessKey=environment.Unsplash_ACCESSKEY
    
    // this.url='http://localhost:3000/api/posts'
    // this.drafturl='http://localhost:3000/api/drafts'
    // this.findposturl='http://localhost:3000/api/findpost'
    // this.baseurl='http://localhost:3000/api'
    // this.socket.on('textChange', (text: string) => {
    //   this.textSubject.next(text);
    // });

   }

    publishblog(formData:FormData):Promise<any>
    {
      console.log("this is publish blog service");
      formData.forEach((value, key) => {
        console.log(`FormData Key: ${key}, Value: ${value}`);
      });
      return new Promise((resolve,reject)=>{
        this.http.post<WriteModel>(this.url,formData).subscribe(
          (res:any)=>{
          // console.log(res);
          this.postid=res._id
          resolve(res);
          // console.log(formData);
        },
        (error)=>{
          console.error('Error publishing blog:', error);
          reject(error)
        }
      )
      })
    }
    
    draftblog(draftdata:WriteModel)
    {
      console.log("this is publish blog service");
      this.http.post<WriteModel>(this.drafturl,draftdata).subscribe((res:any)=>{
        console.log("blog saved to draft");
      })

    }

    getdraftblog():Observable<WriteModel[]>
    {
      return this.http.get<WriteModel[]>(this.drafturl)
    }


    // getpublishpostdata():Observable<WriteModel[]>
    // {
    //   return this.http.get<WriteModel[]>(this.url)
    // }
    getpublishpostdata(start:number,limit:number): Observable<WriteModel[]> {
      const params: any = {};
      // if (searchQuery) {
      //   params.q = encodeURIComponent(searchQuery);
      // }
      // if (tag) {
      //   params.tags = tag;
      // }
      if(start)
      {
        params.start=start
      }
      if(limit)
      {
        params.limit=limit
      }
    
      console.log("Fetching posts with params:", params);
      return this.http.get<WriteModel[]>(this.url,{params});
    }
    clearPostsCache(): Observable<any> {
      return this.http.delete(`${this.baseurl}/clear-posts`);
    }
    getsearchpostdata(tag: string | null=null,query:string='')
    {
      const params: any = {};
      if(tag)
      {
        params.tags=tag;
      }
      if (query) {
        params.q = query;
      }
      console.log("querying",params);
      return this.http.get<WriteModel[]>(this.findposturl,{params})

    }

    
    getpublishpostdatabyid(id:string):Observable<WriteModel>
    {
      return this.http.get<WriteModel>(this.url+"/"+id)
    }


    deletepostbyid(id:string)
    {
      this.http.delete<WriteModel>(this.url+"/"+id).subscribe();
      console.log("deleted"+id);
    }
    deletedraft(id:string)
    {
      this.http.delete<WriteModel>(this.drafturl+"/"+id).subscribe();
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

    // addPostBookmark(userId: string, postId: string) {
    //   return this.http.post(`${this.baseurl}/users/${userId}/bookmarks`, { postId });
    // }
    addPostBookmark(userId:string,postId: string): Observable<any> {
      const body = { postId };  
      return this.http.post(`${this.baseurl}/users/${userId}/bookmarks`, body);
    }

    addUserToDB(userId: string, username: string, userEmail: string): Observable<any> {
      const body = { userId,username,userEmail}; 
      console.log('Request Body:', body);
      return this.http.post(`${this.baseurl}/user/register`, body);
    }

    getBookmark(userId: string): Observable<any> {
      return this.http.get(`${this.baseurl}/users/${userId}/bookmarks`);
    }
    removeBookmark(userId: string, postId: string): Observable<any> {
      return this.http.delete(`${this.baseurl}/users/${userId}/bookmarks/${postId}`);
    }
  
    getPostsByUsername(username:string): Observable<any>{
      return this.http.get(`${this.baseurl}/user/${username}/posts`);
    }
    updateuserBio(userId:string,userBio:string):Observable<any>
    {
      return this.http.patch(`${this.baseurl}/user/${userId}/bio`, { userBio: userBio })
    }
    updateuserEmail(userId:string,userEmail:string):Observable<any>
    {
      return this.http.patch(`${this.baseurl}/user/${userId}/email`, { userEmail:userEmail })
    }
    getUserData(userId:string): Observable<any>
    {
        return this.http.get(`${this.baseurl}/user/${userId}`)
    }

    updateuserEmotion(userId:string,userEmotion:string):Observable<any>
    {
      return this.http.patch(`${this.baseurl}/user/${userId}/emotion`, { userEmotion: userEmotion })
     
    }
  
    searchUsers(query: string): Observable<any> {
      return this.http.get(`${this.baseurl}/search?query=${query}`);
    }
    addCollaborator(postId: string, collaboratorId: string): Observable<any> {
      return this.http.post(`${this.baseurl}/${postId}/add-collaborator`, {
        collaboratorId,
      });
    }
    sendCollaborateInvite(userEmail:string, authorMail:string,authorName:string, postTitle:string, postDescription:string, workspaceLink:string): Observable<any>{
      const body={userEmail, authorMail,authorName, postTitle, postDescription, workspaceLink};
      return this.http.post(`${this.baseurl}/send-collab-invite`,body)
    }
}
