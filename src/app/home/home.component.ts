import { ChangeDetectorRef, Component ,ElementRef,OnInit, ViewChild} from '@angular/core';
import { WriteserviceService } from '../writeservice.service';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import * as fabric from 'fabric';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit{
  // https://berony.web.app/collab/67274249002493a5ec52/6736eaca42540998b25ca0a2
  @ViewChild('memeGif') memeGif!: ElementRef<HTMLImageElement>;
  @ViewChild('myCanvas') canvasEl!: ElementRef<HTMLCanvasElement>;
  @ViewChild('textarea') textarea!: ElementRef<HTMLTextAreaElement>;
  canvas!: fabric.Canvas;
  private socket!: Socket;
  text: string = ''; 
  postId: string = '6736eaca42540998b25ca0a2'; 
  userId: string = '67274249002493a5ec52'; 
  postdata: any = {};
  isHidden: boolean=true;
  username: string = '';
  memeGifSrc:string=""
  cursors: { [userId: string]: { cursor: HTMLElement; label: HTMLElement; position: number } } = {};
  cursorColors: string[] = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
  usedColors: { [userId: string]: string } = {};
  constructor(
    private service: WriteserviceService,
    private toaster:ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    // this.fetchPostContent();
    this.username = this.userId ? 'UserFromAppwrite' : 'Guest';

    this.socket = io(
      environment.beronyAPI 
      // "http://localhost:3000"
      , 
      {
      auth: {
          userId: this.userId,  
          postId: this.postId,
          username: this.username
        }
      });
      
      this.socket.on('connect', () => {
        console.log('Connected to Socket.IO server');
        this.socket.emit('joinPostRoom', this.postId);
        this.fetchPostContent();
      });

      this.service.text$.subscribe((newText: string) => {
        this.text = newText;
      });
      this.socket.on('cursorUpdate', ({ userId, username, position }) => {
        if (userId !== this.userId) {
          console.log('Cursor update received:', userId, position);
          // this.updateCursor(userId, username, position);
        }
      });
  
      this.socket.on('cursorRemove', ({ userId }) => {
        if (this.cursors[userId]) {
          this.cursors[userId].cursor.remove();
          this.cursors[userId].label.remove();
          delete this.cursors[userId];
          delete this.usedColors[userId];
        }
      });
      this.socket.on("textChange", (newText:string) => {
          this.text = newText;
          this.service.textSubject.next(newText);
          this.cdr.detectChanges();
      });
    
    }
 
    ngAfterViewInit() {
      this.canvas = new fabric.Canvas('myCanvas');
      this.resizeCanvas()
      this.canvas.freeDrawingBrush = new fabric.CircleBrush(this.canvas);
      this.canvas.freeDrawingBrush.color = "#8b8beb";
      this.canvas.freeDrawingBrush.width = 100;
      this.canvas.isDrawingMode = true;

      this.canvas.on("path:created", () => {
        this.sendCanvasUpdate();
      });
      this.socket.on("canvasUpdate", async (data) => {
        if (!data || !data.objects) return; // Ensure data is valid
      
        try {
          const enlivenedObjects = await fabric.util.enlivenObjects(data.objects);
      
          enlivenedObjects.forEach((obj) => {
            if (obj instanceof fabric.Object) {
              this.canvas.add(obj);
            }
          });
      
          this.canvas.renderAll();
        } catch (error) {
          console.error("Error enlivening objects:", error);
        }
      });
      

     
    }

    sendCanvasUpdate() {
      this.socket.emit("canvasUpdate", this.canvas.toJSON());
    }
  
    emitCursorPosition() {
      const position = this.textarea.nativeElement.selectionStart;
      this.socket.emit('cursorMove', { position });
    }
  
    resizeCanvas() {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const aspectRatio = 2100 / 1000; 
    
      let width, height;
      if (windowWidth / windowHeight > aspectRatio) {
        height = windowHeight;
        width = height * aspectRatio;
      } else {
        width = windowWidth;
        height = width / aspectRatio;
      }
      this.canvas.setWidth(width);
      this.canvas.setHeight(height);
      this.canvas.setZoom(width / this.canvas.width);
      this.canvas.renderAll();
    
    
    }
    showMeme(event: MouseEvent,gif:string) {
      this.memeGifSrc=gif
      this.isHidden = false;
      this.moveMeme(event); 
    }
  
    moveMeme(event: MouseEvent) {
      if (this.memeGif) {
        this.memeGif.nativeElement.style.left = event.pageX + 10 + 'px';
        this.memeGif.nativeElement.style.top = event.pageY + 10 + 'px';
      }
    }
  
    hideMeme() {
      this.isHidden = true;
    }
    fetchPostContent()
    {
      this.service.getpublishpostdatabyid(this.postId).subscribe(
        (data) => {
          this.text = data.bodyofcontent; 
          this.postdata=data
          // console.log(this.postdata);
        },
        (error) => {
          console.error('Error fetching post content:', error);
        }
      );
    }
    onTextChange(): void {
      this.socket.emit('textChange', this.text);
      // console.log(this.text); 
    }
    onSaveChanges(): void {
      this.socket.emit('saveChanges', this.text);  
      this.clearCache();
    }
    clearCache(): void {
      this.service.clearPostsCache().subscribe(
        (response) => {
          // console.log('Cache cleared successfully:', response);
          this.toaster.success("Changes updated hurray!")

        },
        (error) => {
          console.error('Error clearing cache:', error);
          this.toaster.error("something went wrong")

          
        }
      );
    }
 


}
