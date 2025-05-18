import { Component, OnInit } from '@angular/core';
import { WriteserviceService } from '../writeservice.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-meeting-list',
  templateUrl: './meeting-list.component.html',
})
export class MeetingListComponent implements OnInit {
  meetings: any[] = [];
  username: string = '';

  constructor(private writeService: WriteserviceService, private router: Router) {}

  ngOnInit() {
    this.writeService.getActiveMeetings().subscribe({
      next: (meetings) => (this.meetings = meetings),
      error: (err) => console.error('Error fetching meetings:', err),
    });
  }

  joinMeeting(roomId: string) {
    if (!this.username) {
      alert('Please enter a username');
      return;
    }
    this.writeService.joinMeeting(roomId, this.username).subscribe({
      next: () => {
        this.router.navigate(['/meeting', roomId], { state: { username: this.username } });
      },
      error: (err) => {
        console.error('Error joining meeting:', err);
        alert('Failed to join meeting');
      },
    });
  }
}