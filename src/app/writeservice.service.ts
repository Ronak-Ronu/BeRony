import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { WriteModel } from './Models/writemodel';
import { Observable } from 'rxjs';

@Injectable()
export class WriteserviceService {
  url:string;
  drafturl:string;
  postid:any;
  
  constructor(private http:HttpClient) {

    this.url="http://localhost:3004/posts"
    this.drafturl="http://localhost:3004/drafts"
   }

      
    publishblog(blogdata:WriteModel)
    {
      console.log("this is publish blog service");
      this.http.post<WriteModel>(this.url,blogdata).subscribe((res:any)=>{
          console.log(res.id);
          this.postid=res.id
          
      })
      console.log(blogdata);
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


    getpublishpostdata():Observable<WriteModel[]>
    {
      return this.http.get<WriteModel[]>(this.url)
    }
    

    
    getpublishpostdatabyid(id:number):Observable<WriteModel>
    {
      return this.http.get<WriteModel>(this.url+"/"+id)
    }


    deletepostbyid(id:number)
    {
      this.http.delete<WriteModel>(this.url+"/"+id).subscribe();
      console.log("deleted"+id);
      
    }
    deletedraft(id:number)
    {
      this.http.delete<WriteModel>(this.drafturl+"/"+id).subscribe();
      console.log("draft deleted");
      
    }
    
  
}
