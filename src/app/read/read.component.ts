import { Component, OnInit } from '@angular/core';
import { WriteserviceService } from '../writeservice.service';
import { WriteModel } from '../Models/writemodel';
// import { ActivatedRoute } from '@angular/router';
// import { Router } from '@angular/router';

@Component({
  selector: 'app-read',
  templateUrl: './read.component.html',
  styleUrl: './read.component.css'
})
export class ReadComponent implements OnInit{
  blogs: WriteModel[] = [];
  loggedInUserAccount:any=null
  username!:string
  searchQuery:string=''
  searchResults: any[] = [];


  ngOnInit(): void {
    this.readblogdata()
    
    
  }

  constructor(private readsevice:WriteserviceService){}

  
  readblogdata(){

    this.readsevice.getpublishpostdata(this.searchQuery).subscribe(
      (data:WriteModel[])=>{
          this.blogs=data
          console.log(this.blogs);
          
      }
    )
  }
  onSearch()
  {
    this.readblogdata(); 

    
  }
  


  getid(item:WriteModel)
  {
    console.log(item._id);
    console.log(item.title);

  }


  deletepost(post:WriteModel)
  {
    this.readsevice.deletepostbyid(post._id)
    this.ngOnInit()
  }
  

  getBackgroundImage(item: WriteModel): string {
    return `url(${item.imageUrl})`;
  }




}
