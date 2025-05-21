import { Component, OnInit ,ChangeDetectorRef, AfterViewInit,ElementRef,ViewChild, createNgModule} from '@angular/core';
import { WriteModel } from '../Models/writemodel';
import { WriteserviceService } from '../writeservice.service';
import { account } from '../../lib/appwrite'; 
import { trigger, style, animate, transition } from '@angular/animations';
import { ToastrService } from 'ngx-toastr';
import * as fabric from 'fabric'; 
import { environment } from '../../environments/environment';
import axios from 'axios';
@Component({
  selector: 'app-write',
  templateUrl: './write.component.html',
  styleUrl: './write.component.css',
  animations: [
    trigger('tagAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('700ms ease-out', style({ opacity: 0, transform: 'translateY(20px)' }))
      ])
    ])
  ]

})
export class WriteComponent implements OnInit,AfterViewInit {
  
  draftblogs:WriteModel[]=[]
  edittitle:string=""
  editbodycontent:string=""
  editendnotecontent:string=""
  editclicked:boolean=false
  showImageUploadPopup: boolean = false;
  selectedimagefile!:File | null;
  imageUrl!:string | null;
  previewBlog:WriteModel[]=[];
  ispreview:boolean=false
  previewTitle:String=""
  previewBodyContent:String=""
  previewEndNote:String=""
  tagInput: string = ''
  tags:string[]=[]
  openimagegeneratepopup:boolean=false;
  loggedInUserAccount:any=null
  username!:string
  userId!:string
  prompt!:string
  photos: any[] = [];
  showCodeEditor:boolean=false
  editCodeContent: string = ''
  showcanvas:boolean=false
  canvas!: fabric.Canvas 
  pickedcolor:string = "#000000"
  brushsize:number=11
  gifSearchQuery: string = ''; 
  gifs: any[] = []; 
  showstickerwindow:boolean=false
  isdrawing:boolean=false
  postScheduleTime:Date | undefined
  brushtype:string='pencil'
  showstickerwindow1:boolean=false
  cursorPosition: number = 0;

  @ViewChild('titleTextarea') titleTextarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('bodyTextarea') bodyTextarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('endnoteTextarea') endnoteTextarea!: ElementRef<HTMLTextAreaElement>;

  constructor(private writeservice:WriteserviceService,private cdr: ChangeDetectorRef,private toastr: ToastrService){  }
  ngOnInit(): void {
    this.readdraftblog()
    this.getloggedinuserdata()
  }


  ngAfterViewInit() {
  this.canvas = new fabric.Canvas('fabricCanvas')
  // this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
  this.canvas.freeDrawingBrush = new fabric.PatternBrush(this.canvas)
  this.canvas.freeDrawingBrush.color = this.pickedcolor;
  this.canvas.freeDrawingBrush.width = this.brushsize;

 

    const textarea = this.titleTextarea.nativeElement;
    const bodyTextarea = this.bodyTextarea.nativeElement;
    const endnoteTextarea = this.endnoteTextarea.nativeElement;
    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    });
    bodyTextarea.addEventListener('input', () => {
      bodyTextarea.style.height = 'auto';
      bodyTextarea.style.height = `${bodyTextarea.scrollHeight}px`;
      this.checkForGifKeyword(bodyTextarea);
    });
    endnoteTextarea.addEventListener('input', () => {
      endnoteTextarea.style.height = 'auto';
      endnoteTextarea.style.height = `${endnoteTextarea.scrollHeight}px`;
    });

    bodyTextarea.addEventListener('keyup', () => {
      this.cursorPosition = bodyTextarea.selectionStart;
    });
    bodyTextarea.addEventListener('click', () => {
      this.cursorPosition = bodyTextarea.selectionStart;
    });

    

  }

  checkForGifKeyword(textarea: HTMLTextAreaElement) {
    const value = textarea.value;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastWord = textBeforeCursor.split(/\s+/).pop();

    if (lastWord === '@gif') {
      this.showstickerwindow1 = true;
      this.gifSearchQuery = ''; // Reset search query
      this.searchGifs(); // Show initial GIFs
    }
  }

  selectBrush(type: string) {
    this.brushtype = type;
    switch (type) {
      case 'pencil':
        this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
        this.canvas.isDrawingMode = !this.canvas.isDrawingMode
        this.isdrawing=!this.isdrawing      
        break;
      case 'spray':
        this.canvas.freeDrawingBrush = new fabric.SprayBrush(this.canvas);
        this.canvas.isDrawingMode = !this.canvas.isDrawingMode
        this.isdrawing=!this.isdrawing
        break;
        case 'circle':
          this.canvas.freeDrawingBrush = new fabric.CircleBrush(this.canvas);
          this.canvas.isDrawingMode = !this.canvas.isDrawingMode
          this.isdrawing=!this.isdrawing
          break;
      default:
        this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);

    }
    // Apply current color and size to the new brush
    this.canvas.freeDrawingBrush.color = this.pickedcolor;
    this.canvas.freeDrawingBrush.width = this.brushsize;
  }
  

