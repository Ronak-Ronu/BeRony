import { Component, OnInit ,ChangeDetectorRef} from '@angular/core';
import { WriteModel } from '../Models/writemodel';
import { WriteserviceService } from '../writeservice.service';
import { account } from '../../lib/appwrite'; 


@Component({
  selector: 'app-write',
  templateUrl: './write.component.html',
  styleUrl: './write.component.css'
})
export class WriteComponent implements OnInit {
  draftblogs:WriteModel[]=[]
  edittitle:string=""
  editbodycontent:string=""
  editendnotecontent:string=""
  editclicked:boolean=false
  showImageUploadPopup: boolean = false;
  selectedimagefile!:File | null;


  constructor(private writeservice:WriteserviceService,private cdr: ChangeDetectorRef){  }
  loggedInUserAccount:any=null
  username!:string

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

  // Use 'imageUrl' as the key for the file if that's what your backend expects
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
    console.log(this.username);
    
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


}
