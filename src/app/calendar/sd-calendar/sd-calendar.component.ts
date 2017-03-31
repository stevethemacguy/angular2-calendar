/**
 * Custom date-picker component with basic input masking
 * Author: Steven Dunn
 * Dependencies: Lodash, jQuery, and PrimeNG (see http://www.primefaces.org/primeng/#/calendar)
 *
 **/

import {Component, EventEmitter, forwardRef, ViewChild, AfterViewInit, OnInit, Input, Output, HostBinding} from '@angular/core';
//import {, HostBinding} from '@angular/core/src/metadata/directives';
import {Utils} from '../utils/utils.service';
import {NG_VALUE_ACCESSOR, ControlValueAccessor} from '@angular/forms';
import {CalendarModule, Calendar} from 'primeng/components/calendar/calendar';
import * as _ from 'lodash';
import * as $ from 'jquery';


// Required by ControlValueAccessor
const noop = () => {};

export const LD_CALENDAR_CONTROL_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => CalendarInputComponent),
  multi: true
};

@Component({
  selector: 'sd-calendar',
  templateUrl: './sd-calendar.template.html',
  providers: [LD_CALENDAR_CONTROL_VALUE_ACCESSOR, CalendarModule],
  styleUrls: ['./sd-calendar.style.scss']
})

export class CalendarInputComponent implements ControlValueAccessor, OnInit, AfterViewInit {
  private _value: any = '';
  private _onTouchedCallback: () => void = noop;
  private _onChangeCallback: (_: any) => void = noop;

  // True when the Calendar's ngModel is a valid Date (i.e. isValid should be set to true when the underlying input string is exactly 10 chars)
  // False when Calendar's ngModel is null (i.e. isValid should be set to false when the underlying input string is 0 - 9 chars)
  private isValid: boolean = true;

  // Used to track the length of the Calendar's input element
  private charCount: number = 0;

  // Caution: The Calendar's NgModel will always be either a valid Date object or null. If a partial date is entered (e.g. 10/20/), NgModel be null.
  get value(): any {
    return this._value;
  };

  @Input() set value(v: any) {
    if (v !== this._value) {
      this._value = v;
      this._onChangeCallback(v);
    }
  }

  // For more PrimeNG Calendar properties, see http://www.primefaces.org/primeng/#/calendar
  @Input() allowFutureDates: boolean = true;  // When true, the datepicker popup will disable dates that occur after today
  @Input() defaultDate: Date; // When the calender first opens, it opens to the defaultDate specified.
  @Input() isRequired: boolean = false;
  @Input() label: string;
  @Input() minDate: Date = null;
  @Input() maxDate: Date = null;
  @Input() readOnlyInput: boolean = false; // Disables manual text input when true. However, the date can still be changed using the calendar pop-up!
  @Input() showIcon: boolean = true;
  @Input() showOnFocus: boolean = true; // Open the calendar pop-up when the input gains focus
  @Input() monthNavigator: boolean = true;
  @Input() title: string = '';
  @Input() yearNavigator: boolean = true;
  @Input() yearRange: string; // Example: [yearRange]="'1888:2017'" (caution: having a large date range causes noticeable performance issues)

  public _readonly: boolean = false;

  @Input()
  get readonly(): boolean { return this._readonly; }
  set readonly(value) { this._readonly = this.coerceBooleanProperty(value); }

  @Output() handleSelect: EventEmitter<any> = new EventEmitter();

  // Add an attribute for QA
  @HostBinding('attr.qa') @Input() name: string = '';

  // Get access to the PrimeNG Calendar component to overload some of it's methods (see node_modules/primeng/components/calendar).
  @ViewChild(Calendar)
  private primeNgCalendar: Calendar;

  constructor(private utils: Utils) {
  }

  ngOnInit() {
    // Initialize the Calendar to today's date for demo purposes only.
    this.defaultDate = new Date();
    // If the date is empty, initialize the calendar to null
    if (this.defaultDate == null || typeof this.defaultDate === 'undefined') {
      this.value = null;
    } else {
      // IMPORTANT. Initializes the calender to the default date specified. Note: The defaultDate property is also used to open the calendar to a specific date.
      this.value = this.defaultDate;
      this.charCount = 10;
    }

    // Prevent users from entering a date that is after today's date
    if (this.allowFutureDates === false) {
      // Date properties to be used with min and max date. See http://www.primefaces.org/primeng/#/calendar for more examples
      let today = new Date();
      let month = today.getMonth();
      let year = today.getFullYear();
      // Set Max Date to today
      this.maxDate = today;
      this.maxDate.setMonth(month);
      this.maxDate.setFullYear(year);
    }
  }

