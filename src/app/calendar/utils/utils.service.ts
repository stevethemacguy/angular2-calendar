/**
 * Helper functions for sd-calendar.component.ts
 * Author: Steven Dunn
 * Dependencies: Lodash
**/

import { Injectable } from '@angular/core';
import * as _ from 'lodash';

@Injectable()
export class Utils {

  // Converts a 10-char date string (e.g. '14/00/2015') into a valid date string (e.g. '12/01/2015')
  // Use yearRange (e.g. '1888:2017') to ensure that the returned string falls within the min and max year specified.
  // Use maxDate to ensure that the returned string does not occur after a specified Date OBJECT.
  //
  // Example Inputs and Outputs when a yearRange of '1900:3000' is specified
  //  00/00/0000  =>  01/01/1900
  //  99/99/9999  =>  12/31/3000
  //
  //  00/05/2005  =>  01/05/2005
  //  13/05/2005  =>  12/05/2005
  //
  //  05/32/2005  =>  05/31/2005
  //  13/32/2005  =>  12/31/2005
  //
  //  05/15/1899  =>  12/31/1900
  //  05/15/3001  =>  12/31/3000
  //
  // If yearRange is not specified, then only the month and date (i.e. day) are enforced. Any year will be allowed.
  enforceDateValidation(dateString: string, yearRange?: string, maxDate?: Date) {
    let finalString = '';

    // Split the string every 3 chars
    let partArray = dateString.match(/.{1,3}/g);  // 12/31/2015' would become ['12/','31/','201','5']

    // Get the year from the original dateString (i.e the last four chars)
    let year = dateString.slice(-4);

    // Remove the last char (i.e the forward slash) so you're left with a two digit Month and Day
    let month = partArray[0].slice(0, -1); // '12/' would become 12
    let day = partArray[1].slice(0, -1); // '31/' would become 31

    // Don't allow month to be 0 or over 13 (i.e. change the month to 01 or 12 respectively)
    if (parseInt(month, 10) > 12) {
      finalString = '12/';
    } else if (parseInt(month, 10) === 0) {
      finalString = '01/';
    } else {
      finalString = month + '/';
    }

    // Don't allow day to be 0 or over 31 (i.e. change the day to 01 or 31 respectively)
    if (parseInt(day, 10) > 31) {
      finalString += '31/';
    } else if (parseInt(day, 10) === 0) {
      finalString += '01/';
    } else {
      finalString += day + '/';
    }

    // If a maxDate is specified, use this as the maximum date, otherwise, use the maximum date specified by yearRange
    let maxYear = yearRange;
    if (maxDate) {
      maxYear = '' + maxDate.getFullYear();
    }

    // Don't allow year to be higher than the yearRange limit
    if (maxYear) {
      maxYear = maxYear.slice(-4);
      if (year > maxYear) {
        year = maxYear;
      }
    }

    // Don't allow the year to be earlier than the min yearRange limit
    let minYear = yearRange.slice(0, 4);
    if (year < minYear) {
      year = minYear;
    }

    // Add the year back to the string
    finalString += year;

    // Make sure the final string won't result in a date that's later than the max date specified
    if (maxDate) {
      let testDate = new Date(finalString);

      if (testDate > maxDate) {
        finalString = this.convertDateToDateString(maxDate);
      }
    }
    return finalString;
  }

  // Converts a Date object into a string in the format 'MM/DD/YYYY'
  convertDateToDateString(inputDate: Date): string {
    let finalString = '';

    // Account for zero-indexed months (e.g. January is 0 and December is 11, but we want to use 1 and 12 instead)
    let actualMonth = inputDate.getMonth() + 1;
    let monthString = '' + actualMonth;
    let dateString = '' + inputDate.getDate();

    if (actualMonth < 10) {
      monthString = '0' + actualMonth;
    }
    if (inputDate.getDate() < 10) {
      dateString = '0' + dateString;
    }

    finalString += monthString + '/' + dateString + '/' + inputDate.getFullYear();
    return finalString;
  }

  // Note: This function intentionally *only returns numbers* and not things like decimals.
  // Do not modify this to also return other values.
  getOnlyDigitsFromString(value: any): any {
    if (_.isString(value)) {
      return value.replace(/[^\d]/g, '');
    } else {
      return value;
    }
  }
}
