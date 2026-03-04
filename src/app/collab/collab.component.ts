import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, HostListener } from '@angular/core';
import { WriteserviceService } from '../writeservice.service';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { account } from '../../lib/appwrite';
import { Client, Databases, ID, Query } from 'appwrite';
import { environment } from '../../environments/environment';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import axios from 'axios';
import sanitizeHtml from 'sanitize-html';

@Component({
  selector: 'app-collab',
  templateUrl: './collab.component.html',
  styleUrls: ['./collab.component.css']
})
export class CollabComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('bodyEditor') bodyEditor!: ElementRef<HTMLDivElement>;

  text: string = '';
  postId: string = '';
  userId: string = '';
  postdata: any = {};
  username: string = '';
  editingUser: string = '';
  loggedInUserAccount: any;

  showFormatToolbar = false;
  toolbarPosition: { top: number; left: number } = { top: 0, left: 0 };

  // Bug 2 fix: save the range before the button click clears the selection
  private savedRange: Range | null = null;

  userEmotion: string = '';
  reactions: { id: string; emoji: string; top: number; left: number; size: number; drift: number; delay: number }[] = [];
  availableReactions: string[] = ['💖', '🔥', '✨', '👏', '🎉', '💯'];

  // Discussion / comments (same model as reading page)
  databases!: Databases;
  comments: any[] = [];
  newCommentText: string = '';
  gifSearchQuery: string = '';
  gifs: any[] = [];
  isDiscussionOpen: boolean = true;

  constructor(
    private service: WriteserviceService,
    private route: ActivatedRoute,
    private toaster: ToastrService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {
    const client = new Client()
      .setEndpoint(environment.appwriteEndpoint)
      .setProject(environment.appwriteProjectId);
    this.databases = new Databases(client);
  }

  async ngOnInit(): Promise<void> {
    this.userId = this.route.snapshot.paramMap.get('userId') || '';
    this.postId = this.route.snapshot.paramMap.get('postId') || '';
    try {
      await this.getloggedinusername();

      this.service.connect(this.userId, this.username, this.postId);
      this.service.joinPostRoom(this.postId);

      // Bug 4 fix: emit emotion AFTER socket is connected and postId is set
      if (this.userEmotion) {
        this.service.setEmotion(this.userEmotion);
      }

      this.fetchPostContent();

      // ── Incoming text from other collaborators ────────────────────────────
      this.service.listenForRawTextChange().subscribe(({ text: incomingText, senderId }) => {
        if (senderId === this.service.socket1.id) return;
        this.text = incomingText ?? '';
        this.bodyEditor.nativeElement.innerHTML = this.text;
        this.cdr.detectChanges();
      });

      this.service.listenForStartEditing().subscribe((u) => {
        this.editingUser = u;
        this.cdr.detectChanges();
      });

      this.service.listenForSocketError().subscribe((err) => this.toaster.error(err));

      this.service.listenForReactions().subscribe((reaction) => {
        if (!reaction?.position) return;
        this.pushReaction(
          reaction.id || `${Date.now()}-${Math.random()}`,
          reaction.emoji,
          reaction.position.top,
          reaction.position.left
        );
      });

      // Load existing discussion comments for this post
      this.fetchComments();

    } catch (error) {
      this.toaster.error('Something went wrong');
    }
  }

  ngAfterViewInit(): void {
    this.setupPlaceholder(this.bodyEditor.nativeElement, 'Start collaborating here...');
    this.bodyEditor.nativeElement.innerHTML = this.text;
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.service.leaveRoom(this.postId);
  }

  async getloggedinusername(): Promise<void> {
    try {
      this.loggedInUserAccount = await account.get();
      if (this.loggedInUserAccount) {
        this.userId = this.loggedInUserAccount.$id;
        const res = await this.service.getUserData(this.userId).toPromise();
        const userData = res?.user || {};
        this.username = userData.username || this.loggedInUserAccount.name || this.loggedInUserAccount.email;
        this.userEmotion = userData.userEmotion || 'focus';
        // NOTE: do NOT call setEmotion here — socket isn't connected yet
        if (!this.username) this.toaster.error('User not authenticated');
      } else {
        this.toaster.error('User not authenticated');
      }
    } catch (error) {
      this.toaster.error('Something went wrong');
      throw error;
    }
  }

  fetchPostContent(): void {
    this.service.getpublishpostdatabyid(this.postId).subscribe(
      (data) => {
        this.text = data.bodyofcontent;
        this.postdata = data;
        if (this.bodyEditor) {
          this.bodyEditor.nativeElement.innerHTML = this.text;
        }
        this.cdr.detectChanges();
      },
      () => this.toaster.error('Failed to fetch post content')
    );
  }

  onTextChange(): void {
    this.text = this.bodyEditor.nativeElement.innerHTML;
    this.service.onTextChange(this.text);
  }

  startEditing(): void {
    this.service.startEditing(this.username);
  }

  onSaveChanges(): void {
    this.service.saveChanges(this.text);
    this.service.log_user_activity(this.userId, 'edit').subscribe();
    this.clearCache();
  }

  clearCache(): void {
    this.service.clearPostsCache().subscribe(
      () => this.toaster.success('Changes saved.'),
      () => this.toaster.error('Failed to clear cache')
    );
  }

  setupPlaceholder(el: HTMLDivElement, text: string): void {
    if (!el.textContent) {
      el.classList.add('placeholder');
      el.setAttribute('data-placeholder', text);
    }
    el.addEventListener('input', () => {
      el.classList.toggle('placeholder', !el.textContent);
    });
  }

  // ── Toolbar via selectionchange ───────────────────────────────────────────

  @HostListener('document:selectionchange')
  onSelectionChange(): void {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && selection.toString().length > 0) {
      const range = selection.getRangeAt(0);
      if (this.bodyEditor?.nativeElement.contains(range.commonAncestorContainer)) {
        this.savedRange = range.cloneRange();
        const caretRect = range.getBoundingClientRect();
        this.toolbarPosition = {
          top:  caretRect.top - 50,
          left: Math.max(10, caretRect.left + caretRect.width / 2 - 160)
        };
        this.showFormatToolbar = true;
      } else {
        this.showFormatToolbar = false;
      }
    } else {
      this.showFormatToolbar = false;
    }
    this.cdr.detectChanges();
  }

  // ── Format commands ───────────────────────────────────────────────────────

  formatText(command: string, value?: string | Event): void {
    const selection = window.getSelection();
    if (!selection || selection.toString().length === 0) return;

    let resolvedValue: string | undefined = typeof value === 'string' ? value : undefined;
    if (value instanceof Event) {
      const target = value.target as HTMLSelectElement;
      if (target && 'value' in target) resolvedValue = target.value;
      else return;
    }

    if      (command === 'h1')                    document.execCommand('formatBlock', false, 'h1');
    else if (command === 'code')                  document.execCommand('insertHTML', false, `<pre class="code-block">${selection.toString()}</pre>`);
    else if (command === 'color' && resolvedValue) document.execCommand('foreColor', false, resolvedValue);
    else if (command === 'align-left')            document.execCommand('justifyLeft', false);
    else if (command === 'align-center')          document.execCommand('justifyCenter', false);
    else if (command === 'align-right')           document.execCommand('justifyRight', false);
    else if (command === 'font-size' && resolvedValue) document.execCommand('fontSize', false, resolvedValue);
    else                                          document.execCommand(command, false);

    this.text = this.bodyEditor.nativeElement.innerHTML;
    this.service.onTextChange(this.text);
    this.showFormatToolbar = false;
    this.cdr.detectChanges();
  }

  // ── Reactions ─────────────────────────────────────────────────────────────

  // Bug 2 fix: use savedRange (captured at selectionchange) instead of current selection
  triggerReaction(emoji: string): void {
    const range = this.savedRange;
    if (!range) return;

    const rect       = range.getBoundingClientRect();
    const editorRect = this.bodyEditor.nativeElement.getBoundingClientRect();
    const top  = rect.top  - editorRect.top  - 10;
    const left = rect.left - editorRect.left + rect.width / 2;

    this.pushReaction(`${Date.now()}-${Math.random()}`, emoji, top, left);
    this.service.addReaction(this.postId, { top, left }, emoji);
  }

  private pushReaction(_id: string, emoji: string, top: number, left: number): void {
    this.playPopSound();
    const count = 2 + Math.floor(Math.random() * 2); // 2–3 particles to avoid crowding
    const particles: typeof this.reactions = [];
    for (let i = 0; i < count; i++) {
      const radius = 20 + Math.random() * 40; // 20–60px away from center
      const angle  = (Math.random() - 0.5) * (Math.PI / 2); // -45° .. +45°
      const offsetX = Math.cos(angle) * radius;
      const offsetY = -Math.abs(Math.sin(angle) * radius);

      particles.push({
        id: `${_id}-${i}`,
        emoji,
        top:   top  + offsetY,
        left:  left + offsetX,
        size:  28 + Math.random() * 22,             // 28–50px start size
        drift: (Math.random() - 0.5) * 80,          // wider horizontal drift
        delay: Math.random() * 0.25,                // small stagger 0–0.25s
      });
    }
    this.reactions = [...this.reactions, ...particles];
    this.cdr.detectChanges();
    const ids = new Set(particles.map(p => p.id));
    setTimeout(() => {
      this.reactions = this.reactions.filter(r => !ids.has(r.id));
      this.cdr.detectChanges();
    }, 2000);
  }

  private playPopSound(): void {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch { /* silent fail if audio not allowed */ }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  trackById(_: number, item: { id: string }) { return item.id; }

  // ── Discussion helpers (sanitization + comments) ─────────────────────────

  private sanitizeContent(content: string): SafeHtml {
    const sanitized = sanitizeHtml(content, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        'img', 'iframe', 'pre', 'code', 'table', 'tr', 'td', 'th',
        'div', 'p', 'b', 'i', 'u', 'strong', 'em', 'br', 'span', 'blockquote'
      ]),
      allowedAttributes: {
        '*': ['style', 'class'],
        'img': ['src', 'alt', 'style', 'width', 'height'],
        'iframe': ['src', 'width', 'height', 'style', 'frameborder', 'allowfullscreen']
      },
      allowedSchemes: ['http', 'https'],
      selfClosing: ['img', 'br', 'hr'],
      parseStyleAttributes: true
    });
    return this.sanitizer.bypassSecurityTrustHtml(sanitized);
  }

  getSanitizedHtml(text: string): SafeHtml {
    return this.sanitizeContent(text || '');
  }

  async addComment(): Promise<void> {
    if (!this.postId || !this.loggedInUserAccount) {
      this.toaster.error('Please log in to comment');
      return;
    }
    const commentText = this.newCommentText.trim();
    if (!commentText) return;

    try {
      const response = await this.databases.createDocument(
        environment.databaseId,
        environment.collectionId,
        ID.unique(),
        {
          postId: this.postId,
          userId: this.loggedInUserAccount.$id,
          commentText,
          createdAt: new Date().toISOString(),
          username: this.loggedInUserAccount.name
        }
      );
      this.comments.push(response);
      this.newCommentText = '';
      this.cdr.detectChanges();
    } catch {
      this.toaster.error('Failed to add comment');
    }
  }

  async fetchComments(): Promise<void> {
    if (!this.postId) return;
    try {
      const response = await this.databases.listDocuments(
        environment.databaseId,
        environment.collectionId,
        [Query.equal('postId', this.postId)]
      );
      this.comments = response.documents;
      this.cdr.detectChanges();
    } catch {
      this.toaster.error('Failed to load discussion');
    }
  }

  refreshComments(): void {
    this.fetchComments();
  }

  async searchGifs(): Promise<void> {
    const apiKey = environment.giphyAPIKEY;
    if (!this.gifSearchQuery.trim()) {
      this.gifs = [];
      return;
    }
    try {
      const res = await axios.get('https://api.giphy.com/v1/gifs/search', {
        params: {
          api_key: apiKey,
          q: this.gifSearchQuery,
          limit: 16
        }
      });
      this.gifs = res.data.data || [];
      this.cdr.detectChanges();
    } catch {
      this.toaster.error('Failed to search GIFs');
    }
  }

  selectGif(gif: any): void {
    const gifUrl = gif?.images?.fixed_height?.url;
    if (!gifUrl) return;
    this.newCommentText += `<img style="width:95%; height:auto;" src="${gifUrl}" />`;
    this.addComment();
  }
}
