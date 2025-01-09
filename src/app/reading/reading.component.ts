import { Component, OnInit,ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WriteModel } from '../Models/writemodel';
import { WriteserviceService } from '../writeservice.service';
import { account } from '../../lib/appwrite';
import { ToastrService } from 'ngx-toastr';
import { Client, Databases, ID, Query } from 'appwrite';
import { environment } from '../../environments/environment';
import { DomSanitizer, Meta, SafeHtml, Title } from '@angular/platform-browser';
import axios from 'axios';

@Component({
  selector: 'app-reading',
  templateUrl: './reading.component.html',
  styleUrls: ['./reading.component.css']
})

export class ReadingComponent implements OnInit {
  post!:WriteModel
  username!:string
  postadmin!:string
  filetype!:any
  _id:any;
  postid:any
  userReaction:string=''
  funnycount!:number
  sadcount!:number
  loveitcount!:number
  loggedInUserAccount:any=null
  tagsarray:string[]=[]
  collabos:string[]=[]
  collaboratorsUsernames: string[] = [];
  newCommentText:string='';
  comments: any[] = [];
  gifSearchQuery: string = ''; 
  gifs: any[] = []; 
  selectedText!:string
  isCommentBoxOpen:boolean=false;
  showhighlightTextInComment:string=''
  userReactions: { [key: string]: boolean } = {
    funny: false,
    sad: false,
    loveit: false
  };
  databases: Databases;
  sanitizedBodyContent!: SafeHtml;
  loggedinuserid!:string
  readingblog:boolean=false
  colloabousername!:string
  seotitle:string=''

  private synth = window.speechSynthesis;
  private utterance = new SpeechSynthesisUtterance();


  constructor(private service:WriteserviceService,private cdr: ChangeDetectorRef,private router:ActivatedRoute,
    // private ngnavigateservice:NgNavigatorShareService,
    private toastr: ToastrService,
    private sanitizer: DomSanitizer,
    private meta: Meta, private title: Title
  )
   {
    const client = new Client().
    setEndpoint(environment.appwriteEndpoint)
    .setProject(environment.appwriteProjectId);
    this.databases = new Databases(client);
    this.utterance.lang = 'en-US'; 
    this.utterance.rate = 1;       
    this.utterance.pitch = 1;      
  }


  ngOnInit(): void {
  

    this.readblogdatabyid()
    this.getloggedinuserdata()
    this.checkUserReactions();
    this.fetchComments();
    window.speechSynthesis.onvoiceschanged = () => this.setVoice();
    const url = this.post.imageUrl || this.post.videoUrl;
    this.filetype = url.split('.').pop()?.toLowerCase();


  }
  private setVoice(): void {
    const voices = this.synth.getVoices();
    if (voices.length > 0) {
        this.utterance.voice = voices.find(voice => voice.lang === 'en-US') || voices[0];
    } else {
        console.warn('No voices available. Check browser support for Speech Synthesis API.');
    }
}
getSanitizedHtml(text: string): SafeHtml {
  return this.sanitizer.bypassSecurityTrustHtml(text);
}
  sanitizeBodyContent() {
    this.sanitizedBodyContent = this.sanitizer.bypassSecurityTrustHtml(this.post.bodyofcontent);
  }

  async getloggedinuserdata (){
    this.loggedInUserAccount = await account.get();
    if (this.loggedInUserAccount) {
      this.username=this.loggedInUserAccount.name;
      this.loggedinuserid=this.loggedInUserAccount.$id
      console.log(this.username);
      console.log(this.loggedinuserid);
      }
  }
  
  fetchUserData(userId: string) {
    this.service.getUserData(userId).subscribe(
      (data) => {
        console.log('Fetched user data:', data);  // Debugging log
        this.collaboratorsUsernames.push(data.user.username);
      },
      (error) => {
        this.toastr.error('User does not exist.');
        console.error('Error fetching user data:', error);
      }
    );
  }

