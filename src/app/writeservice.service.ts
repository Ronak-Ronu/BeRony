import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { WriteModel } from './Models/writemodel';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment'

@Injectable()
export class WriteserviceService {
  url:string;
  drafturl:string;
  postid:any;
  
  constructor(private http:HttpClient) {

    this.url=`${environment.beronyAPI}/api/posts`
    this.drafturl=`${environment.beronyAPI}/api/drafts`
    
    // this.url='http://localhost:3000/api/posts'
    // this.drafturl='http://localhost:3000/api/drafts'
   }

      
    publishblog(formData:FormData)
    {
      console.log("this is publish blog service");
      formData.forEach((value, key) => {
        console.log(`FormData Key: ${key}, Value: ${value}`);
      });
    
      this.http.post<WriteModel>(this.url,formData).subscribe((res:any)=>{
          console.log(res);
          this.postid=res._id
          
      })
      console.log(formData);
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
    getpublishpostdata(searchQuery: string = ''): Observable<WriteModel[]> {
      return this.http.get<WriteModel[]>(`${this.url}?q=${encodeURIComponent(searchQuery)}`);
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
  
}
