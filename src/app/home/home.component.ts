import { Component ,ElementRef,OnInit, ViewChild} from '@angular/core';
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
  canvas!: fabric.Canvas;
  private socket!: Socket;
  text: string = ''; 
  postId: string = '6736eaca42540998b25ca0a2'; 
  userId: string = '67274249002493a5ec52'; 
  postdata: any = {};
  isHidden: boolean=true;
  username: string = '';
  memeGifSrc:string=""
  cursors: { [userId: string]: fabric.Circle } = {};
  cursorColors: string[] = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
  usedColors: { [userId: string]: string } = {};
  constructor(
    private service: WriteserviceService,
    private toaster:ToastrService
  ) {}

  ngOnInit(): void {

    // this.fetchPostContent();
    this.username = this.userId ? 'UserFromAppwrite' : 'Guest';

    this.socket = io(
      // environment.beronyAPI 
      "http://localhost:3000"
      , {
      auth: {
          userId: this.userId,  
          postId: this.postId,
          username: this.username
        }
      });
      
      this.socket.on('connect', () => {
        // console.log('Connected to Socket.IO server');
        this.fetchPostContent();
      });

      this.service.text$.subscribe((newText: string) => {
        this.text = newText;
      });
      this.socket.on('cursorUpdate', ({ userId, username, x, y }) => {
        if (userId !== this.userId) { // Don't render own cursor
          this.updateCursor(userId, username, x, y);
        }
      });
  
      // Remove cursor when a user disconnects
      this.socket.on('cursorRemove', ({ userId }) => {
        if (this.cursors[userId]) {
          this.canvas.remove(this.cursors[userId]);
          delete this.cursors[userId];
          delete this.usedColors[userId];
          this.canvas.renderAll();
        }
      });

      this.socket.on("textChange", (newText:string) => {
          this.text = newText;
      });
    
    }
 updateCursor(userId: string, username: string, x: number, y: number) {
    if (!this.cursors[userId]) {
      // Assign a color to the user
      const color = this.cursorColors[Object.keys(this.usedColors).length % this.cursorColors.length];
      this.usedColors[userId] = color;

      // Create a cursor (small circle)
      const cursor = new fabric.Circle({
        left: x,
        top: y,
        radius: 5,
        fill: color,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
      });

      // Add username label
      const label = new fabric.Text(username, {
        left: x + 10,
        top: y - 10,
        fontSize: 12,
        fill: color,
        selectable: false,
        evented: false,
      });

      this.cursors[userId] = cursor;
      this.canvas.add(cursor, label);
    } else {
      // Update existing cursor position
      this.cursors[userId].set({ left: x, top: y });
      const label = this.canvas.getObjects().find(obj => obj instanceof fabric.Text && obj.text === username);
      if (label) {
        label.set({ left: x + 10, top: y - 10 });
      }
    }
    this.canvas.renderAll();
  }
    ngAfterViewInit() {
      this.canvas = new fabric.Canvas('myCanvas');
      this.resizeCanvas()
      this.canvas.freeDrawingBrush = new fabric.CircleBrush(this.canvas);
      this.canvas.freeDrawingBrush.color = "#8b8beb";
      this.canvas.freeDrawingBrush.width = 100;
      this.canvas.isDrawingMode = true;
      
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
      this.canvas.setZoom(1); 
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