  readblogdatabyid(){

  this.router.paramMap.subscribe(params => {
    this.postid = params.get('postid');
    this.service.getpublishpostdatabyid(this.postid).subscribe({
            next: (data: WriteModel) => {
                this.post = data;
                console.log(this.post);
                this.seotitle=this.stripHTML(data.title);
                this.title.setTitle(this.seotitle);
                this.meta.addTags([
                  { name: 'description', content: this.stripHTML(data.bodyofcontent) },
                  { name: 'keywords', content: data.tags.toLocaleString() },
                  { property: 'og:title', content: this.stripHTML(data.bodyofcontent) },
                  { property: 'og:description', content: data.bodyofcontent },
                  { name: 'keywords', content: `${data.tags.toLocaleString() }`},
                  { property: 'og:image', content: data.imageUrl },
                  { property: 'og:url', content:  window.location.href},
                ]);
                // this.filetype = this.post.imageUrl.split('.').pop();
                this.tagsarray = this.post.tags;
                this.collabos=this.post.collaborators

                // console.log(this.filetype);
                // console.log(this.tagsarray);
                // console.log(this.collabos);
                this.collaboratorsUsernames = []; // Reset collaborators' usernames
                this.collabos.forEach(collaboratorId => {
                  this.fetchUserData(collaboratorId);
                });
        
        
                this.sanitizeBodyContent()
            },
            error: (error) => {
                console.error('Error fetching post data:', error);
            }
        });
    });
  }


  share() {
    if (navigator.share) {
        navigator.share({
            title: 'Check this out!',
            text: '👋 I found this amazing content you might like. 👉',
            url: window.location.href,
        })
        .then(() => console.log('Share successful'))
        .catch((error) => console.error('Error sharing:', error));
    } else {
        // If sharing is not supported, copy the URL to the clipboard
        const url = window.location.href;
        navigator.clipboard.writeText(url)
            .then(() => {
                alert('URL copied to clipboard! 📋');
            })
            .catch((error) => {
                console.error('Error copying to clipboard:', error);
                alert('Failed to copy the URL.');
            });
    }
}

  
  updateReactionCount(emoji: string, likecount: number) {
    if (this.username) {
     
      this.service.updateReaction(this.postid, emoji, likecount>=0).subscribe({
        next: (updatedPost:any) => {

          this.funnycount = updatedPost.funnycount;
          this.sadcount = updatedPost.sadcount;
          this.loveitcount = updatedPost.loveitcount;
          console.log(updatedPost);
          
        },
        error: (error:any) => {
          console.error('Error updating reaction count:', error);
        }
      });
    } else {
      this.toastr.error("Please log in to like the post.")
      console.log('Please log in to like the post.');
    }
  }
  

