import { Component, Input, OnInit } from '@angular/core';
import { WriteserviceService } from '../writeservice.service';
import { Router } from '@angular/router';
import { account } from '../../lib/appwrite';

@Component({
  selector: 'app-my-blogs',
  templateUrl: './my-blogs.component.html',
  styleUrl: './my-blogs.component.css'
})
export class MyBlogsComponent implements OnInit {
  @Input() posts: any[] = []; 
  @Input() bookmarkposts: any[] = [];
  @Input() loggedinuserid:string="";
  cursorX: string = '50%'; // Default X-coordinate for glow
  cursorY: string = '50%'; // Default Y-coordinate for glow

  loggedInUserAccount:any=null
  userId!:string
  activeSection: string = 'My-Posts';
  constructor(private service:WriteserviceService,
    private router:Router
  ){}
ngOnInit(): void {
  this.getloggedinuserdata();
  console.log(this.userId);
}


onCardMouseMove(event: MouseEvent) {
  const target = event.target as HTMLElement;
  const rect = target.getBoundingClientRect();
  this.cursorX = `${event.clientX - rect.left}px`;
  this.cursorY = `${event.clientY - rect.top}px`;
}
onCardMouseLeave(): void {
  this.cursorX = '50%';
  this.cursorY = '50%';
}



  setActiveSection(section: string)
  {
    this.activeSection = section;
  }
  async getloggedinuserdata (){
    this.loggedInUserAccount = await account.get();
    if (this.loggedInUserAccount) {
      this.userId=this.loggedInUserAccount.$id;
      console.log(this.userId);
    }
  }

 async deletebookmark(postid:string)
  {
    try {
      this.service.removeBookmark(this.loggedinuserid,postid).subscribe({
        next: (res)=>{
          console.log(res);
          this.bookmarkposts = this.bookmarkposts.filter(post => post._id !== postid);
        },
        error(err) {
          console.log(err);
          
        },
      })
      
      
    } catch (error) {
        console.log(error);
        
    }
    
  }
  navigateToWrite()
  {
    this.router.navigate(['/write']);

  }
 
}
