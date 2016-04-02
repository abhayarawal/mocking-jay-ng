import {Injectable, Injector, OnInit, NgZone, PipeTransform, Pipe} from "angular2/core";
import {Http, Response, Headers} from 'angular2/http';
import {Router, Location, RouteParams} from 'angular2/router';


import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/map';
import 'rxjs/Rx';


@Pipe({
	name: 'weekPipe'
})
export class WeekPipe implements PipeTransform {
	transform(value: string, args: string[]): any {
		switch (parseInt(value)) {
			case 0: return "Sun";
			case 1: return "Mon";
			case 2: return "Tue";
			case 3: return "Wed";
			case 4: return "Thu";
			case 5: return "Fri";
			case 6: return "Sat";
		}
	}
}


@Pipe({
	name: 'weekFullPipe'
})
export class WeekFullPipe implements PipeTransform {
	transform(value: string, args: string[]): any {
		switch (parseInt(value)) {
			case 0: return "Sunday";
			case 1: return "Monday";
			case 2: return "Tuesday";
			case 3: return "Wednesday";
			case 4: return "Thursday";
			case 5: return "Friday";
			case 6: return "Saturday";
		}
	}
}

@Pipe({
	name: 'monthPipe'
})
export class MonthPipe implements PipeTransform {
	transform(value: string, args: string[]): any {
		switch (parseInt(value)) {
			case 0: return "January";
			case 1: return "February";
			case 2: return "March";
			case 3: return "April";
			case 4: return "May";
			case 5: return "June";
			case 6: return "July";
			case 7: return "August";
			case 8: return "September";
			case 9: return "October";
			case 10: return "November";
			case 11: return "December";
		}
	}
}



@Injectable()
export class CalendarService {
	constructor(private routeParams: RouteParams) {}

	getRouteParams(): [string, Date] {
		let id = this.routeParams.get('id'),
				month = parseInt(this.routeParams.get('month')),
				day = parseInt(this.routeParams.get('day')),
				year = parseInt(this.routeParams.get('year'));

		return [id, new Date(year, month, day)];
	}
}