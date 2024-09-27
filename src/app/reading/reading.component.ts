import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WriteModel } from '../Models/writemodel';
import { WriteserviceService } from '../writeservice.service';
// import { WriteserviceService } from '../writeservice.service';
import {NgNavigatorShareService} from 'ng-navigator-share'
import { account } from '../../lib/appwrite';
import { ToastrService } from 'ngx-toastr';

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

  userReactions: { [key: string]: boolean } = {
    funny: false,
    sad: false,
    loveit: false
  };


  constructor(private service:WriteserviceService,private router:ActivatedRoute,private ngnavigateservice:NgNavigatorShareService,private toastr: ToastrService) {}


  ngOnInit(): void {
    this.readblogdatabyid()
    this.getloggedinuserdata()
    this.checkUserReactions();
    
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
                console.log(this.filetype);
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
  
}
