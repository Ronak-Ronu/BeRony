import { Component, OnInit,ChangeDetectorRef,Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WriteModel } from '../Models/writemodel';
import { WriteserviceService } from '../writeservice.service';
import { account } from '../../lib/appwrite';
import { ToastrService } from 'ngx-toastr';
import { Client, Databases, ID, Query } from 'appwrite';
import { environment } from '../../environments/environment';
import { DomSanitizer, Meta, SafeHtml, Title } from '@angular/platform-browser';
import axios from 'axios';
import jsPDF from 'jspdf';
import sanitizeHtml from 'sanitize-html';


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
  isDiscussionOpen = false;


  private synth = window.speechSynthesis;
  private utterance = new SpeechSynthesisUtterance();


  constructor(private service:WriteserviceService,private cdr: ChangeDetectorRef,private router:ActivatedRoute,
    // private ngnavigateservice:NgNavigatorShareService,
    private toastr: ToastrService,
    private sanitizer: DomSanitizer,
    private meta: Meta, private title: Title,
    private renderer: Renderer2
  )
   {
    const client = new Client().
    setEndpoint(environment.appwriteEndpoint)
    .setProject(environment.appwriteProjectId);
    this.databases = new Databases(client);
    this.utterance.lang = 'en-US'; 
    this.utterance.rate = 0.95; 
    this.utterance.pitch = 1.1;  
    this.utterance.volume = 1;
      }


  ngOnInit(): void {
  

    this.readblogdatabyid()
    this.getloggedinuserdata()
    this.checkUserReactions();
    this.fetchComments();
    window.speechSynthesis.onvoiceschanged = () => this.setVoice();
    const url = this.post.imageUrl || this.post.videoUrl;
    this.filetype = url.split('.').pop()?.toLowerCase();
    this.addJsonLdSchema();
  }

  addJsonLdSchema() {
    const script = this.renderer.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": this.post.title,
      "author": {
        "@type": "Person",
        "name": this.post.username
      },
      "publisher": {
        "@type": "Organization",
        "name": "BeRony",
        "logo": {
          "@type": "ImageObject",
          "url": "https://berony.com/logo.png"
        }
      },
      "datePublished": Date.now(),
      "dateModified": Date.now(),
      "description": this.post.bodyofcontent,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": window.location.href
      }
    });

    this.renderer.appendChild(document.head, script);
  }

  private setVoice(): void {
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google US English')) 
                         || voices.find(v => v.lang === 'en-US') 
                         || voices[0];
  
    if (preferredVoice) {
      this.utterance.voice = preferredVoice;
    } else {
      console.warn('No suitable voice found');
    }
  }
  


sanitizeContent(content: string): SafeHtml {
  const sanitized = sanitizeHtml(content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'img', 'iframe', 'pre', 'code', 'table', 'tr', 'td', 'th', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'div', 'p', 'b', 'i', 'u', 'strong', 'em', 'font', 'br', 'hr', 'center'
    ]),
    allowedAttributes: {
      '*': ['style', 'align', 'bgcolor', 'width', 'height', 'border', 'cellpadding', 'cellspacing'],
      'img': ['src', 'alt', 'style', 'width', 'height'],
      'iframe': ['src', 'width', 'height', 'style', 'frameborder', 'allowfullscreen'],
      'font': ['color', 'size', 'face'],
      'table': ['bgcolor', 'border', 'width', 'style', 'align'],
      'td': ['bgcolor', 'width', 'height', 'style', 'align'],
      'tr': ['bgcolor', 'style', 'align'],
      'div': ['style', 'align', 'bgcolor', 'width', 'height'],
      'p': ['style', 'align'],
      'h1': ['style', 'align'],
      'h2': ['style', 'align'],
      'pre': ['style'],
      'code': ['style']
    },
    allowedIframeHostnames: ['www.youtube.com', 'giphy.com'],
    allowedSchemes: ['http', 'https'],
    selfClosing: ['img', 'br', 'hr'],
    parseStyleAttributes: true,
  });

  return this.sanitizer.bypassSecurityTrustHtml(sanitized);
}
sanitizeBodyContent() {
  this.sanitizedBodyContent = this.sanitizeContent(this.post.bodyofcontent);
}

