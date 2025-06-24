import { Component, Input } from '@angular/core';
import { WriteserviceService } from '../writeservice.service';
import { AiService } from '../services/ai.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.css'
})
export class OverviewComponent {

  @Input() userBio:string=""
  @Input() username:string=""
  @Input() userId:string=""
  @Input() isViewingOwnProfile!: boolean ;
  @Input() userData: any;
  @Input() userPosts: any;


  showAIBioPopup: boolean = false;
  aiGeneratedBio: string = '';
  generatingBio: boolean = false;
  aiBioPrompt: string = '';

  constructor(private service: WriteserviceService, private aiservice: AiService, private toastr: ToastrService) {}

  generateAIBio() {
    if (!this.aiBioPrompt.trim()) {
      this.toastr.warning('Please enter some details about yourself');
      return;
    }
  
    this.generatingBio = true;
    
    const fullPrompt = `Generate a fun, engaging bio for a user profile based on these details:
      - Username: ${this.username}
      - Current bio: ${this.userBio || 'No bio yet'}
      - User's interests/description and data: ${this.aiBioPrompt},${JSON.stringify(this.userData)}
      
      The bio should be:
      - 2-5 sentences max
      - Include emojis
      - Have a playful tone
      - Highlight unique personality traits
      - Based on the post data ${JSON.stringify(this.userPosts)} provide few words like advertising the users posts.
      - Be in HTML format without any <html>, <head>, triple backquotes html or <body> tags 
      `;
  
    this.aiservice.generateContent(fullPrompt).subscribe({
      next: (response) => {
        this.aiGeneratedBio = response.replace(/<\/?[^>]+(>|$)/g, '').trim();
        this.generatingBio = false;
      },
      error: (error) => {
        this.toastr.error('Failed to generate bio. Please try again.');
        this.generatingBio = false;
        console.error('AI Bio Error:', error);
      }
    });
  }

  toggleAIBIOPopup() {
    this.showAIBioPopup = !this.showAIBioPopup;
    if (this.showAIBioPopup) {
      this.aiBioPrompt = '';
      this.aiGeneratedBio = '';
      this.generatingBio = false;
    }
  }

  useAIBio() {
    if (!this.aiGeneratedBio) return;
    
    this.userBio = this.aiGeneratedBio;
    this.service.updateuserBio(this.userId, this.aiGeneratedBio).subscribe({
      next: () => {
        this.toastr.success('Bio updated successfully!');
        this.showAIBioPopup = false;
        this.aiGeneratedBio = '';
        this.aiBioPrompt = '';
      },
      error: (error) => {
        this.toastr.error('Failed to update bio');
        console.error('Update Bio Error:', error);
      }
    });
  }
}
