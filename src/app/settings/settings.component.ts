import { Component, input } from '@angular/core';
import { Input } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { WriteserviceService } from '../writeservice.service';
import { account, storage } from '../../lib/appwrite';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  @Input() userId:string=""
  @Input() isEmailVerified:boolean=false;
  selectedEmoji:string=""
  userBio: string = '';
  verificationMessage:string=""
  emojis: string[] = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇']; // Add more emojis as needed
  selectedProfileImage: File | null = null
  userProfileImageUrl: string | null = null;

  constructor(
    private toastr:ToastrService,
    private service:WriteserviceService,

  ){
  }

  ngOnInit() {
    // console.log('Initial userBio:', this.userBio); // Check initial value
  }
  selectEmoji(emoji:string)
  {
    this.selectedEmoji=emoji
  }
  updateBio() {
    console.log('userBio before update:', this.userBio);
    if (this.userBio==="") {
      this.toastr.error("cannot update empty bio");
    }
    else{
      console.log(this.userId);
      console.log(this.userBio);
      
      this.service.updateuserBio(this.userId,this.userBio).subscribe(
        ()=>{
          this.toastr.success("bio updated")
          console.log(this.userBio);
          
        },
        (error)=>{
          this.toastr.error("cannot update bio")
          console.log(error);
          
        }
      )
    }

  }
  updateEmotion()
  {
    if (!this.selectedEmoji) {
      this.toastr.error("select your emotion")
    }
    else{
      this.service.updateuserEmotion(this.userId,this.selectedEmoji).subscribe(
        ()=>{
          this.toastr.success("reaction updated")
          console.log(this.selectedEmoji);
          
        },
        (error)=>{
          this.toastr.error("can't update emotion")
          console.log(error);
          
        }
      )
    }
  }
  async sendVerificationEmail() {
    try {
      await account.createVerification(`${window.location.origin}/userdashboard`);
      this.verificationMessage = 'Verification email sent! Please check your inbox.';
      this.toastr.success(this.verificationMessage)

    } catch (error) {
      console.error('Error sending verification email:', error);
      this.verificationMessage = 'Failed to send verification email. Please try again.';
      this.toastr.error(this.verificationMessage)
    }
  }


  async onProfileImageChange(event: Event) {
    const input = event.target as HTMLInputElement;
    
    if (input.files && input.files.length > 0) {
      this.selectedProfileImage = input.files[0];
      console.log(this.selectedProfileImage);
      
    }
  }
  async uploadProfileImage() {
    const user = await account.get();  
    console.log(this.selectedProfileImage);  
    try {
      if (!this.selectedProfileImage) {
        throw new Error('No profile image selected');
      }
  
      const userId = user.$id;  
        let getProfile = null;
      try {
        getProfile = await storage.getFile(environment.bucketName, userId);
        // console.log("got existing image:", getProfile);
      } catch (error) {
        // console.log("no existing profile, so uploading...");
      }
        if (getProfile) {
        const deleteResponse = await storage.deleteFile(environment.bucketName, userId);
        // console.log("Avatar deleted", deleteResponse);
      }
      const file = this.selectedProfileImage;
      const uploadResponse = await storage.createFile(environment.bucketName, userId, file);
      // console.log("Avatar uploaded", uploadResponse);
      this.toastr.success("Avatar uploaded")
  
    } catch (error) {
      // console.error("Error uploading profile image", error);
      this.toastr.error("cannot update profile image/verify mail id");
    }
  }
  
  

}
