import { Component, input } from '@angular/core';
import { Input } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { WriteserviceService } from '../writeservice.service';
import { account } from '../../lib/appwrite';

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
}
