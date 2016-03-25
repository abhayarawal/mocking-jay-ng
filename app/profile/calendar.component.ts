import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector, Pipe, PipeTransform} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, Location, RouteParams} from 'angular2/router';

interface Days {
	year: number,
	month: number,
	days: number[]
}

var range = (x, y): number[] => {
	let temp = [];
	for (let j = x; j <= y; j++) { temp.push(j); }
	return temp;
}


@Pipe({
	name: 'weekPipe'
})
class WeekPipe implements PipeTransform {
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
	name: 'monthPipe'
})
class MonthPipe implements PipeTransform {
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

@Component({
	selector: 'cal-day',
	template: `
		<a [routerLink]="['/ProfileViewport', 'DaySegment', {id: id, day: month+'%'+day+'%'+year}]">{{day}}</a>
	`,
	directives: [RouterLink],
	inputs: ['id', 'year', 'month', 'day']
})
class CalendarDay { }

@Component({
	selector: 'calendar',
	template: `
		<div class="calendar">
			<div class="month__select">
				<button class="lnr lnr-chevron-left left" (click)="prevMonth()"></button>
				<h4>{{ now.month | monthPipe }}, {{ now.year }}</h4>
				<button class="lnr lnr-chevron-right right" (click)="nextMonth()"></button>
			</div>

			<div class="month__week">
				<ul class="cal__days">
					<li *ngFor="#w of week">{{ w | weekPipe }}</li>
				</ul>
			</div>

			<div class="month__days" *ngIf="id">
				<ul class="cal__days">
					<li *ngFor="#d of prev.days" class="prev">
						<cal-day [id]="id" [year]="prev.year" [month]="prev.month" [day]="d"></cal-day>
					</li>
					<li *ngFor="#d of now.days">
						<cal-day [id]="id" [year]="now.year" [month]="now.month" [day]="d"></cal-day>
					</li>
					<li *ngFor="#d of next.days" class="prev">
						<cal-day [id]="id" [year]="next.year" [month]="next.month" [day]="d"></cal-day>
					</li>
				</ul>
			</div>
		</div>
	`,
	pipes: [MonthPipe, WeekPipe],
	directives: [CalendarDay]
})
export class Calendar implements OnInit {
	@Input() id: string;
	week: number[] = range(0, 6);
	startDay: number;
	prev: Days;
	next: Days;
	now: Days;

	prevMonth(): void {
		this.build(this.now.year, --this.now.month);
	}

	nextMonth(): void {
		this.build(this.now.year, ++this.now.month);
	}

	build(year, month): void {
		let date = new Date(year, month);
		this.startDay = (new Date(date.getFullYear(), date.getMonth(), 1)).getDay();
		let days = (new Date(date.getFullYear(), (date.getMonth() + 1), 0)).getDate();

		let prev = new Date(date.getFullYear(), date.getMonth(), 0);
		this.prev = {
			year: prev.getFullYear(),
			month: prev.getMonth(),
			days: (range((prev.getDate() - this.startDay + 1), prev.getDate()))
		}

		this.now = {
			month: date.getMonth(),
			year: date.getFullYear(),
			days: range(1, days)
		}

		let next = new Date(date.getFullYear(), (date.getMonth() + 1), 1);
		this.next = {
			year: next.getFullYear(),
			month: next.getMonth(),
			days: (range(1, (7 - (days + this.startDay) % 7)))
		}
	}

	ngOnInit() {
		let today = new Date();
		this.build(today.getFullYear(), today.getMonth());
	}
}