  ngAfterViewInit(): void {
    // Cache values so they can be used within the Calendar's native functions
    let thisCalendarComponent = this;
    let originalOnInput = this.primeNgCalendar.onInput;
    let primeCalendar = this.primeNgCalendar;
    let utils = this.utils;

    // Listen for key presses on the input element (extends Calendar's default onInputKeydown implementation)
    this.primeNgCalendar.onInputKeydown = function (event) {

      // Special key presses
      this.keyPressWasBackspace = (event.keyCode === 8);

      // If the Tab, Esc, or Enter keys are pressed, close the datepicker
      if (event.keyCode === 9 || event.keyCode === 13 || event.keyCode === 27) {
        thisCalendarComponent._hideCalendar();
        primeCalendar.onSelect.emit(event);
        primeCalendar.onBlur.emit(event);
      } else {
        if (thisCalendarComponent.showOnFocus || thisCalendarComponent.readOnlyInput) {
          primeCalendar.overlayVisible = true;
          primeCalendar.closeOverlay = false;
        }
      }
    };

    // Extend the Calendar's onInput function to use an input mask
    this.primeNgCalendar.onInput = _.wrap<{(event: any): void}>(this.primeNgCalendar.onInput, function (originalFunc, event) {

      // If the user is removing a char (i.e. pressing backspace), don't try to format the input
      if (this.keyPressWasBackspace) {

        // Reduce the char count by one
        if (thisCalendarComponent.charCount > 0) {
          thisCalendarComponent.charCount -= 1;
        }

        // Reset the flag
        this.keyPressWasBackspace = false;
        originalOnInput.call(this, event);

        return;
      }

      let inputString = event.target.value;

      // Remove all chars from the string that are not numbers
      let strippedNumber = utils.getOnlyDigitsFromString(inputString);

      // Mask the user's input
      event.target.value = formatDate(strippedNumber, this.yearRange, this.maxDate);

      originalOnInput.call(this, event);
    });

    // Converts an input string into the following format: MM/DD/YYYY
    function formatDate(dateString: string, yearRange?: string, maxDate?: Date) {
      thisCalendarComponent.charCount = 0;
      let formattedDate = '';

      if (dateString) {
        for (let x = 0; x < dateString.length && formattedDate.length < 10; x++) {
          if (x === 1) {
            formattedDate += dateString[x] + '/';
          } else if (x === 3) {
            formattedDate += dateString[x] + '/';
          } else {
            formattedDate += dateString[x];
          }
        }
      } else {
        // Reset to original number if something goes wrong
        formattedDate = dateString;
      }

      thisCalendarComponent.charCount = formattedDate.length;

      // If a full, 10-digit date has been entered, ensure the date is a valid date
      if (formattedDate.length === 10) {
        formattedDate = utils.enforceDateValidation(formattedDate, yearRange, maxDate);
      }

      return formattedDate;
    }

    // Fix tabbing issue
    $('.primeng-calendar button').attr('tabindex', -1);
  }

  // Used in the template to check whether the Calendar value is an empty string (or null)
  isEmpty() {
    return this.charCount <= 0;
  }

  // Use if form validation errors need to be shown (note: this may need further implementation)
  isDateValid(): boolean {
    return this.isValid;
  }

  // Manually hides the Calendar
  _hideCalendar() {
    if (this.primeNgCalendar) {
      this.primeNgCalendar.overlayVisible = false;
      this.primeNgCalendar.closeOverlay = true;
    }
  }

  _handleBlur(event) {
    // Update the Calendar's valid state. Note: If the input is exactly 10 chars, then the NgModel value will be a valid Date object.
    // In all other cases (i.e. the string is less than 10 chars), the underlying Date value will be null.
    this.isValid = event.target.value.length < 1 || event.target.value.length === 10;

    // Used for not-empty validation
    this.charCount = event.target.value.length;

    // If the input string is a partial date, clear the Calendar's underlying input element.
    // Partial dates can not be converted into a valid Date object, so we must ignore them entirely.
    try {
      // This code is less than ideal, but it is the only reliable way to change the primeCalendar's native input element.
      let inputString = this.primeNgCalendar.el.nativeElement.children[0].children[0].value;

      if (inputString && inputString.length !== 10) {
        // Ensure that the calendarComponent doesn't cache an old date value
        this.value = null;
        // Caution: This value cannot be cached or moved into a function. It must be acted on directly within this context (i.e. Do not change this code)
        this.primeNgCalendar.el.nativeElement.children[0].children[0].value = null;
        this.charCount = 0;
      }
    } catch (error) {
      console.log("Clearing the Calendar input failed. Check that the Calendar Component and it's child elements are not null or undefined'");
    }
  }

  _handleSelect(event) {
    this.value = event;

    if (event != null && typeof event.target === 'undefined') {
      this.charCount = 10;
      this.isValid = true;
    }

    // IMPORTANT. DO NOT delete this line. The calendar will throw an error if you attempt to select a date without updating the Model
    this.primeNgCalendar.updateModel();

    try {
      // Check that the value being written is a valid Date Object
      if (typeof event !== 'undefined' && event !== null && typeof event.getMonth === 'function') {
        // Caution: The Calendar's Date object (i.e. this.value) and the Calendar's underlying <input> string are not always equivalent.
        // This code prevents several known errors by ensuring that the Calendar's underlying <input> string always matches the Date value.
        // Do NOT change this code unless you are prepared to fully regression test the Calendar. See _handleBlur for more documentation.
        // For example, this code prevents the following error:
        //  1. Select a date (Mar 10, 2005)
        //  2. Partially clear the date (i.e. press backspace)
        //  3. With the datepicker still open, select the same date in step one (i.e select Mar 10, 2005 again)
        this.primeNgCalendar.el.nativeElement.children[0].children[0].value = this.utils.convertDateToDateString(event);
      }
    } catch (error) {
      console.log("Failed to set primeNgCalendar's value in sd-calendar-component. Check that the calendar component and it's child elements are not null or undefined'");
    }

    this.handleSelect.emit(this.value);

    // Ensure the calendar closes after selecting a date (fixes a bug where the calendar only closed after clicking twice)
    // Note: As an extra precaution, you may want to set a timeout in ngAfterViewInit to ensure the Calendar child is available before trying to close it.
    this._hideCalendar();
  }

  writeValue(value: any) {
    if (value !== this._value) {
      this._value = value;
    }
  }

  // Required by ControlValueAccessor
  registerOnChange(fn: any) {
    this._onChangeCallback = fn;
  }

  // Required by ControlValueAccessor
  registerOnTouched(fn: any) {
    this._onTouchedCallback = fn;
  }

  coerceBooleanProperty(value: any): boolean {
    return value != null && `${value}` !== 'false';
  }
}