getSanitizedHtml(text: string): SafeHtml {
  return this.sanitizeContent(text);
}

speakInChunks(text: string) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  for (let sentence of sentences) {
    const chunk = new SpeechSynthesisUtterance(sentence);
    chunk.voice = this.utterance.voice;
    chunk.rate = this.utterance.rate;
    chunk.pitch = this.utterance.pitch;
    chunk.volume = this.utterance.volume;
    this.synth.speak(chunk);
  }
}


readblogdatabyid() {
  this.router.paramMap.subscribe(params => {
    this.postid = params.get('postid');
    this.service.getpublishpostdatabyid(this.postid).subscribe({
      next: (data: WriteModel) => {
        this.post = data;
        this.addJsonLdSchema();

        this.seotitle = this.stripHTML(data.title);
        this.title.setTitle(this.seotitle);
        this.meta.addTags([
          { name: 'description', content: this.stripHTML(data.bodyofcontent) },
          { name: 'keywords', content: data.tags.toLocaleString() },
          { property: 'og:title', content: this.stripHTML(data.bodyofcontent) },
          { property: 'og:description', content: data.bodyofcontent },
          { name: 'keywords', content: `${data.tags.toLocaleString()}` },
          { property: 'og:image', content: data.imageUrl },
          { property: 'og:url', content: window.location.href },
        ]);
        this.tagsarray = this.post.tags;
        this.collabos = this.post.collaborators;
        this.collaboratorsUsernames = [];
        this.collabos.forEach(collaboratorId => {
          this.fetchUserData(collaboratorId);
        });
        this.sanitizeBodyContent();
      },
      error: (error) => {
        console.error('Error fetching post data:', error);
      }
    });
  });
}


