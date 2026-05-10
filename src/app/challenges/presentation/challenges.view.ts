import { Component, OnInit, computed, signal } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ChallengeFacade } from '../../challenges/application/challenge.facade';

@Component({
    selector: 'fs-challenges-view',
    standalone: true,
    imports: [NgFor, NgIf, TranslateModule, DatePipe],
    templateUrl: './challenges.view.html',
    styleUrl: './challenges.view.css'
})
export class ChallengesView implements OnInit {
    constructor(public vm: ChallengeFacade) {}
    activeTab = signal<'active'|'enrolled'|'leaderboard'>('active');

    ngOnInit(){ this.vm.init(); }

    showLeaderboard(chId: string){
        this.vm.setActiveChallenge(chId);
        this.activeTab.set('leaderboard');
    }

    isEnrolled(chId: string){
        return computed(()=> this.vm.enrolled().some(c => c.id === chId));
    }
}
