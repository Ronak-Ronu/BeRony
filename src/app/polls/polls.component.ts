import { Component, Input, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { WriteserviceService } from '../writeservice.service';

@Component({
  selector: 'app-polls',
  templateUrl: './polls.component.html',
  styleUrls: ['./polls.component.css'],
})
export class PollsComponent implements OnInit {
  @Input() userId!: string;
  @Input() isViewingOwnProfile!: boolean;

  polls: any[] = [];
  newPollQuestion: string = '';
  newPollOptions: string[] = ['', ''];
  showCreatePollForm: boolean = false;

  constructor(
    private pollService: WriteserviceService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.fetchPolls();
  }

  fetchPolls(): void {
    this.pollService.getPolls(this.userId).subscribe({
      next: (response) => {
        this.polls = response.polls;
      },
      error: (error) => {
        this.toastr.error('Failed to load polls');
        console.error(error);
      },
    });
  }

  toggleCreatePollForm(): void {
    this.showCreatePollForm = !this.showCreatePollForm;
    if (!this.showCreatePollForm) {
      this.resetForm();
    }
  }

  addOption(): void {
    this.newPollOptions.push('');
  }

  removeOption(index: number): void {
    if (this.newPollOptions.length > 2) {
      this.newPollOptions.splice(index, 1);
    } else {
      this.toastr.warning('A poll must have at least two options');
    }
  }

  createPoll(): void {
    const question = this.newPollQuestion.trim();
    const options = this.newPollOptions.map(opt => opt.trim()).filter(opt => opt);

    if (!question || options.length < 2) {
      this.toastr.error('Please provide a question and at least two valid options');
      return;
    }

    this.pollService.createPoll(question, options).subscribe({
      next: (response) => {
        this.toastr.success('Poll created successfully!');
        this.polls.unshift(response.poll);
        this.toggleCreatePollForm();
      },
      error: (error) => {
        this.toastr.error(error.error?.error || 'Failed to create poll');
        console.error(error);
      },
    });
  }

  vote(pollId: string, optionIndex: number): void {
    this.pollService.vote(pollId, optionIndex, this.userId).subscribe({
      next: (response) => {
        this.toastr.success('Vote recorded!');
        const pollIndex = this.polls.findIndex(p => p._id === pollId);
        if (pollIndex !== -1) {
          this.polls[pollIndex] = { ...response.poll, hasVoted: true };
        }
        this.pollService.log_user_activity(this.userId, "poll").subscribe({
          next: () => {
            //console.log("User activity logged successfully");
          },
          error: (error) => {
            // console.error("Error logging user activity:", error);
          }
        });
      },
      error: (error) => {
        this.toastr.error(error.error?.error || 'Failed to vote');
        console.error(error);
      },
    });
  }

  getVotePercentage(votes: number[], optionIndex: number): number {
    const totalVotes = this.getTotalVotes(votes);
    return totalVotes ? Math.round((votes[optionIndex] / totalVotes) * 100) : 0;
  }

  getTotalVotes(votes: number[]): number {
    return votes && Array.isArray(votes) ? votes.reduce((sum, vote) => sum + vote, 0) : 0;
  }
  // Add trackBy function
  trackByIndex(index: number, item: any): number {
    return index;
  }

  private resetForm(): void {
    this.newPollQuestion = '';
    this.newPollOptions = ['', ''];
  }
}