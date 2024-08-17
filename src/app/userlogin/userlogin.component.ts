import { Component } from '@angular/core';
import { account, ID } from '../../lib/appwrite';
import { Router } from '@angular/router';



@Component({
  selector: 'app-userlogin',
  templateUrl: './userlogin.component.html',
  styleUrl: './userlogin.component.css'
})
export class UserloginComponent {
  loggedInUser: any = null;
  email: string = '';
  password: string = '';
  name: string = '';


constructor(private router:Router){}
  async login(email: string, password: string) {
    await account.createEmailPasswordSession(email, password);
    this.loggedInUser = await account.get();
    console.log(this.loggedInUser.name);
    this.router.navigate(['/write'])
    
  }

  async register(email: string, password: string, name: string) {
    await account.create(ID.unique(), email, password, name);
    this.login(email, password);
  }

  async logout() {
    await account.deleteSession('current');
    this.loggedInUser = null;
    this.router.navigate(['/'])
  }


}
