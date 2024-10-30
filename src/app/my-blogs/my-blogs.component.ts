import { Component, Input } from '@angular/core';
import { WriteserviceService } from '../writeservice.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-my-blogs',
  templateUrl: './my-blogs.component.html',
  styleUrl: './my-blogs.component.css'
})
export class MyBlogsComponent {
  @Input() posts: any[] = []; 
  @Input() bookmarkposts: any[] = [];
  @Input() loggedinuserid:string="";
  activeSection: string = 'My-Posts';
  constructor(private service:WriteserviceService,
    private router:Router
  ){}
  setActiveSection(section: string)
  {
    this.activeSection = section;
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
