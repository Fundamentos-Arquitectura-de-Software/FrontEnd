import { Component, inject } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { ToastService } from '../../../application/toast.service';

@Component({
    selector: 'fs-toast',
    standalone: true,
    imports: [NgFor, NgIf, NgClass],
    templateUrl: './toast.component.html',
    styleUrls: ['./toast.component.css'],
})
export class ToastComponent {
    readonly toastService = inject(ToastService);
}
