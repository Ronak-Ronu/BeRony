import { Component } from '@angular/core';
import { account, ID,storage } from '../../lib/appwrite';
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
  profileImage:File | null =null
  
  passwordVisible: boolean = false;

constructor(private router:Router,private toastr: ToastrService){}


async login(email: string, password: string) {
  try {
    await account.createEmailPasswordSession(email, password);
    this.loggedInUser = await account.get();
    
    console.log(this.loggedInUser.name);
    console.log(this.loggedInUser.avatar);


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
    const userID=ID.unique()
    await account.create(userID, email, password, name);

    
    if (this.profileImage) {
      await this.uploadAvatar(userID, this.profileImage);
    }    
    
    this.login(email, password);
  } catch (error:any) {
    if(error?.message)
    {
      console.log(error.message);
      this.toastr.error(error.message)

    }
    
  }
  }

  async uploadAvatar(userID:string,profile:File)
  {
    try {
 
      const response = await storage.createFile('670260000014a43cd53f', userID, profile);
      console.log('Avatar uploaded:', response);

    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      this.toastr.error('Failed to upload avatar');
    }
  
  }

async logout() {
    await account.deleteSession('current');
    this.loggedInUser = null;
    this.router.navigate(['/'])
  }

  onFileChange(event:Event)
  {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.profileImage = input.files[0];
    }  
  }


  togglePassword()
  {
    this.passwordVisible=!this.passwordVisible;
  }


}
