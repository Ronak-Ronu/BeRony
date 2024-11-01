import { Component, OnInit ,ChangeDetectorRef} from '@angular/core';
import { WriteModel } from '../Models/writemodel';
import { WriteserviceService } from '../writeservice.service';
import { account } from '../../lib/appwrite'; 
import { trigger, state, style, animate, transition } from '@angular/animations';
import { ToastrService } from 'ngx-toastr';

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
export class WriteComponent implements OnInit {
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

  constructor(private writeservice:WriteserviceService,private cdr: ChangeDetectorRef,private toastr: ToastrService){  }
  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.readdraftblog()
    this.getloggedinuserdata()



  }


publishblog(publishdata: WriteModel) {
  const formData = new FormData();
  formData.append('title', publishdata.title);
  formData.append('bodyofcontent', publishdata.bodyofcontent);
  formData.append('endnotecontent', publishdata.endnotecontent);
  formData.append('tags', JSON.stringify(this.tags));
  formData.append('userId',this.userId)
  formData.append('username',this.username)
  if (this.selectedimagefile) {
    formData.append('imageUrl', this.selectedimagefile);
    
  }

  formData.forEach((value, key) => {
    console.log(`${key}:`, value);

  });

  this.writeservice.publishblog(formData)

}
async getloggedinuserdata (){
  this.loggedInUserAccount = await account.get();
  if (this.loggedInUserAccount) {
    this.username=this.loggedInUserAccount.name;
    this.userId=this.loggedInUserAccount.$id;
    console.log(this.username);
    console.log(this.userId);
    const response = await this.writeservice.addUserToDB(this.userId, this.username).toPromise();
    console.log('User added to DB:', response);

  }
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

    this.writeservice.publishblog(formData);

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
        const formData = new FormData();
      formData.append('title', this.edittitle);
      formData.append('bodyofcontent', this.editbodycontent);
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

  removeTag(tag:string)
  {
    this.tags = this.tags.filter(t => t !== tag);
  }
  generateImage()
  {
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
}

