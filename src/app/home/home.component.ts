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
    private toaster:ToastrService
  ) {}

  ngOnInit(): void {

    // this.fetchPostContent();
    this.username = this.userId ? 'UserFromAppwrite' : 'Guest';

    this.socket = io(
      environment.beronyAPI 
      // "http://localhost:3000"
      , {
      auth: {
          userId: this.userId,  
          postId: this.postId,
          username: this.username
        }
      });
      
      this.socket.on('connect', () => {
        console.log('Connected to Socket.IO server');
        this.fetchPostContent();
      });

      this.service.text$.subscribe((newText: string) => {
        this.text = newText;
      });
      this.socket.on('cursorUpdate', ({ userId, username, position }) => {
        if (userId !== this.userId) {
          console.log('Cursor update received:', userId, position);
          this.updateCursor(userId, username, position);
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
          this.updateAllCursors();
      });
    
    }
 
    ngAfterViewInit() {
      this.canvas = new fabric.Canvas('myCanvas');
      this.resizeCanvas()
      this.canvas.freeDrawingBrush = new fabric.CircleBrush(this.canvas);
      this.canvas.freeDrawingBrush.color = "#8b8beb";
      this.canvas.freeDrawingBrush.width = 100;
      this.canvas.isDrawingMode = true;
      if (this.textarea) {
        const textarea = this.textarea.nativeElement;
        textarea.addEventListener('mousemove', () => this.emitCursorPosition());
        textarea.addEventListener('keyup', () => this.emitCursorPosition());
        textarea.addEventListener('click', () => this.emitCursorPosition());
        textarea.addEventListener('input', () => this.emitCursorPosition());
        textarea.addEventListener('scroll', () => this.updateAllCursors());
      }
      
    }
    emitCursorPosition() {
      const position = this.textarea.nativeElement.selectionStart;
      this.socket.emit('cursorMove', { position });
    }
    updateCursor(userId: string, username: string, position: number) {
      const textarea = this.textarea.nativeElement;
      const text = textarea.value;
  
      if (!this.cursors[userId]) {
        const color = this.cursorColors[Object.keys(this.usedColors).length % this.cursorColors.length];
        this.usedColors[userId] = color;
  
        const cursor = document.createElement('div');
        cursor.className = 'figma-cursor';
        cursor.style.position = 'absolute';
        cursor.style.width = '8px';
        cursor.style.height = '8px';
        cursor.style.borderRadius = '50%';
        cursor.style.backgroundColor = color;
        cursor.style.boxShadow = `0 0 4px ${color}`;
        cursor.style.pointerEvents = 'none';
        cursor.style.animation = 'blink 1s infinite';
  
        const label = document.createElement('div');
        label.className = 'figma-label';
        label.textContent = username;
        label.style.position = 'absolute';
        label.style.backgroundColor = color;
        label.style.color = '#fff';
        label.style.fontSize = '12px';
        label.style.padding = '2px 6px';
        label.style.borderRadius = '3px';
        label.style.pointerEvents = 'none';
  
        textarea.parentElement!.appendChild(cursor);
        textarea.parentElement!.appendChild(label);
        this.cursors[userId] = { cursor, label, position };
      }
  
      const textBeforeCursor = text.substring(0, position);
      const tempSpan = document.createElement('span');
      tempSpan.style.font = window.getComputedStyle(textarea).font;
      tempSpan.style.visibility = 'hidden';
      tempSpan.style.position = 'absolute';
      tempSpan.style.whiteSpace = 'pre-wrap';
      tempSpan.style.width = textarea.clientWidth + 'px';
      tempSpan.textContent = textBeforeCursor;
      document.body.appendChild(tempSpan);
  
      const offsetWidth = tempSpan.offsetWidth % textarea.clientWidth;
      const lineHeight = parseFloat(window.getComputedStyle(textarea).lineHeight) || 20;
      const offsetTop = Math.floor(tempSpan.offsetHeight / lineHeight) * lineHeight;
      document.body.removeChild(tempSpan);
  
      const textareaRect = textarea.getBoundingClientRect();
      const scrollTop = textarea.scrollTop;
  
      this.cursors[userId].cursor.style.left = `${textareaRect.left + offsetWidth}px`;
      this.cursors[userId].cursor.style.top = `${textareaRect.top + offsetTop - scrollTop}px`;
      this.cursors[userId].label.style.left = `${textareaRect.left + offsetWidth + 10}px`;
      this.cursors[userId].label.style.top = `${textareaRect.top + offsetTop - scrollTop - 20}px`;
      this.cursors[userId].position = position;
    }
  
    updateAllCursors() {
      Object.keys(this.cursors).forEach((userId) => {
        this.updateCursor(userId, this.cursors[userId].label.textContent || '', this.cursors[userId].position);
      });
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
