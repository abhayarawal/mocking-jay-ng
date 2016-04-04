import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector, Pipe, PipeTransform} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, Location, RouteParams} from 'angular2/router';
import {NgSwitch, NgSwitchWhen, DatePipe, NgStyle, NgForm, Control, NgControlGroup, NgControl, FormBuilder, NgFormModel, ControlGroup, Validators} from 'angular2/common';

import {Http, Response, Headers} from 'angular2/http';
import {Observable} from 'rxjs/Rx';
import 'rxjs/Rx';

import {SegmentService} from './segment.service';
import {CalendarService, MonthPipe, WeekPipe, WeekFullPipe} from './calendar.service';
import {Time, Template, Segment, Status, Fragment} from '../interfaces/interface';

var range = (x, y): number[] => {
	let temp = [];
	for (let j = x; j <= y; j++) { temp.push(j); }
	return temp;
}

var genId = () => {
	return Math.random().toString(36).substr(2, 9);
};


var template: Template = {
	id: genId(),
	name: "advising",
	interval: 15,
	allow_multiple: true,
	require_accept: true
};

var template2: Template = {
	id: genId(),
	name: "Office hour",
	interval: 30,
	allow_multiple: true,
	require_accept: true
};

var segment: Segment = {
	id: genId(),
	template: template,
	start: {
		day: 2,
		month: 3,
		year: 2016,
		hour: 10,
		minute: 30
	},
	end: {
		day: 2,
		month: 3,
		year: 2016,
		hour: 14,
		minute: 15
	},
	repeat: false,
	location: "Empire State Rm205"
};

var segment2: Segment = {
	id: genId(),
	template: template2,
	start: {
		day: 2,
		month: 3,
		year: 2016,
		hour: 17,
		minute: 0
	},
	end: {
		day: 2,
		month: 3,
		year: 2016,
		hour: 20,
		minute: 30
	},
	repeat: false,
	location: "Empire State Rm205"
};

var _segments = [
	segment,
	segment2
]


var genFragments = (segment: Segment): Fragment[] => {
	let [t1, m1] = [segment.start.hour, segment.start.minute],
			[t2, m2] = [segment.end.hour, segment.end.minute];

	let d1: any = new Date(segment.start.year, segment.start.month, segment.start.day, t1, m1),
			d2: any = new Date(segment.start.year, segment.start.month, segment.start.day, t2, m2);

	let diff = (d2 - d1)/1000/60;	
	let fragments = diff / segment.template.interval;

	let increment = ([h, m], inc): [number, number] => {
		if ((m+inc) === 60) {
			return [h + 1, 0];
		} else {
			return [h, m + inc];
		}
	}

	let ret: Fragment[] = [];
	let now: [number, number] = [t1, m1];
	for (let i = 0, l = fragments; i < l; i++) {
		let tmp = now;
		now = increment(now, 15);
		ret.push({
			id: genId(),
			start: {
				year: segment.start.year,
				month: segment.start.month,
				day: segment.start.day,
				hour: tmp[0],
				minute: tmp[1]
			},
			end: {
				year: segment.start.year,
				month: segment.start.month,
				day: segment.start.day,
				hour: now[0],
				minute: now[1]
			},
			segment: segment
		});
	}

	ret[3].status = Status.approved;
	ret[5].status = Status.in_progress;
	ret[6].status = Status.denied;

	return ret;
}


@Pipe({
	name: 'timePipe'
})
export class TimePipe implements PipeTransform {
	transform(obj: Fragment, args: string[]): any {
		let h = obj.start.hour,
			m: any = obj.start.minute;

		if (args[0]) {
			h = obj.end.hour;
			m = obj.end.minute;
		}

		if (m < 10) {
			m = `0${m}`;
		}

		if (h == 12) {
			return `${h}:${m} Pm`;
		}
		else if (h > 12) {
			return `${h - 12}:${m} Pm`;
		}
		return `${h}:${m} Am`;
	}
}

@Component({
	selector: 'segment-unavailable',
	template: `
		<div class="segment">
			<div class="segment__time"></div>
			<div class="fragments">
				<ul>
					<li *ngFor="#a of arr">&nbsp;</li>
				</ul>
			</div>
		</div>
	`
})
class SegmentUnavailable implements OnInit {
	@Input() count: number = 5;
	arr: number[] = [];

	ngOnInit() {
		this.arr = range(1, this.count);
	}
}


