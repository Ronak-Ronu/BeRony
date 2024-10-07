import { Component, OnInit,ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WriteModel } from '../Models/writemodel';
import { WriteserviceService } from '../writeservice.service';
// import { WriteserviceService } from '../writeservice.service';
import {NgNavigatorShareService} from 'ng-navigator-share'
import { account } from '../../lib/appwrite';
import { ToastrService } from 'ngx-toastr';
import { Client, Databases, ID, Query } from 'appwrite';
import { environment } from '../../environments/environment';
import axios from 'axios';

@Component({
  selector: 'app-reading',
  templateUrl: './reading.component.html',
  styleUrls: ['./reading.component.css']
})

export class ReadingComponent implements OnInit {
  post!:WriteModel
  username!:string
  postadmin!:string
  filetype!:any
  _id:any;
  postid:any
  userReaction:string=''
  funnycount!:number
  sadcount!:number
  loveitcount!:number
  loggedInUserAccount:any=null
  tagsarray:string[]=[]
  newCommentText:string='';
  comments: any[] = [];
  gifSearchQuery: string = ''; 
  gifs: any[] = []; 

  userReactions: { [key: string]: boolean } = {
    funny: false,
    sad: false,
    loveit: false
  };
  databases: Databases;


  constructor(private service:WriteserviceService,private cdr: ChangeDetectorRef,private router:ActivatedRoute,private ngnavigateservice:NgNavigatorShareService,private toastr: ToastrService)
   {
    const client = new Client().
    setEndpoint(environment.appwriteEndpoint)
    .setProject(environment.appwriteProjectId);


    this.databases = new Databases(client);
  }


  ngOnInit(): void {
    this.readblogdatabyid()
    this.getloggedinuserdata()
    this.checkUserReactions();
    this.fetchComments();
  //   this._id=this.router.snapshot.paramMap.get("postid")
    
  //   this.service.getpublishpostdatabyid(this._id).subscribe((data:WriteModel)=>{
  //   this.post = data ;
  //   console.log(this.post);
  //   console.log(this._id);
    
  // })


  }
  async getloggedinuserdata (){
    this.loggedInUserAccount = await account.get();
    if (this.loggedInUserAccount) {
      this.username=this.loggedInUserAccount.name;
      console.log(this.username);
      
    }
  }
  


  readblogdatabyid(){

  this.router.paramMap.subscribe(params => {
    this.postid = params.get('postid');
    this.service.getpublishpostdatabyid(this.postid).subscribe({
            next: (data: WriteModel) => {
                this.post = data;
                console.log(this.post);
                this.filetype = this.post.imageUrl.split('.').pop();
                this.tagsarray = this.post.tags;
                console.log(this.filetype);
                console.log(this.tagsarray);
                
            },
            error: (error) => {
                console.error('Error fetching post data:', error);
            }
        });
    });
  }


  share(){
    this.ngnavigateservice.share({
      title:this.post.title,
      text:this.post.endnotecontent,
      url:`http://localhost:4200/reading/${this.postid}`
    }).then((res)=>{
      console.log(res);
    })
  }
  
  updateReactionCount(emoji: string, likecount: number) {
    if (this.username) {
     
      this.service.updateReaction(this.postid, emoji, likecount>=0).subscribe({
        next: (updatedPost:any) => {

          this.funnycount = updatedPost.funnycount;
          this.sadcount = updatedPost.sadcount;
          this.loveitcount = updatedPost.loveitcount;
          console.log(updatedPost);
          
        },
        error: (error:any) => {
          console.error('Error updating reaction count:', error);
        }
      });
    } else {
      this.toastr.error("Please log in to like the post.")
      console.log('Please log in to like the post.');
    }
  }
  

  addLike(emoji: string) {
    if (this.username) {
      const localStorageKey = `reaction_${this.postid}_${emoji}`;
      const alreadyLiked = localStorage.getItem(localStorageKey);
       if (alreadyLiked) {
        localStorage.removeItem(localStorageKey);

        this.updateReactionCount(emoji, -1);
        this.userReactions[emoji] = false;
       }
       else
       {
        localStorage.setItem(localStorageKey, 'true');

         this.updateReactionCount(emoji, 1);
        this.userReactions[emoji] = true;
       }
      
  }
  else{
    console.log("login to like posts");
    
  }
}

checkUserReactions() {
  const reactions = ['funny', 'sad', 'loveit'];
  reactions.forEach((emoji) => {
    const localStorageKey = `reaction_${this.postid}_${emoji}`;
    if (localStorage.getItem(localStorageKey)) {
      this.userReactions[emoji] = true; 
    }
  });
}


async addComment()
{
    if (this.newCommentText.trim() && this.postid && this.loggedInUserAccount) {
      try {
        const response = await this.databases.createDocument(
          environment.databaseId, 
          environment.collectionId, 
          ID.unique(), 
          {
            postId: this.postid,
            userId: this.loggedInUserAccount.$id,
            commentusername:this.username,
            commentText: this.newCommentText,
            createdAt: new Date().toISOString(),
            username: this.loggedInUserAccount.name
          }
        );
        // console.log('Comment added:', response);
        
        this.newCommentText = ''; 
        this.comments.push(this.newCommentText);
        this.ngOnInit()
      } catch (error) {
        console.error('Error adding comment:', error);
      }
    } else {
      console.error('Please log in to add comment');
    }

}
async fetchComments()
{
  if (this.postid) {
    try {
      const response = await this.databases.listDocuments(
        environment.databaseId, 
        environment.collectionId, 
        [Query.equal('postId', this.postid)]
      );
      this.comments = response.documents;
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }

}

refreshcomponent(){
  this.fetchComments()
  this.cdr.detectChanges();
}


  
async searchGifs() {
  const apiKey = environment.giphyAPIKEY; // Replace with your Giphy API key
  try {
    const response = await axios.get(`https://api.giphy.com/v1/gifs/search`, {
      params: {
        api_key: apiKey,
        q: this.gifSearchQuery,
        limit: 16 // Limit results
      }
    });
    this.gifs = response.data.data; // Set gifs with the response data
  } catch (error) {
    console.error('Error fetching GIFs', error);
  }
}

selectGif(gif: any) {
  // const gifUrl = gif.images.original.url
  const gifUrl=gif.images.fixed_height.url
  console.log('Click to send gif:', gif);
  this.newCommentText+=`<img style="width:40% !important; height: auto;" src="${gifUrl}" />`
  console.log(this.newCommentText);
  this.addComment()

}


}