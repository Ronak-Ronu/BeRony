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

  id:any;
  constructor(private service:WriteserviceService,private router:ActivatedRoute,private ngnavigateservice:NgNavigatorShareService) {}


  ngOnInit(): void {
    this.id=this.router.snapshot.paramMap.get("postid")
    
    this.service.getpublishpostdatabyid(this.id).subscribe((data:WriteModel)=>{
    this.post = data as WriteModel;
    console.log(this.post);
  })
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
  
  
}
