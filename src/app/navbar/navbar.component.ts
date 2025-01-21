import { Component, OnInit } from '@angular/core';
import { account } from '../../lib/appwrite'; 
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit{
  loggedInUser!: boolean;
  loggedInUserAccount:any=null
  menuOpen: boolean = false;
  showTranslate:boolean = false

  
constructor(private router:Router){}



ngOnInit(): void {
  this.checkLoginStatus();
}
async checkLoginStatus() {
  try {
    
    this.loggedInUserAccount = await account.get();
    if (this.loggedInUserAccount) {
      this.loggedInUser=true
    }
    else{
      this.loggedInUser=true
    }
    // console.log('Logged in user:', this.loggedInUser);
  } catch (error) {
    // console.log('User not logged in:', error);
    this.loggedInUser = false;
  }
}
async logout() {
  await account.deleteSession('current');
  this.loggedInUser = false;
  this.router.navigate(['/'])
}
async login() {
  // await account.deleteSession('current');
  this.loggedInUser = true;
  this.router.navigate(['/userlogin'])
}


toggleMenu() {
  this.menuOpen = !this.menuOpen;
}
toggleTranslate() {
  this.showTranslate = !this.showTranslate;
}



}
