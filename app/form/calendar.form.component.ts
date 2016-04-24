import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector, Pipe, PipeTransform} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, Location, RouteParams} from 'angular2/router';

import {WeekPipe, MonthPipe} from '../profile/calendar.service';

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


@Component({
	selector: 'calendar-select',
	template: `
		<div class="calendar__select">
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

			<div class="month__days">
				<ul class="cal__days">
					<li *ngFor="#d of prev.days" class="prev">
						<a (click)="select(prev.month, d, prev.year)">{{d}}</a>
					</li>
					<li *ngFor="#d of now.days">
						<a (click)="select(now.month, d, now.year)">{{d}}</a>
					</li>
					<li *ngFor="#d of next.days" class="prev">
						<a (click)="select(next.month, d, next.year)">{{d}}</a>
					</li>
				</ul>
			</div>
		</div>
	`,
	pipes: [MonthPipe, WeekPipe]
})
export class CalendarSelect implements OnInit {
	@Input() form: boolean = false;
	@Output() update = new EventEmitter<[number, number, number]>();

	week: number[] = range(0, 6);
	startDay: number;
	prev: Days;
	next: Days;
	now: Days;

	select(m, d, y) {
		this.update.next([m, d, y]);
	}

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


@Component({
	selector: 'calendar-select-elm',
	template: `
		<div class="calendar__select__elm" tabindex="120" (blur)="hide()">
			<div class="selected__date" (click)="show=true" [ngClass]="{focused: show}">
				{{month+1}}/{{day}}/{{year}}
				<span class="lnr lnr-calendar-full"></span>
			</div>
			<div class="calendar__select__wrap" [ngClass]="{show: show}">
				<calendar-select (update)="select($event)"></calendar-select>
			</div>
		</div>
	`,
	directives: [CalendarSelect]
})
export class CalendarSelectElm implements OnInit {
	show: boolean = false;
	timeout: any;

	@Input() month: number;
	@Input() day: number;
	@Input() year: number;

	@Output() update = new EventEmitter<[number, number, number]>();


	select([m, d, y]) {
		this.month = m;
		this.day = d;
		this.year = y;
		this.hide();
		this.update.next([m, d, y]);
	}

	hide() {
		clearTimeout(this.timeout);
		this.timeout = setTimeout(() => { this.show = false; }, 250);
	}

	ngOnInit() {
		let today = new Date();
		this.day = today.getDate();
		this.month = today.getMonth();
		this.year = today.getFullYear();
		this.select([this.month, this.day, this.year]);
	}
}








// end
