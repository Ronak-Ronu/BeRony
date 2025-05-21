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


onMouseMove(event: MouseEvent, element: EventTarget | null) {
  if (!(element instanceof HTMLElement)) return;
  const rect = element.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  element.style.setProperty('--x', `${x}px`);
  element.style.setProperty('--y', `${y}px`);
}

onMouseLeave(element: EventTarget | null) {
  if (!(element instanceof HTMLElement)) return;
  element.style.setProperty('--x', '50%');
  element.style.setProperty('--y', '50%');
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
