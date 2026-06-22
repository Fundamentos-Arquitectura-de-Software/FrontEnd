import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'fs-page-not-found',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './page-not-found.view.html',
    styleUrl: './page-not-found.view.css',
})
export class PageNotFoundView {}