  addLike(emoji: string) {
    if (this.username) {
      const localStorageKey = `reaction_${this.postid}_${emoji}`;
      const alreadyLiked = localStorage.getItem(localStorageKey);
       if (alreadyLiked) {
        localStorage.removeItem(localStorageKey);

        this.updateReactionCount(emoji, -1);
        this.userReactions[emoji] = false;
       }
       else
       {
        localStorage.setItem(localStorageKey, 'true');

         this.updateReactionCount(emoji, 1);
        this.userReactions[emoji] = true;
       }
      
  }
  else{
    console.log("login to like posts");
    this.toastr.error("login to like posts")
  }
}

checkUserReactions() {
  const reactions = ['funny', 'sad', 'loveit'];
  reactions.forEach((emoji) => {
    const localStorageKey = `reaction_${this.postid}_${emoji}`;
    if (localStorage.getItem(localStorageKey)) {
      this.userReactions[emoji] = true; 
    }
  });
}

async addComment() {
  if (this.postid && this.loggedInUserAccount) {
    let commentText = '';

    if (this.showhighlightTextInComment.trim()) {
      commentText += `
        <div style="font-size: 25px; background-color: #b3b8e8; border-radius: 5px; padding: 10px; margin-left: 5px; margin-bottom: 5px;">
          ${this.showhighlightTextInComment}
        </div>`;
    }

    if (this.newCommentText.trim()) {
      commentText += this.newCommentText;
    }

    if (commentText.trim()) { 
      
      try {
        const response = await this.databases.createDocument(
          environment.databaseId,
          environment.collectionId,
          ID.unique(),
          {
            postId: this.postid,
            userId: this.loggedInUserAccount.$id,
            commentText: commentText,
            createdAt: new Date().toISOString(),
            username: this.loggedInUserAccount.name
          }
        );

        this.comments.push(response);
        this.newCommentText = ''; 
        this.showhighlightTextInComment = '';
        this.ngOnInit();
      } catch (error) {
        console.error('Error adding comment:', error);
      }
    } else {
      console.error('Comment is empty. Nothing to submit.');
    }
  } else {
    console.error('Please log in to add a comment');
  }
}

async fetchComments()
{
  if (this.postid) {
    try {
      const response = await this.databases.listDocuments(
        environment.databaseId, 
        environment.collectionId, 
        [Query.equal('postId', this.postid)]
      );
      this.comments = response.documents;
      
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }
}
refreshcomponent() {
  console.log("Refresh component called");
  this.fetchComments();
  this.cdr.detectChanges();
}


  
async searchGifs() {
  const apiKey = environment.giphyAPIKEY; // Replace with your Giphy API key
  try {
    const response = await axios.get(`https://api.giphy.com/v1/gifs/search`, {
      params: {
        api_key: apiKey,
        q: this.gifSearchQuery,
        limit: 16 // Limit results
      }
    });
    this.gifs = response.data.data; // Set gifs with the response data
  } catch (error) {
    console.error('Error fetching GIFs', error);
  }
}

selectGif(gif: any) {
  // const gifUrl = gif.images.original.url
  const gifUrl=gif.images.fixed_height.url
  console.log('Click to send gif:', gif);
  this.newCommentText+=`<img style="width:95% !important; height: auto;" src="${gifUrl}" />`
  console.log(this.newCommentText);
  this.addComment()

}
highlightText() {
  const selection: Selection | null = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const selectedText = selection.toString();
    
    if (selectedText.length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      this.showTooltip( rect,selectedText);
    }
  } else {
    console.log("No text is selected.");
  }


}
showTooltip(rect: DOMRect, selectedText: string) {
  const tooltip = document.createElement('div');
  tooltip.innerHTML = '💬 Comment'; 
  tooltip.style.position = 'absolute';
  tooltip.style.fontSize = '16px';
  tooltip.style.top = `${rect.top + window.scrollY - 40}px`; 
  tooltip.style.left = `${rect.left + window.scrollX}px`;
  tooltip.style.backgroundColor = '#bdc2fb';
  tooltip.style.padding = '10px';
  tooltip.style.borderRadius = '4px';
  tooltip.style.cursor = 'pointer';
  tooltip.style.zIndex = '1000'; 

  tooltip.addEventListener('click', () => {
    this.isCommentBoxOpen = !this.isCommentBoxOpen;
    this.showhighlightTextInComment = selectedText;
    document.body.removeChild(tooltip);
  });

  const existingTooltip = document.querySelector('.custom-tooltip');
  if (existingTooltip) {
    document.body.removeChild(existingTooltip);
  }
  tooltip.classList.add('custom-tooltip'); 
  document.body.appendChild(tooltip);
}


bookmarkthispost() {
  this.service.addPostBookmark(this.loggedinuserid, this.postid).subscribe(
      () => {
          console.log("Bookmark added successfully");
          this.toastr.success("Bookmarked")
      },
      (error) => { 
          console.error("Error adding bookmark:", error.error.message);
          this.toastr.error(error.error.message)
      }
  );
}
stripHTML(html:string) {
  return html.replace(/<\/?[^>]+(>|$)/g, "");
}
start(text: string): void {
  if (!this.synth) {
    console.error('Speech Synthesis is not supported in this browser.');
    return;
  }
  this.utterance.text = this.stripHTML(text);
  this.synth.cancel();
  this.synth.speak(this.utterance); 
  this.readingblog=true
  // console.log(this.utterance.text);
  
}
stop(): void {
  this.synth.cancel();
  this.readingblog=false
}

printSpecificSection(): void {
  const printContent = document.getElementById('blogContent');
  const originalContent = document.body.innerHTML;
  if (printContent) {
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContent; 
    }
  }
}