@Component({
	selector: 'fragment-component',
	template: `
		<li *ngIf="fragment" (click)="send()" [ngClass]="{selected: selected}" class="segment status__{{fragment.status}}">
			<span class="time">{{fragment | timePipe:false}}</span>
			<span class="event__title" [ngSwitch]="fragment.status" *ngIf="fragment.status">
				<span *ngSwitchWhen="1" [innerHTML]="'In progress'"></span>
				<span *ngSwitchWhen="2" [innerHTML]="'Approved'"></span>
				<span *ngSwitchWhen="3" [innerHTML]="'Denied bitch'"></span>
			</span>
			<span class="lnr lnr-pencil" *ngIf="selected"></span>
		</li>
	`,
	pipes: [TimePipe]
})
class FragmentComponent implements OnInit {
	@Input() fragment;
	observable: Observable<Fragment>;
	selected: boolean = false;

	constructor(private segmentService: SegmentService) {}

	send() {
		if (this.fragment) {
			this.segmentService.triggerContext(this.fragment);
		}
	}

	ngOnInit() {
		this.observable = this.segmentService.contextObservable$;
		this.observable.subscribe(
			data => {
				this.selected = false;
				if (data.id === this.fragment.id) {
					this.selected = true;
				}
			}
		)
	}
}


@Component({
	selector: 'segment-component',
	template: `
		<div class="segment" *ngIf="segment">
			<h3 class="segment__title">
				<span>{{ segment.template.name }}</span>
				{{fragments[0] | timePipe:false}} - {{fragments[fragments.length-1] | timePipe:true}}
			</h3>
			<div class="fragments">
				<ul *ngIf="fragments">
					<fragment-component *ngFor="#fragment of fragments" [fragment]="fragment"></fragment-component>
				</ul>
			</div>
		</div>
		<segment-unavailable [count]="5"></segment-unavailable>
	`,
	directives: [FragmentComponent, SegmentUnavailable],
	pipes: [TimePipe]
})
class SegmentComponent implements OnInit {
	@Input() segment: Segment;
	fragments: Fragment[];

	ngOnInit() {
		this.fragments = genFragments(this.segment);
	}
}


@Component({
	selector: 'segment-wrap',
	template: `
		<div class="segment__wrap">
			<div class="segments">
				<segment-unavailable [count]="2"></segment-unavailable>
				<segment-component *ngFor="#segment of segments" [segment]="segment"></segment-component>
			</div>
		</div>
	`,
	directives: [SegmentUnavailable, SegmentComponent]
})
class SegmentWrap {
	segments = _segments;
}





@Component({
	selector: 'day-component',
	template: `
		<div class="day__component">
			<div *ngIf="month" class="day__header">
				<h3 class="day__date">
					<span>{{ weekDay | weekPipe }}</span>
					{{month | monthPipe}} {{day}}, <span>{{year}}</span>
				</h3>
			</div>
			<segment-wrap></segment-wrap>
		</div>
	`,
	directives: [SegmentWrap],
	pipes: [MonthPipe, WeekPipe],
	providers: [CalendarService]
})
class DayComponent implements OnInit {
	arr: number[] = range(1, 50);

	id: string;
	month: number;
	year: number;
	day: number;
	weekDay: number;

	constructor(private calendarService: CalendarService) {}

	ngOnInit() {
		let [id, date] = this.calendarService.getRouteParams();

		this.id = id;
		this.month = date.getMonth();
		this.year = date.getFullYear();
		this.day = date.getDate();
		this.weekDay = date.getDay();
	}
}


@Component({
	selector: 'fragment-context',
	template: `
		<div class="fragment__context">
			<div *ngIf="!fragment">
				<h2>Nothing selected</h2>
			</div>
			<div *ngIf="fragment">
				<h3>
					{{fragment.segment.template.name}}
				</h3>
				<div>
					From: {{fragment | timePipe:false}} To: {{fragment | timePipe:true}}
				</div>
				<div [ngSwitch]="fragment.status">
					<template [ngSwitchWhen]="1">
						<strong>Appointment not approved yet</strong>
						<button class="button type__2">Cancel appointment</button>
					</template>
					<template [ngSwitchWhen]="2">
						<strong>Appointment approved</strong>
					</template>
					<template [ngSwitchWhen]="3">
						<strong>Appointment denied</strong>
					</template>
					<template ngSwitchDefault>
						<button class="button type__1">Create appointment</button>
					</template>
				</div>
			</div>
		</div>
	`,
	pipes: [TimePipe]
})
class FragmentContext implements OnInit {
	observable: Observable<Fragment>;
	fragment: Fragment;

	constructor(private segmentService:SegmentService) {
	}

	ngOnInit() { 
		this.observable = this.segmentService.contextObservable$;
		this.observable.subscribe(
			data => {
				this.fragment = data;
			},
			err => {},
			() => {}
		)
	}
}


@Component({
	selector: 'segment-viewport',
	template: `
		<div class="segment__viewport">
			<day-component [id]="id" [year]="year" [month]="month" [day]="day"></day-component>
			<fragment-context></fragment-context>
		</div>
	`,
	directives: [DayComponent, FragmentContext]
})
export class SegmentViewport {
}




// end