async getloggedinuserdata (){
    this.loggedInUserAccount = await account.get();
    if (this.loggedInUserAccount) {
      this.username=this.loggedInUserAccount.name;
      this.loggedinuserid=this.loggedInUserAccount.$id
      // console.log(this.username);
      // console.log(this.loggedinuserid);
      }
  }
  
  fetchUserData(userId: string) {
    this.service.getUserData(userId).subscribe(
      (data) => {
        // console.log('Fetched user data:', data);  // Debugging log
        this.collaboratorsUsernames.push(data.user.username);
      },
      (error) => {
        this.toastr.error('User does not exist.');
        console.error('Error fetching user data:', error);
      }
    );
  }

  // readblogdatabyid(){

  // this.router.paramMap.subscribe(params => {
  //   this.postid = params.get('postid');
  //   this.service.getpublishpostdatabyid(this.postid).subscribe({
  //           next: (data: WriteModel) => {
  //               this.post = data;
  //               console.log(this.post);
  //               this.seotitle=this.stripHTML(data.title);
  //               this.title.setTitle(this.seotitle);
  //               this.meta.addTags([
  //                 { name: 'description', content: this.stripHTML(data.bodyofcontent) },
  //                 { name: 'keywords', content: data.tags.toLocaleString() },
  //                 { property: 'og:title', content: this.stripHTML(data.bodyofcontent) },
  //                 { property: 'og:description', content: data.bodyofcontent },
  //                 { name: 'keywords', content: `${data.tags.toLocaleString() }`},
  //                 { property: 'og:image', content: data.imageUrl },
  //                 { property: 'og:url', content:  window.location.href},
  //               ]);
  //               // this.filetype = this.post.imageUrl.split('.').pop();
  //               this.tagsarray = this.post.tags;
  //               this.collabos=this.post.collaborators

  //               // console.log(this.filetype);
  //               // console.log(this.tagsarray);
  //               // console.log(this.collabos);
  //               this.collaboratorsUsernames = []; // Reset collaborators' usernames
  //               this.collabos.forEach(collaboratorId => {
  //                 this.fetchUserData(collaboratorId);
  //               });
        
        
  //               this.sanitizeBodyContent()
  //           },
  //           error: (error) => {
  //               console.error('Error fetching post data:', error);
  //           }
  //       });
  //   });
  // }


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
                this.toastr.success('URL copied to clipboard! 📋');
            })
            .catch((error) => {
                console.error('Error copying to clipboard:', error);
                this.toastr.success('Failed to copy the URL.');
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
          // console.log(updatedPost);
          
        },
        error: (error:any) => {
          console.error('Error updating reaction count:', error);
        }
      });
    } else {
      this.toastr.error("Please log in to like the post.")
      // console.log('Please log in to like the post.');
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
    // console.log("login to like posts");
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
  // console.log("Refresh component called");
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
  // console.log('Click to send gif:', gif);
  this.newCommentText+=`<img style="width:95% !important; height: auto;" src="${gifUrl}" />`
  // console.log(this.newCommentText);
  this.addComment()

}
highlightText() {
  const selection: Selection | null = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const selectedText = selection.toString();
    
    if (selectedText.length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      this.showTooltip(rect,selectedText);
    }
  } else {
    // console.log("No text is selected.");
  }


}
showTooltip(rect: DOMRect, selectedText: string) {
  const tooltip = document.createElement('div');
  tooltip.innerHTML = `
    <div style="display: flex; gap: 10px;">
      <button style="background-color: #bdc2fb; padding: 5px 10px; border: none; border-radius: 6px; cursor: pointer;">Comment</button>
      <button style="background-color: #f0ad4e; padding: 5px 10px; border: none; border-radius: 6px; cursor: pointer;">Meaning</button>
    </div>
  `;
  tooltip.style.position = 'absolute';
  tooltip.style.fontSize = '16px';
  tooltip.style.top = `${rect.top + window.scrollY - 50}px`; 
  tooltip.style.left = `${rect.left + window.scrollX}px`;
  tooltip.style.backgroundColor = '#fff';
  tooltip.style.padding = '10px';
  tooltip.style.borderRadius = '4px';
  tooltip.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  tooltip.style.zIndex = '1000';

  const commentButton = tooltip.querySelector('button:nth-child(1)');
  const meaningButton = tooltip.querySelector('button:nth-child(2)');

  commentButton?.addEventListener('click', () => {
    this.isCommentBoxOpen = !this.isCommentBoxOpen;
    this.showhighlightTextInComment = selectedText;
    document.body.removeChild(tooltip);
  });

  meaningButton?.addEventListener('click', () => {
    this.fetchWordMeaning(selectedText, rect);
    document.body.removeChild(tooltip);
  });

  const existingTooltip = document.querySelector('.custom-tooltip');
  if (existingTooltip) {
    document.body.removeChild(existingTooltip);
  }
  tooltip.classList.add('custom-tooltip'); 
  document.body.appendChild(tooltip);

  setTimeout(() => {
    const outsideClickListener = (event: MouseEvent) => {
      if (!tooltip.contains(event.target as Node)) {
        document.body.removeChild(tooltip);
        document.removeEventListener('click', outsideClickListener);
      }
    };
    document.addEventListener('click', outsideClickListener);
  }, 0);
}

