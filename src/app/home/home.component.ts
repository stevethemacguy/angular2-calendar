import {
  Component,
  OnInit
} from '@angular/core';

@Component({
  selector: 'home',
  providers: [],
  styleUrls: [ './home.component.css' ],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  // Set default values
  public selectedDate: Date = null;
  public defaultDate: Date = new Date();

  // TypeScript public modifiers
  constructor() {}

  public ngOnInit() {
    this.defaultDate = new Date();
  }

  public update() {
    console.log(`Date selected: ${this.selectedDate}`);
  }
}
