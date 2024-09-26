import { Component } from '@angular/core';
import { account, ID } from '../../lib/appwrite';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';



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


constructor(private router:Router,private toastr: ToastrService){}


async login(email: string, password: string) {
  try {
    await account.createEmailPasswordSession(email, password);
    this.loggedInUser = await account.get();
    console.log(this.loggedInUser.name);
    this.router.navigate(['/write'])

  } catch (error:any) {
    if (error?.message) {
      this.toastr.success(error.message);
      console.log(error.message);
      
    }
    // console.log(error);

  }
   
    
  }

async register(email: string, password: string, name: string) {
  try {
    await account.create(ID.unique(), email, password, name);
    this.login(email, password);

  } catch (error:any) {
    if(error?.message)
    {
      console.log(error.message);
    }
    
  }
  }

async logout() {
    await account.deleteSession('current');
    this.loggedInUser = null;
    this.router.navigate(['/'])
  }


}
