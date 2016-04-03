import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector, Pipe, PipeTransform} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, Location, RouteParams} from 'angular2/router';
import {NgSwitch, NgSwitchWhen, DatePipe, NgStyle, NgForm, Control, NgControlGroup, NgControl, FormBuilder, NgFormModel, ControlGroup, Validators} from 'angular2/common';

import {CalendarService, MonthPipe, WeekFullPipe} from './calendar.service';
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
	color: "#885EC4",
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
	template: template,
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

	let d1 = new Date(segment.start.year, segment.start.month, segment.start.day, t1, m1),
			d2 = new Date(segment.start.year, segment.start.month, segment.start.day, t2, m2);

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
		});
	}

	return ret;
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
		<li *ngIf="fragment" class="segment__02">
			{{fragment.id}}
		</li>
	`
})
class FragmentComponent {
	@Input() fragment;
}


@Component({
	selector: 'segment-component',
	template: `
		<div class="segment" *ngIf="segment">
			<div class="segment__time">
				<ul>
					<li *ngFor="#fragment of fragments">
						{{fragment.start.hour}}:{{fragment.start.minute}}
					</li>
					<li>
						{{fragments[fragments.length-1].end.hour}}:{{fragments[fragments.length-1].end.minute}}
					</li>
				</ul>
			</div>
			<div class="fragments">
				<ul *ngIf="fragments">
					<fragment-component *ngFor="#fragment of fragments" [fragment]="fragment"></fragment-component>
				</ul>
			</div>
		</div>
		<segment-unavailable [count]="5"></segment-unavailable>
	`,
	directives: [FragmentComponent, SegmentUnavailable]
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
			<div *ngIf="month">
				<h3 class="day__date">{{month | monthPipe}} {{day}}, <span>{{year}}</span></h3>
				<h4>{{ weekDay | weekFullPipe }}</h4>
			</div>
			<segment-wrap></segment-wrap>
		</div>
	`,
	directives: [SegmentWrap],
	pipes: [MonthPipe, WeekFullPipe],
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
	selector: 'segment-viewport',
	template: `
		<div class="segment__viewport">
			<day-component [id]="id" [year]="year" [month]="month" [day]="day"></day-component>
		</div>
	`,
	directives: [DayComponent]
})
export class SegmentViewport {
}