publishblog(publishdata: WriteModel) {
  const formData = new FormData();
  const scheduleDate  = this.postScheduleTime || new Date()

  const bdy= this.formatCode(this.editCodeContent)+ publishdata.bodyofcontent
  // console.log(bdy);
  formData.append('title', publishdata.title);
  formData.append('bodyofcontent', bdy);
  formData.append('endnotecontent', publishdata.endnotecontent);
  formData.append('tags', JSON.stringify(this.tags));
  formData.append('userId',this.userId)
  formData.append('username',this.username)
  formData.append('postScheduleTime', new Date(scheduleDate).toISOString())

    if (this.selectedimagefile) {
      const maxSize = 20 * 1024 * 1024; 
      if(this.selectedimagefile.size > maxSize)
      {
          this.toastr.error("file size exceeds  20MB")
          return
      }
      formData.append('imageUrl', this.selectedimagefile);
    }
  
    formData.forEach((value, key) => {
      console.log(`${key}:`, value);
    });
    if (this.username!=="") {
    this.writeservice.publishblog(formData).then(
      res=>{
        console.log(res); 
        if (res){
          console.log("blog published");
          this.toastr.success("blog published 🥳")
          }
        else{
          this.toastr.error("failed to publish blog")
        }
      }
    );  
  }
  else{
    this.toastr.warning("GUEST? SORRY 🥺")
  }
  // console.log(formData);
  
}

