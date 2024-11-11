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
  selectedProfileImage: File | null = null;
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
  onProfileImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedProfileImage = input.files[0];
    }
  }

  // Update the profile image
  async updateProfileImage(): Promise<void> {
    if (!this.selectedProfileImage) {
      this.toastr.error('Please select a profile image');
      return;
    }

    const user = await account.get(); // Get the current logged-in user

    try {
      // Step 1: Check if the user already has a profile image
      const existingImageFileId = await this.getExistingProfileImageFileId(user.$id);

      // Step 2: If a profile image exists, delete the old one
      if (existingImageFileId) {
        await this.deleteOldProfileImage(existingImageFileId);
      }

      // Step 3: Upload the new profile image
      const fileUploadResponse = await this.uploadProfileImage(user.$id, this.selectedProfileImage);
      this.toastr.success('Profile image updated successfully');
      
      // Step 4: Set the new profile image URL
      const imageUrl = `https://cloud.appwrite.io/v1/storage/buckets/${environment.bucketName}/files/${fileUploadResponse.$id}/view`;
      this.userProfileImageUrl = imageUrl;

    } catch (error) {
      console.error('Error updating profile image:', error);
      this.toastr.error('Failed to update profile image');
    }
  }

  // Helper function to upload the profile image
  async uploadProfileImage(userId: string, file: File): Promise<any> {
    try {
      // Upload the file with the user ID as the file ID (replace any existing file with the same ID)
      const fileUploadResponse = await storage.createFile(environment.bucketName, userId, file);
      return fileUploadResponse;
    } catch (error) {
      throw error;
    }
  }

  // Helper function to get the existing profile image file ID (if it exists)
  async getExistingProfileImageFileId(userId: string): Promise<string | null> {
    try {
      // List files in the storage bucket filtered by user ID to find the existing profile image
      const filters = [
        `userId=${userId}` // Using the proper format for the filter string
      ];

      const files = await storage.listFiles(environment.bucketName, filters);      // If there's a file, return its ID, otherwise return null
      if (files.files.length > 0) {
        return files.files[0].$id;
      }
      return null;
    } catch (error) {
      console.error('Error retrieving existing profile image:', error);
      return null; // If there's an error, return null
    }
  }

  // Helper function to delete the old profile image
  async deleteOldProfileImage(fileId: string): Promise<void> {
    try {
      await storage.deleteFile(environment.bucketName, fileId);
      this.toastr.success('Old profile image deleted successfully');
    } catch (error) {
      console.error('Error deleting old profile image:', error);
      this.toastr.error('Failed to delete old profile image');
    }
  }

  // Method to set the URL of the current profile image (if available)
  setUserProfileImageUrl(userId: string) {
    const imageUrl = `https://cloud.appwrite.io/v1/storage/buckets/${environment.bucketName}/files/${userId}/view`;
    this.userProfileImageUrl = imageUrl;
  }



}
