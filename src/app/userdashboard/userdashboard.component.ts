import { Component, OnInit } from '@angular/core';
import { account } from '../../lib/appwrite';

@Component({
  selector: 'app-userdashboard',
  templateUrl: './userdashboard.component.html',
  styleUrl: './userdashboard.component.css'
})
export class UserdashboardComponent implements OnInit{

  username!:string
  loggedInUserAccount:any=null
  userId!:string
  activeSection: string = 'overview';
  ngOnInit(): void {
    this.getloggedinuserdata()
  }
  async getloggedinuserdata (){
    this.loggedInUserAccount = await account.get();
    if (this.loggedInUserAccount) {
      this.username=this.loggedInUserAccount.name;
      this.userId=this.loggedInUserAccount.$id;
     
    }
  }
  setActiveSection(section: string)
  {
    this.activeSection = section;
  }
  
}