fetchWordMeaning(word: string, rect: DOMRect) {
  const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
  
  const meaningPopup = document.createElement('div');
  meaningPopup.style.position = 'absolute';
  meaningPopup.style.fontSize = '16px';
  meaningPopup.style.top = `${rect.top + window.scrollY + 20}px`; 
  meaningPopup.style.left = `${Math.min(rect.left + window.scrollX, window.innerWidth - 360)}px`; 
  meaningPopup.style.backgroundColor = '#ffffff'; 
  meaningPopup.style.padding = '15px'; 
  meaningPopup.style.borderRadius = '8px';
  meaningPopup.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.2)'; 
  meaningPopup.style.zIndex = '1000';
  meaningPopup.style.maxWidth = '90%'
  meaningPopup.style.maxHeight = '50%'
  meaningPopup.style.overflowY = 'auto'; 
  meaningPopup.style.transition = 'transform 0.3s ease, opacity 0.3s ease'; 
  meaningPopup.style.transform = 'scale(0.95)'; 
  meaningPopup.style.opacity = '0'; 
  meaningPopup.innerHTML = 'Loading...';

  document.body.appendChild(meaningPopup);
  setTimeout(() => {
    meaningPopup.style.transform = 'scale(1)';
    meaningPopup.style.opacity = '1';
  }, 0);


  setTimeout(() => {
    const outsideClickListener = (event: MouseEvent) => {
      if (!meaningPopup.contains(event.target as Node)) {
        document.body.removeChild(meaningPopup);
        document.removeEventListener('click', outsideClickListener);
      }
    };
    document.addEventListener('click', outsideClickListener);
  }, 0);

  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      if (data && data[0]) {
        const wordData = data[0];
        const meanings = wordData.meanings.map((meaning: any) => {
          const definitions = meaning.definitions.map((def: any) => {
            const example = def.example ? `<br><strong>Example:</strong> ${def.example}` : '';
            return `<li>${def.definition}${example}</li>`;
          }).join('');
          return `<strong>${meaning.partOfSpeech}:</strong><ul>${definitions}</ul>`;
        }).join('');

        const synonyms = wordData.meanings
          .flatMap((meaning: any) => meaning.synonyms || [])
          .slice(0, 5) // Limit to 5 synonyms
          .map((synonym: string) => `<span style="background-color: #f0f0f0; padding: 2px 5px; margin: 2px; border-radius: 3px;">${synonym}</span>`)
          .join('');

        const phonetics = wordData.phonetics.map((phonetic: any) => {
          if (phonetic.audio) {
            return `<audio controls style="width: 100%; margin-top: 10px;">
                      <source src="${phonetic.audio}" type="audio/mpeg">
                      Your browser does not support the audio element.
                    </audio>`;
          }
          return '';
        }).join('');

        const image = `<img src="https://source.unsplash.com/300x200/?${word}" 
                          alt="${word}" 
                          style="width: 100%; margin-top: 10px; border-radius: 4px;" 
                          onerror="this.src='https://via.placeholder.com/300x200?text=No+Image';" />`;

        meaningPopup.innerHTML = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <strong style="font-size: 18px; color: #000;">Word:</strong> ${word}<br>
          ${image}
          ${phonetics}
          <strong style="font-size: 16px; color: #000; margin-top: 10px;">Meanings:</strong><br>${meanings}
          ${synonyms ? `<strong style="font-size: 16px; color: #000; margin-top: 10px;">Synonyms:</strong><br>${synonyms}` : ''}
        </div>
      `;
      } else {
        meaningPopup.innerHTML = `No meaning found for "${word}".`;
      }
    })
    .catch(error => {
      console.error('Error fetching word meaning:', error);
      meaningPopup.innerHTML = `Error fetching meaning for "${word}".`;
    });
}

bookmarkthispost() {
  this.service.addPostBookmark(this.loggedinuserid, this.postid).subscribe(
      () => {
          // console.log("Bookmark added successfully");
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
  this.speakInChunks(this.utterance.text); 
  // this.synth.speak(this.utterance); 
  this.readingblog=true
  // console.log(this.utterance.text);
  
}
stop(): void {
  this.synth.cancel();
  this.readingblog=false
}

downloadBlog() {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Theme colors
  const primaryColor = [153, 50, 204] as const; // #9932CC (Dark Orchid)
  const secondaryColor = [47, 79, 79] as const; // #2F4F4F (Dark Slate Grey)
  const accentColor = [128, 128, 128] as const; // #808080 (Grey)
  const backgroundColor = [189, 194, 251] as const; // #BDC2FB (Light Purple)

  // Load images
  const templateImg = new Image();
  const blogImage = new Image();
  templateImg.src = '../../assets/img/berony-blog-template.png';
  blogImage.src = this.post.imageUrl;

  templateImg.onload = () => {
    // Add template image as background
    pdf.addImage(templateImg, 'PNG', 0, 0, 210, 297);

    pdf.addImage(blogImage, 'PNG', 10, 10, 80, 40); // Blog image

    // Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.setTextColor(...primaryColor);
    const title = pdf.splitTextToSize(this.post.title.toUpperCase(), 180);
    pdf.text(title, 10, 65);

    pdf.setFontSize(16);
    pdf.setTextColor(...secondaryColor);
    pdf.text(`By ${this.post.username}`, 10, 80);
    pdf.setFontSize(14);
    pdf.setTextColor(...accentColor);
    pdf.text(
      `${this.post.funnycount + this.post.loveitcount + this.post.sadcount} Likes | ${this.post.pageviews} Views`,
      10,
      90
    );

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    const content = this.stripHTML(this.post.bodyofcontent);
    const splitContent = pdf.splitTextToSize(content, 190);
    let yPosition = 100;

    splitContent.forEach((line: string, index: number) => {
      if (yPosition > 270) {
        pdf.addPage();
        // pdf.setFillColor(...backgroundColor);
        // pdf.rect(0, 0, 210, 20, 'F'); // Header on new page
        pdf.setFontSize(12);
        pdf.setTextColor(...primaryColor);
        pdf.text(`Continued: ${this.post.title}`, 10, 15);
        yPosition = 30;
      }
      pdf.text(line, 10, yPosition);
      yPosition += 7; // Line spacing
    });

    // Collaborators (if any)
    if (this.collaboratorsUsernames && this.collaboratorsUsernames.length > 0) {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 30;
      }
      pdf.setFontSize(10);
      pdf.setTextColor(...primaryColor);
      pdf.text(`Collaborators: ${this.collaboratorsUsernames.join(', ')}`, 10, yPosition);
      yPosition += 10;
    }

    // Footer
    pdf.setFillColor(...backgroundColor);
    pdf.rect(0, 280, 210, 17, 'F');
    pdf.setFontSize(10);
    pdf.setTextColor(...secondaryColor);
    pdf.text('Generated by BeRony', 10, 290);
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, 180, 290, { align: 'right' });

    // Save PDF
    pdf.save(`${this.post.title}.pdf`);
  };
}

followUser(currentuserid: string,userid:string)
{
  // console.log(currentuserid,userid);

  this.service.followUser(currentuserid,"Follow",userid).subscribe(
    (response)=>{
      // console.log(response.message);
      this.toastr.success(response.message)

    },
    (error)=>{
      // console.log(error.error.message);
      this.toastr.warning(error.error.message)

      
    }
  )
}
unfollowUser(currentuserid: string,userid:string)
{
  // console.log(currentuserid,userid);

  this.service.unfollowUser(currentuserid,"Unfollow",userid).subscribe(
    (response)=>{
      // console.log(response.message);
      this.toastr.success(response.message)

    },
    (error)=>{
      // console.log(error.error.message);
      this.toastr.warning(error.error.message)
      
    }
  )
}
toggleDiscussion() {
  this.isDiscussionOpen = !this.isDiscussionOpen;

  setTimeout(() => {
    const chatSection = document.querySelector('.rightcommentsection') as HTMLElement;

    if (chatSection) {
      if (this.isDiscussionOpen) {
        chatSection.classList.add('visible');
      } else {
        chatSection.classList.remove('visible');
      }
    } else {
      // console.error('Chat section element not found!');
    }
  }, 0);
  }
  
}