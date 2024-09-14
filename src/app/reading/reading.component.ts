import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WriteModel } from '../Models/writemodel';
import { WriteserviceService } from '../writeservice.service';
// import { WriteserviceService } from '../writeservice.service';
import {NgNavigatorShareService} from 'ng-navigator-share'

@Component({
  selector: 'app-reading',
  templateUrl: './reading.component.html',
  styleUrls: ['./reading.component.css']
})
export class ReadingComponent implements OnInit {
  post!:WriteModel
  username!:string
  filetype!:any
  _id:any;

  userReaction:string=''
  funnycount:number=0
  sadcount:number=0
  loveitcount:number=0


  constructor(private service:WriteserviceService,private router:ActivatedRoute,private ngnavigateservice:NgNavigatorShareService) {}


  ngOnInit(): void {
    this.readblogdatabyid()
  //   this._id=this.router.snapshot.paramMap.get("postid")
    
  //   this.service.getpublishpostdatabyid(this._id).subscribe((data:WriteModel)=>{
  //   this.post = data ;
  //   console.log(this.post);
  //   console.log(this._id);
    
  // })

  }

  readblogdatabyid(){
  //   this._id=this.router.snapshot.paramMap.get("postid")
    
  //   this.service.getpublishpostdatabyid(this._id).subscribe((data:WriteModel)=>{
  //   this.post = data ;
  //   console.log(this.post);
  //   console.log(this._id);
  //   this.filetype=this.post.imageUrl.split('.').pop()
  //   console.log(this.filetype);
    
  // })
  this.router.paramMap.subscribe(params => {
    const postid = params.get('postid');
    if (postid) {
        this.service.getpublishpostdatabyid(postid).subscribe({
            next: (data: WriteModel) => {
                this.post = data;
                console.log(this.post);
                this.filetype = this.post.imageUrl.split('.').pop();
                console.log(this.filetype);
            },
            error: (error) => {
                console.error('Error fetching post data:', error);
                // Handle error, e.g., redirect or show error message
            }
        });
    } else {
        console.error('Post ID is missing from the URL');
        // Handle missing post ID
    }
});

  }


  share(){
    this.ngnavigateservice.share({
      title:this.post.title,
      text:this.post.endnotecontent,
      url:'https://github.com/Ronak-Ronu'
    }).then((res)=>{
      console.log(res);
    })
  }
  
  addLike(emoji:string)
  {
    if (emoji==='funny') {
      this.funnycount+=1;
    }
    if(emoji==='sad')
    {
      this.sadcount+=1;
    }
    if(emoji==='loveit')
    {
      this.loveitcount+=1
    }
  }
}
