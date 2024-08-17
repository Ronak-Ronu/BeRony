import { Component, OnInit } from '@angular/core';
import { account } from '../../lib/appwrite'; 
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit{
  loggedInUser: any = null;

constructor(private router:Router){}
ngOnInit(): void {
  this.checkLoginStatus();
}
async checkLoginStatus() {
  try {
    this.loggedInUser = await account.get();
    console.log('Logged in user:', this.loggedInUser);
  } catch (error) {
    console.log('User not logged in:', error);
    this.loggedInUser = null;
  }
}
async logout() {
  await account.deleteSession('current');
  this.loggedInUser = null;
  this.router.navigate(['/'])
}



}
