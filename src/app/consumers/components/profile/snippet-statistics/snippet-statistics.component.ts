import { Component, Input, OnInit, OnDestroy, SimpleChanges, ChangeDetectorRef, OnChanges } from '@angular/core';
import { Subscription, Subject } from 'rxjs';
import { SnippetService } from 'src/app/shared/services/snippet.service';
import { StatisticService } from 'src/app/shared/services/statistic.service';
import { trigger, transition, query, style, stagger, animate } from '@angular/animations';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-snippet-statistics',
  templateUrl: './snippet-statistics.component.html',
  styleUrls: ['./snippet-statistics.component.scss'],
  animations: [
    trigger('fade', [
      transition('* => *', [
        query('.dashboard-overview', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(500, [
            animate('1000ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class SnippetStatisticsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() userId?: any;
  @Input() snippets: any[] = [];
  @Input() userRole: number = 1;
  @Input() isOwnProfile: boolean = false;
  @Input() userProfile: any;

  activatedDashboardOverview: number = 1;
  totalVisitors: number = 0;
  maxSnippets: number = Infinity;
  private destroy$ = new Subject<void>();

  constructor(
    private snippetService: SnippetService,
    private statisticService: StatisticService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.trackProfileVisit();
    this.updateMaxSnippets();
    this.subscribeToSnippetCreation();
    this.fetchSnippets(); // Ensure snippets are fetched on initialization
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['userProfile'] && changes['userProfile'].currentValue) {
      console.log('User profile changed:', this.userProfile);
      this.fetchSnippets();
    }
    if (changes['userRole']) {
      this.updateMaxSnippets();
    }
  }

  changeActiveDashboard(index: number): void {
    this.activatedDashboardOverview = index;
    this.cdr.detectChanges();
  }

  trackProfileVisit(): void {
    if (this.userId) {
      this.statisticService.trackProfileVisit(this.userId).subscribe({
        next: (response) => {
          if (response && typeof response.totalVisitors === 'number') {
            this.totalVisitors = response.totalVisitors;
          } else if (response && response.newVisitorsCount) {
            this.totalVisitors = response.newVisitorsCount;
          }
        },
        error: (error) => console.error('Error tracking visit:', error)
      });
    }
  }

  fetchSnippets(): void {
    if (this.userId) {
      this.snippetService.getUserSnippets(this.userId).pipe(takeUntil(this.destroy$)).subscribe({
        next: (snippets) => {
          this.snippets = snippets;
          this.cdr.detectChanges(); // Ensure UI updates if necessary
        },
        error: (error) => console.error('Failed to fetch snippets:', error)
      });
    }
  }

  handleSnippets(snippetCount: number): void {
    this.snippets.length = snippetCount;
    this.cdr.detectChanges();  // Ensure UI updates if necessary
  }

  updateMaxSnippets() {
    this.maxSnippets = this.snippetService.getMaxSnippets(this.userRole);
  }

  onSnippetCreated(): void {
    this.fetchSnippets(); // Refetch snippets when a new snippet is created
  }

  subscribeToSnippetCreation() {
    this.snippetService.snippetCreated$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (snippet) => {
        if (snippet) {
          this.fetchSnippets(); // Refetch snippets when a new snippet is created
        }
      },
      error: (error) => console.error('Error fetching created snippet:', error)
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}