async getloggedinuserdata (){
  this.loggedInUserAccount = await account.get();
  if (this.loggedInUserAccount) {
    this.username=this.loggedInUserAccount.name;
    this.userId=this.loggedInUserAccount.$id;
    const email = this.loggedInUserAccount.email
    console.log(this.username);
    console.log(this.userId);
    const response = await this.writeservice.addUserToDB(this.userId, this.username,email).toPromise();
    console.log('User added to DB:', response);
  }
}
    setBrushColor()
    {
        this.canvas.freeDrawingBrush!.color = this.pickedcolor;
    }
    setBrushSize()
    {
      this.canvas.freeDrawingBrush!.width = this.brushsize;

    }

  publishdraft(draftdata:WriteModel)
  {
    const formData = new FormData();
    formData.append('title', this.edittitle);
    formData.append('bodyofcontent', this.editbodycontent);
    formData.append('endnotecontent', this.editendnotecontent);
    
    console.log(this.selectedimagefile);
    
    if (this.selectedimagefile) {
      formData.append('imageUrl', this.selectedimagefile); 
    }

    this.writeservice.publishblog(formData).then(
      res=>{
        if (res.success){
            this.toastr.success("blog published")

        }
        else{
          this.toastr.error("failed to publish blog")
        }
      }
    );

    this.writeservice.deletedraft(draftdata._id);
  }

  toggleImageUploadPopup() {
    this.showImageUploadPopup = !this.showImageUploadPopup;

  }

  closePopup() {
    this.showImageUploadPopup = false;
  }


  handleImageUpload(event:any)
  {
    this.selectedimagefile= event.target.files[0];
    console.log(this.selectedimagefile?.name);
    if (this.selectedimagefile) {
      this.imageUrl = URL.createObjectURL(this.selectedimagefile);
    } else {
      this.imageUrl = null;
    }
      
   
  }
  uploadBlogImage()
  {
    console.log(this.selectedimagefile);
  }


  readdraftblog()
  {
    this.writeservice.getdraftblog().subscribe(
      (data:WriteModel[])=>{
            this.draftblogs=data
    })

  }

  saveasdraft(draftdata:WriteModel)
  {
    this.writeservice.draftblog(draftdata);
    console.log(this.draftblogs); 

  }


  editdraft(draftdata:WriteModel)
  {
    this.edittitle=draftdata.title
    this.editbodycontent=draftdata.bodyofcontent
    this.editendnotecontent=draftdata.endnotecontent
    this.editclicked=true
    console.log(this.edittitle);
  }



  refreshcomponent(){
      this.readdraftblog()
      this.cdr.detectChanges();
  }

  preview()
  {
    this.ispreview=true
    console.log("preview");
    const bdy= this.formatCode(this.editCodeContent)+ this.editbodycontent
        const formData = new FormData();
      formData.append('title', this.edittitle);
      formData.append('bodyofcontent', bdy);
      formData.append('endnotecontent', this.editendnotecontent);
     

        console.log(formData.get('title'));
     
              this.previewTitle=formData.get('title') as string ;
              this.previewBodyContent=formData.get('bodyofcontent') as string ;
              this.previewEndNote=formData.get('endnotecontent') as string ;

  }
  closepreview(){
    this.ispreview=!this.ispreview
  }


  onKeyDown(event: KeyboardEvent) {
    // console.log('Key pressed:', event.key);
    try {
      if (event.key === 'Enter' || event.key === ',' || event.key === ';') {
        event.preventDefault();
        const trimmedTag = this.tagInput.trim();
        this.addTag(trimmedTag);
        this.tagInput = ''; 
        this.cdr.detectChanges(); 
    }
    } catch (error) {
      console.log(error);
      
    }
   
}


addTag(tag: string) {
  // console.log('Trying to add tag:', tag);
  if (!this.tags.includes(tag) && this.tagInput!=='' && this.tagInput!==' ') {
      this.tags.push(tag);
      // console.log('Added tag:', tag);
      this.cdr.detectChanges();
  } else {
    this.toastr.error("Tag already exists or empty")
      // console.log('Tag already exists or is empty.'); 
  }
}

  removeTag(tag:string){
    this.tags = this.tags.filter(t => t !== tag);
  }
  generateImage(){
   console.log(this.prompt);
    this.writeservice.searchPhotos(this.prompt).subscribe(
      (res)=>{
        this.photos=res.results.map((image: any) => image.urls.small);
        
      }
    )
  }
  generateimagewindow()
  {
    this.openimagegeneratepopup=!this.openimagegeneratepopup;
  }
  closeImagePopup() {
    this.openimagegeneratepopup = false;
  }
  selectThisImage(selectedImageUrl:string)
  {
    console.log(selectedImageUrl);
    
    fetch(selectedImageUrl)
    .then(response => response.blob())
    .then(blob => {
        // Create a File object from the Blob
        const file = new File([blob], 'selected-image.jpg', { type: blob.type });


        this.selectedimagefile = file;
        this.imageUrl = URL.createObjectURL(file); 
        console.log(this.imageUrl);
        
    })
    .catch(error => {
        console.error('Error fetching the image:', error);
        this.toastr.error('Failed to fetch image.');
    });

  }
  toggleCodeEditor() {
    this.showCodeEditor = !this.showCodeEditor;
}

formatCode(code: string): string {
  const lines = code.split('\n');
  const styledLines = lines.map(line => {
      return `<font color="grey" size="3">${this.escapeHtml(line)}</font>`;
  });
  return `<div class="code-block" bgcolor="#f0f0f0"><pre><code>${styledLines.join('\n')}</code></pre><div>`;
}
escapeHtml(unsafe: string): string {
  return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
}


opencanvas(){
    this.showcanvas= !this.showcanvas;
}
// addRect(): void {

