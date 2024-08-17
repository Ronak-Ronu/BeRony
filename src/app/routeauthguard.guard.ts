
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { account } from '../lib/appwrite'; // Replace with your Appwrite path

@Injectable({
  providedIn: 'root'
})
export class routeauthguardGuard implements CanActivate {
  constructor(private router: Router) {}

  async canActivate(): Promise<boolean> {
    try {
      const session = await account.getSession('current');
      if (session) {
        return true;
      } else {
        this.router.navigate(['/userlogin']);
        console.log("login to continue");
        return false;
      }
    } catch (error) {
      this.router.navigate(['/userlogin']);
      console.log("login to continue with error");

      return false;
    }
  }
}
