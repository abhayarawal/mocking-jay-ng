import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector, Pipe, PipeTransform} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, Location, RouteParams} from 'angular2/router';
import {NgSwitch, NgSwitchWhen, DatePipe, NgStyle, NgForm, Control, NgControlGroup, NgControl, FormBuilder, NgFormModel, ControlGroup, Validators} from 'angular2/common';

import {User, UserType} from '../interfaces/interface';

var range = (x, y) : number[] => {
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
	selector: 'calendar',
	template: `
		<div class="calendar">
			<div class="month__select">
				<button class="lnr lnr-chevron-left" (click)="prevMonth()"></button>
				<h4>{{ month | monthPipe }}, {{ year }}</h4>
				<button class="lnr lnr-chevron-right" (click)="nextMonth()"></button>
			</div>

			<div class="month__week">
				<ul class="cal__days">
					<li *ngFor="#w of week">{{ w | weekPipe }}</li>
				</ul>
			</div>

			<div class="month__days" *ngIf="id">
				<ul class="cal__days">
					<li *ngFor="#d of prev.days" class="prev">
						<a [routerLink]="['/CalendarViewport', 'DaySegment', {id: id, day: prev.month+'%'+d+'%'+prev.year}]">{{d}}</a>
					</li>
					<li *ngFor="#d of days">
						<a [routerLink]="['/CalendarViewport', 'DaySegment', {id: id, day: month+'%'+d+'%'+year}]">{{d}}</a>
					</li>
					<li *ngFor="#d of next.days" class="prev">
						<a [routerLink]="['/CalendarViewport', 'DaySegment', {id: id, day: next.month+'%'+d+'%'+next.year}]">{{d}}</a>
					</li>
				</ul>
			</div>
		</div>
	`,
	pipes: [MonthPipe, WeekPipe],
	directives: [RouterLink]
})
class Calendar implements OnInit {
	@Input() id: string;
	week: number[] = range(0, 6);
	month: number;
	year: number;
	startDay: number;
	prev: {};
	days: number[];
	next: {}; 

	prevMonth(): void {
		this.build(this.year, --this.month);
	}

	nextMonth(): void {
		this.build(this.year, ++this.month);
	}

	build(year, month): void {
		let date = new Date(year, month);

		this.month = date.getMonth();
		this.year = date.getFullYear();
		this.startDay = (new Date(date.getFullYear(), date.getMonth(), 1)).getDay();
		let days = (new Date(date.getFullYear(), (date.getMonth() + 1), 0)).getDate();

		let prev = new Date(date.getFullYear(), date.getMonth(), 0);
		this.prev = {
			year: prev.getFullYear(),
			month: prev.getMonth(),
			days: (range((prev.getDate() - this.startDay + 1), prev.getDate()))
		}

		this.days = range(1, days);

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


@Component({
	selector: 'profile-context',
	template: `
		<div class="profile__context">
			<div class="row">
				<section>
					<ul>
						<li>
							<a href=""><span class="lnr lnr-star"></span> Favorite</a>
						</li>
					</ul>
				</section>
				<section>
					<ul>
						<li><a href="" class="lnr lnr-sync"></a></li>
						<li><a href="">Today</a></li>
						<li><a href="" class="lnr lnr-chevron-left"></a></li>
						<li><a href="" class="lnr lnr-chevron-right"></a></li>
					</ul>
				</section>
			</div>
		</div>
	`,
	directives: []
})
class ProfileContext {
}


@Component({
	template: `
		<profile-context></profile-context>
	`,
	directives: [ProfileContext]
})
class Cal {
}

@Component({
	template: `
		<h2>No one selected</h2>
	`
})
class None {}


@Component({
	selector: 'day-segment',
	template: `
		<profile-context></profile-context>
		<h2>Day segment</h2>
		<h2>{{day}}</h2>
	`,
	directives: [ProfileContext]
})
class DaySegment implements OnInit {
	@Input() day: String = "";

	constructor(private _router: Router,
							private _routerParams: RouteParams) { }

	ngOnInit() {
		this.day = this._routerParams.get('day');
	}
}

@Component({
	selector: 'profile-nav',
	template: `
		<div class="profile__nav">
			<div class="profile__card" *ngIf="user">
				<img src="{{user.avatar}}" />
				<h3>{{user.fname}} {{user.lname}}</h3>
				<ul>
					<li><a href="">{{user.fname}}'s contact card</a></li>
					<li><a [routerLink]="['/CalendarViewport', 'DaySegment', {id: user.id, day: day}]">{{user.fname}}'s calendar</a></li>
					<li><a href="">My events with {{user.fname}}</a></li>
				</ul>
			</div>
			<calendar [id]="user.id"></calendar>
		</div>
	`,
	directives: [Calendar, RouterLink]
})
class ProfileNav implements OnInit {
	@Input() user: User;
	day: String = '';

	ngOnInit() {
		let day = new Date();
		this.day = `${day.getMonth()}%${day.getDate()}%${day.getFullYear()}`;
	}
}


@Component({
	template: `
		<div class="profile__viewport">
			<profile-nav [user]="user"></profile-nav>
			<div class="profile__outlet">
				<router-outlet></router-outlet>
			</div>
		</div>
	`,
	directives: [RouterLink, RouterOutlet, ProfileNav]
})
@RouteConfig([
	{ path: '/', name: 'None', component: None, useAsDefault: true },
	{ path: '/:id', name: 'Cal', component: Cal },
	{ path: '/:id/day/:day', name: 'DaySegment', component: DaySegment }
])
export class ProfileViewport implements OnInit {
	user: User;

	ngOnInit() {
		this.user = {
			id: '9486130',
			type: UserType.Faculty,
			fname: 'Taylor',
			lname: 'Swift',
			avatar: 'https://cdn.shopify.com/s/files/1/0521/5917/files/Screen_Shot_2016-03-20_at_4.35.11_PM.png?3896038397320089616'
		}
	}
}