//     const rect = new fabric.Rect({
//       fill: this.pickedcolor ,
//       width: 100,
//       height: 100,
//       left: Math.random() * 250,
//       top: Math.random() * 250,
//     });
//     this.canvas.add(rect);
//     this.canvas.renderAll()

// }
clearcanvas()
{
  const activeObject = this.canvas.getActiveObject(); 
  
  if (activeObject) {
  
    this.canvas.remove(activeObject)
    this.canvas.renderAll()
  
  } else {
    
    this.canvas.clear()
  }

}
draw()
{
  this.canvas.isDrawingMode = !this.canvas.isDrawingMode
  this.isdrawing=!this.isdrawing
 
}
saveCanvas() {
  const dataURL = this.canvas.toDataURL({
    format: 'png',      
    quality: 1,         
    multiplier: 1
  });

  // Convert base64 to Blob
  const byteString = atob(dataURL.split(',')[1]);
  const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uintArray = new Uint8Array(arrayBuffer);
  
  for (let i = 0; i < byteString.length; i++) {
    uintArray[i] = byteString.charCodeAt(i);
  }

  const blob = new Blob([uintArray], { type: mimeString });

  // Convert Blob to File
  this.selectedimagefile = new File([blob], "canvas-image.png", { type: mimeString });
  this.imageUrl = dataURL;

  // Download the image
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = 'canvas-image.png'; 
  link.click(); 
}

addText(){
  const text = new fabric.Textbox("Add Your Text Here",{
    left: this.canvas.getWidth() / 2,
    top: this.canvas.getHeight() / 2,
    width: this.canvas.getWidth() * 0.4,
    originX: "center",
    originY: "center",
    fill: this.pickedcolor
  })
  this.canvas.add(text)
  this.canvas.renderAll()
}


addImageToCanvas(event: Event): void {
  const input = event.target as HTMLInputElement;

  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = (e) => {
      const imgUrl = e.target?.result;

      if (typeof imgUrl === 'string') {
        const imageElement = document.createElement('img');
        imageElement.src = imgUrl;

        imageElement.onload = () => {
          const image = new fabric.Image(imageElement);
          this.canvas.add(image);
          this.canvas.setActiveObject(image);
          image.scale(0.4)

          this.canvas.renderAll();
        };
      } else {
        console.error('Image data could not be read as a string.');
      }
    };
  }
}


  addSticker()
  {
    this.showstickerwindow = !this.showstickerwindow;
  }

  addSticker1()
  {
    this.showstickerwindow1 = !this.showstickerwindow1;
  }
  async searchGifs() {
    const apiKey = environment.giphyAPIKEY; // Replace with your Giphy API key
    try {
      const response = await axios.get(`https://api.giphy.com/v1/stickers/search`, {
        params: {
          api_key: apiKey,
          q: this.gifSearchQuery,
          limit: 16 
        }
      });
      this.gifs = response.data.data; 
      // console.log(this.gifs);
      // console.log(response);
      // console.log(this.gifSearchQuery);
    } catch (error) {
      console.error('Error fetching GIFs', error);
    }
  }
  selectGif(gif: any) {
    // const gifUrl = gif.images.original.url
    const gifUrl=gif.images.fixed_height.url
    const imgTag = `<img src="${gifUrl}" alt="GIF" style="max-width: 150px; height: auto;">`;
    const textarea = this.bodyTextarea.nativeElement;
    const currentValue = textarea.value;
    const textBefore = currentValue.substring(0, this.cursorPosition - 4);
    const textAfter = currentValue.substring(this.cursorPosition);

    this.editbodycontent = textBefore + imgTag + textAfter;
    this.showstickerwindow = false;
    this.cdr.detectChanges();

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;


    console.log('Click to send gif:', gifUrl);  
    const imageElement = document.createElement('img');
    imageElement.crossOrigin = 'anonymous'; 
    imageElement.src = gifUrl;
  
    imageElement.onload = () => {
      const image = new fabric.Image(imageElement);
      this.canvas.add(image);
      this.canvas.setActiveObject(image);
      image.scale(0.7)
      this.canvas.renderAll();
  }
}

  
}

