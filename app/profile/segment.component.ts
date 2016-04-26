import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector, Pipe, PipeTransform} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, Location, RouteParams} from 'angular2/router';
import {NgSwitch, NgSwitchWhen, DatePipe, NgStyle, NgForm, Control, NgControlGroup, NgControl, FormBuilder, NgFormModel, ControlGroup, Validators} from 'angular2/common';

import {Http, Response, Headers} from 'angular2/http';
import {Observable} from 'rxjs/Rx';
import 'rxjs/Rx';

import {SegmentViewService} from './segment.view.service';
import {CalendarService, MonthPipe, WeekPipe, WeekFullPipe} from './calendar.service';
import {Time, Template, Message, Segment, Status, Fragment, User, UserType, Invitee, InviteStatus} from '../interfaces/interface';

import {AuthService} from '../auth/auth.service';
import {UserService} from '../services/user.service';
import {FragmentService, FragmentResponse} from '../services/fragment.service';
import {SegmentService} from '../services/segment.service';
import {RouterService} from '../services/router.service';
import {Notification, NotificationService, NotificationModalService, NotifyModal, NotifyTarget} from '../notification.service';

import {RadiusSelectComponent, RadiusRadioComponent, SelectObject} from '../form/form.component';


var range = (x, y): number[] => {
	let temp = [];
	for (let j = x; j <= y; j++) { temp.push(j); }
	return temp;
}

var genId = () => {
	return Math.random().toString(36).substr(2, 9);
};


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

		if (m < 10) { m = `0${m}`; }

		if (h == 12) { return `${h}:${m} PM`; }
		else if (h > 12) { return `${h - 12}:${m} PM`; }
		return `${h}:${m} AM`;
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
	selector: 'spinner',
	template: `
		<div class="spinner">
			<div class="bounce1"></div>
			<div class="bounce2"></div>
			<div class="bounce3"></div>
		</div>
	`
})
class Spinner { }


@Component({
	selector: 'fragment-component',
	template: `
		<li *ngIf="fragment" (click)="send()" [ngClass]="{selected: selected}" class="segment status__{{fragment.status}}">
			<span class="time">{{fragment | timePipe:false}}</span>
			<span class="event__title" [ngSwitch]="fragment.status" *ngIf="fragment.status">
				<span *ngSwitchWhen="1" [innerHTML]="'Waiting for approval'"></span>
				<span *ngSwitchWhen="2" [innerHTML]="'Approved'"></span>
				<span *ngSwitchWhen="3" [innerHTML]="'Denied'"></span>
				<span *ngSwitchWhen="4" [innerHTML]="'Cancelled'"></span>
				<span *ngSwitchWhen="5" [innerHTML]="''"></span>
				<span *ngSwitchWhen="6" [innerHTML]="'Blocked'"></span>
				<span *ngSwitchWhen="7" [innerHTML]="'Invitation'"></span>
			</span>
			<!-- <span class="lnr lnr-pencil" *ngIf="selected"></span> -->

			<div class="histroy" *ngIf="history">
				<span class="icon-blur_on"></span>
			</div>
		</li>
	`,
	pipes: [TimePipe]
})
class FragmentComponent implements OnInit {
	@Input() fragment: Fragment;
	observable: Observable<Fragment>;
	selected: boolean = false;

	session: User;
	users: User[] = [];
	fragment$: Observable<FragmentResponse>;

	history: boolean = false;

	constructor(
		private segmentViewService: SegmentViewService,
		private userService: UserService,
		private fragmentService: FragmentService
	) {
		this.fragment$ = this.fragmentService.fragment$;
		this.fragment$.subscribe(
			(response: FragmentResponse) => {
				if (this.fragment.id == response.id) {
					if ('fragment' in response) {
						if (!('segment' in response.fragment)) {
							response.fragment.segment = this.fragment.segment;
						}
						response.fragment._segment = this.fragment._segment;
						this.fragment = this.fragmentService.validateHistory(response.fragment);
						this.updateHistory();
					}
				}
			});
	}

	updateHistory() {
		this.history = false;
		if ('history' in this.fragment) {
			this.userService.getUser().then((user) => {
				if ('_user' in this.fragment.segment) {
					if (user.id == this.fragment.segment._user) {
						if (this.fragment.history.length > 0)
							this.history = true;
					}
				}
			});
		}
	}

	send() {
		if (this.fragment) {
			this.segmentViewService.triggerContext(this.fragment);
		}
	}

	ngOnInit() {
		this.fragment = this.fragmentService.validateHistory(this.fragment);

		this.observable = this.segmentViewService.contextObservable$;
		this.observable.subscribe(
			data => {
				this.selected = false;
				if (data.id === this.fragment.id) {
					this.selected = true;
				}
			}
		);

		this.updateHistory();
	}
}


@Component({
	selector: 'segment-component',
	template: `
		<div class="segment" *ngIf="segment">
			<h3 class="segment__title">
				<span>{{ segment.template.name }}</span>
				<div *ngIf="fragments.length > 0">
					{{fragments[0] | timePipe:false}} - {{fragments[fragments.length-1] | timePipe:true}}
				</div>
			</h3>
			<div class="fragments" *ngIf="fragments">
				<ul>
					<fragment-component *ngFor="#fragment of fragments" [fragment]="fragment"></fragment-component>
				</ul>
			</div>
		</div>
		<segment-unavailable [count]="5"></segment-unavailable>
	`,
	directives: [FragmentComponent, SegmentUnavailable],
	pipes: [TimePipe],
})
class SegmentComponent implements OnInit {
	@Input() segment: Segment;
	fragments: Fragment[] = [];

	fragments$: Observable<Fragment[]>;

	constructor(
		private fragmentService: FragmentService,
		private routeParams: RouteParams,
		private calendarService: CalendarService
	) {}

	ngOnInit() {
		this.fragments = this.fragmentService.genFragments(this.segment);

		let [_, date] = this.calendarService.getRouteParams();

		let day = date.getDate(),
				month = date.getMonth(),
				year = date.getFullYear();

		this.fragmentService.getFragments(this.segment).then((fragments) => {
			let fgs = fragments.map((fragment) => {
				fragment.id = fragment._id;
				fragment.segment = this.segment;
				delete fragment._id;
				return fragment;
			});
			this.fragments = this.fragmentService.merge(this.fragments, fgs);
		});
	}
}


@Component({
	selector: 'segment-wrap',
	template: `
		<div class="segment__wrap">
			<div class="segments">
				<segment-unavailable [count]="2"></segment-unavailable>
				<div *ngIf="segments">
					<div class="segment" *ngIf="segments.length == 0">
						<h3 class="segment__title">
							<span>No events available</span>
						</h3>
					</div>
					<segment-component *ngFor="#segment of segments" [segment]="segment"></segment-component>
				</div>
				<spinner *ngIf="!segments"></spinner>
			</div>
		</div>
	`,
	providers: [CalendarService],
	directives: [SegmentUnavailable, SegmentComponent, Spinner]
})
class SegmentWrap {
	segments$: Observable<Segment[]>;
	segments: Segment[];

	constructor(
		private calendarService: CalendarService,
		private segmentService: SegmentService,
		private injector: Injector,
		private routerService: RouterService
	) {
	}

	ngOnInit() {
		let [id, date] = this.calendarService.getRouteParams();
		let day = date.getDate(), month = date.getMonth(), year = date.getFullYear();

		if(!id) {
			id = this.routerService.UserId;
		}

		this.segments$ = this.segmentService.segments$;
		this.segments$.subscribe(
			(segments) => {
				this.segments = segments;
			});

		this.segmentService.getSegmentsByRoute(id, month, day, year);
	}
}

@Component({
	selector: 'profile-card',
	template: `
		<div class="profile__card" *ngIf="user">
			<section>
				<img src="{{user.meta.avatar}}" alt="" *ngIf="user.meta?.avatar" />
				<span *ngIf="!user.meta?.avatar">AR</span>
			</section>
			<section>
				<strong>{{user.lname}}, {{user.fname}}</strong>
				{{user.email}}
			</section>
		</div>
	`
})
class ProfileCard {
	@Input() user: User;
}


@Component({
	selector: 'today-event',
	template: `
		<li *ngIf="fragment && user && template">
			<div (click)="select()">
				<span class="status" [ngSwitch]="fragment.status" *ngIf="fragment.status">
					<span *ngSwitchWhen="1" [innerHTML]="'Waiting for approval'"></span>
					<span *ngSwitchWhen="2" [innerHTML]="'Approved'"></span>
					<span *ngSwitchWhen="3" [innerHTML]="'Denied'"></span>
					<span *ngSwitchWhen="4" [innerHTML]="'Cancelled'"></span>
					<span *ngSwitchWhen="5" [innerHTML]="''"></span>
					<span *ngSwitchWhen="6" [innerHTML]="'Blocked'"></span>
					<span *ngSwitchWhen="7" [innerHTML]="'Invitation'"></span>
				</span>
				<span *ngIf="me">[Me]</span>
				<h4>
					<em>{{template.name}}</em> 
					<span class="at">at</span> 
					<span>{{fragment | timePipe:false}} - {{fragment | timePipe:true}}</span>
				</h4>
				<profile-card [user]="user" *ngIf="user"></profile-card>
			</div>
		</li>
		<spinner *ngIf="!user || !template"></spinner>
	`,
	directives: [ProfileCard, Spinner],
	pipes: [TimePipe]
})
export class TodayEvent {
	@Input() fragment: Fragment;
	segment: Segment;
	template: Template;
	user: User;

	me: boolean = true;

	constructor(
		private segmentViewService: SegmentViewService,
		private fragmentService: FragmentService,
		private authService: AuthService
	) { }

	select() {
		this.fragment.id = this.fragment._id;
		this.segment.id = this.segment._id;
		this.template.id = this.template._id;
		this.fragment.segment = this.segment;
		this.fragment.segment.template = this.template;

		if (this.fragment) {
			this.segmentViewService.triggerContext(this.fragment);
		}
	}

	ngOnChanges() {
		let [exists, session] = this.authService.getSession();
		if (this.fragment) {
			if (this.fragment._user == session.id) {
				this.me = false;
			}

			this.fragmentService.getSegmentArray(this.fragment._id).then((response2) => {
				if (response2.success) {
					let [segment, template, user] = response2.payload;
					this.segment = segment;
					this.template = template;
					this.user = user;
				}
			});
		}
	}
}


@Component({
	selector: 'today-events',
	template: `
		<ul *ngIf="fragments" class="today__events">
			<today-event *ngFor="#fragment of fragments" [fragment]="fragment"></today-event>
		</ul>
	`,
	directives: [TodayEvent]
})
export class TodayEvents {
	@Input() fragments: Fragment[];
}

@Component({
	selector: 'day-component',
	template: `
		<div class="day__component" [ngClass]="{move: fragView}">
			<div *ngIf="month" class="day__header">
				<h3 class="day__date">
					<span>{{ weekDay | weekPipe }}</span>
					{{month | monthPipe}} {{day}}, <span>{{year}}</span>
				</h3>
				<div class="ctl">
					<a (click)="getToday()">
						<span *ngIf="!today">View: All my events</span>
						<span *ngIf="today">View: Calendar</span>
					</a>
				</div>
			</div>
			<div *ngIf="today"><today-events [fragments]="todayList"></today-events></div>
			<segment-wrap *ngIf="!today"></segment-wrap>
		</div>
	`,
	directives: [SegmentWrap, TodayEvents],
	pipes: [MonthPipe, WeekPipe],
	providers: [CalendarService]
})
class DayComponent implements OnInit {
	arr: number[] = range(1, 50);
	observable: Observable<Fragment>;

	fragView: boolean = false;
	today: boolean = false;
	todayList: Fragment[] = [];

	id: string;
	month: number;
	year: number;
	day: number;
	weekDay: number;

	constructor(
		private calendarService: CalendarService,
		private segmentViewService: SegmentViewService,
		private fragmentService: FragmentService
	) {}

	ngOnInit() {
		let [id, date] = this.calendarService.getRouteParams();

		this.id = id;
		this.month = date.getMonth();
		this.year = date.getFullYear();
		this.day = date.getDate();
		this.weekDay = date.getDay();

		this.observable = this.segmentViewService.contextObservable$;
		this.observable.subscribe(
			data => {
				this.fragView = true;
			},
			err => { },
			() => { }
		)
	}

	getToday() {
		this.today = !!!this.today;
		if (this.today) {
			this.fragmentService.getToday(
				this.month,
				this.day,
				this.year
			).then((response) => {
				this.todayList = response;
			});
		}
	}
}

@Pipe({
	name: 'msgDate'
})
export class MessageDatePipe implements PipeTransform {
	transform(date: string, args: string[]): any {
		return moment(date).calendar();
	}
}

@Component({
	selector: 'fragment-message',
	template: `
		<div *ngIf="fragment" class="message__wrap">
			<div *ngIf="fragment.messages && fragment.messages.length > 0">
				<div *ngFor="#msg of fragment.messages">
					<div class="message" [ngClass]="{response: msg.type==1}">
						{{msg.body}}
						<em *ngIf="msg.date">
							{{msg.date | msgDate}}
							<span *ngIf="user && user.type==msg.type">[Me]</span>
						</em>
					</div>
				</div>
			</div>
		</div>
	`,
	pipes: [MessageDatePipe]
})
class FragmentMessage implements OnInit {
	@Input() fragment: Fragment;
	sorted: Message[];
	user: User;

	constructor(
		private authService: AuthService
	) {
	}

	ngOnInit() {
		let [exists, session] = this.authService.getSession();
		if (exists) this.user = session;
	}
}

interface Timey {
	value: number,
	text: string
}

@Component({
	selector: 'fragment-ctx-header',
	template: `
		<div class="fragment__ctx__header">
			<ul>
				<li>
					<a tabindex="150" (blur)="show=false">
						<div class="selected" (click)="show=!show">
							<span class="icon-notifications_true"></span>
							<em>Alert {{times[selected].text}}</em>
						</div>
						<ul [ngClass]="{visible: show}">
							<li *ngFor="#time of times; #i = index" (click)="remind(i)">
								{{time.text}}
							</li>
						</ul>
					</a>
				</li>
				<li>
					<a>
						<div class="selected" (click)="notification=!notification">
							<span class="icon-alarm"></span>
							<em>Nofication <span *ngIf="notification">On</span> <span *ngIf="!notification">Off</span></em>
						</div>
					</a>
				</li>
			</ul>
		</div>
	`
})
class FragmentCtxHeader {

	show: boolean = false;
	selected: number = 2;
	timeout: any;
	notification: boolean = true;

	times: Timey[] = [
		{ value: -1, text: 'None' },
		{ value: 15, text: '15 minutes' },
		{ value: 30, text: '30 minutes' },
		{ value: 60, text: '1 hour' },
		{ value: 120, text: '2 hour' },
		{ value: 1440, text: '1 day' },
	];

	remind(index: number) {
		this.selected = index;

		clearTimeout(this.timeout);
		this.timeout = setTimeout(() => {
			this.show = false;
		}, 100);
	}

}

interface ValidationResult {
	[key: string]: boolean;
}

class InviteeValidator {
	static shouldBeEmail(control: Control): ValidationResult {
		let regExp = /^[a-z0-9-_\.]+@[a-z0-9-]+(\.\w+){1,4}$/i;
		let validation = regExp.test(control.value.trim());
		if (!validation) {
			return { "shoudBeEmail": true };
		}
		return null;
	}
}

@Component({
	selector: 'fragment-invitees',
	template: `
		<div class="from__group invitees__box">
			<label>Invitees:</label>
			<ul>
				<li *ngFor="#invity of invitees; #i = index">
					<span class="icon-mail"></span>
					{{invity}}
					<a (click)="remove(i)">Remove</a>
				</li>
			</ul>
			<div class="invitees__form">
				<form [ngFormModel]="invityForm">
					<input type="email" [(ngModel)]="email" ngControl="invityEmail" />
					<button (click)="add()">Invite</button>
				</form>
			</div>
		</div>
	`
})
class FragmentInvitees implements OnInit {
	@Output() update = new EventEmitter<[boolean, string[]]>();

	invitees: string[] = [];
	invityEmail: Control;
	invityForm: ControlGroup;
	sessionEmail: string;

	email: string = "";

	constructor(
		private fb: FormBuilder,
		private userService: UserService,
		private notificationService: NotificationService
	) {
		this.invityEmail = new Control('', Validators.compose([Validators.required, InviteeValidator.shouldBeEmail]));
		this.invityForm = fb.group({
			'invityEmail': this.invityEmail
		});
	}

	ngOnInit() {
		this.userService.getUser().then((user) => {
			this.sessionEmail = user.email;
		});

		this.emit(true);
	}

	remove(index: number) {
		this.invitees.splice(index, 1);
		this.emit(true);
	}

	emit(valid: boolean) {
		this.update.next([valid, this.invitees]);
	}

	add() {
		if (this.invityForm.valid) {
			let {invityEmail} = this.invityForm.value;

			this.userService.getUserByEmailPromise(invityEmail).then(
				(response) => {
					if (response.success) {
						if (response.payload.email == this.sessionEmail) {
							this.notificationService.notify(`You can't add yourself as an invitee :(`, true, true);
						} else {
							if (response.payload.type == 'faculty') {
								this.notificationService.notify(`You can't add a faculty member :(`, true, true);
							} else {
								this.invitees.push(invityEmail);
								this.email = "";
								this.emit(true);
							}
						}
					} else {
						this.notificationService.notify(`${invityEmail} not found in our system`, true, true);
					}
				});
		}
	}
}

@Component({
	selector: 'fragment-profile',
	template: `
		<div *ngIf="user" class="ctx__profile">
			<section>
				<img src="{{user.meta?.avatar}}" />
			</section>
			<section>
				<h5>{{user.fname}} {{user.lname}}</h5>
				{{user.email}}
			</section>
		</div>
	`
})
class FragmentProfile {
	@Input() user;
}

@Component({
	selector: 'fragment-invitee-list',
	template: `
		<div class="fragment__invitee__list" *ngIf="fragment">
			<ul>
				<li *ngFor="#invity of fragment.invitees">
					<span [ngSwitch]="invity.status">
						<span *ngSwitchWhen="0" [innerHTML]="'Request pending'"></span>
						<span *ngSwitchWhen="1" [innerHTML]="'Accepted'"></span>
						<span *ngSwitchWhen="2" [innerHTML]="'Declined'"></span>
					</span>
					{{invity.email}}
				</li>
			</ul>
		</div>
	`
})
class FragmentInviteeList {
	@Input() fragment: Fragment;
}


@Component({
	selector: 'fragment-invitation',
	template: `
		<div class="invitee__template">
			<h5>Invitation by</h5>
			<div *ngIf="invitor">
				<fragment-profile [user]="invitor"></fragment-profile>
				<div *ngIf="session && invitee">
					<div [ngSwitch]="invitee.status">
						<template [ngSwitchWhen]="0">
							<strong>You haven't replied to the invitation</strong>
						</template>
						<template [ngSwitchWhen]="1">
							<strong>You've accepted the invitation</strong>
						</template>
						<template [ngSwitchWhen]="2">
							<strong>You've declined the invitation</strong>
						</template>
					</div>
					<div class="form__group border_a" *ngIf="momentAl">
						<a (click)="accept()">Accept Invitation</a>
						<a (click)="decline()">Decline Invitation</a>
					</div>
				</div>
				
				<fragment-invitee-list [fragment]="fragment"></fragment-invitee-list>
			</div>
		</div>
	`,
	directives: [FragmentProfile, FragmentInviteeList]
})
class FragmentInvitation implements OnInit {
	@Input() fragment: Fragment;
	@Input() momentAl: boolean;

	invitor: User;
	session: User;
	invitee: Invitee;

	constructor(
		private fragmentService: FragmentService,
		private userService: UserService
	) {}

	update() {
		if (this.fragment.status == Status.invite) {
			this.userService.getUserPromise(this.fragment._user).then((response) => {
				if (response.success) {
					this.invitor = response.payload;

					this.userService.getUser().then(user => {
						this.session = user;
						this.fragment.invitees.forEach(invitee => {
							if (invitee.email == user.email) {
								this.invitee = invitee;
							}
						});
					});
				} else {
				}
			});
		}
	}

	ngOnInit() {
		this.update();
	}

	ngOnChanges() {
		this.update();
	}

	accept() {
		this.fragmentService.updateInvitation(InviteStatus.Accepted, this.fragment);
	}

	decline() {
		this.fragmentService.updateInvitation(InviteStatus.Declined, this.fragment);
	}
}

interface ErrorMessage {
	message: string,
	error: boolean
}

@Component({
	selector: 'fragment-context-student',
	template: `
		<div class="fragment__ctx">
			<h3 class="ctx__head">
				{{fragment.segment.template.name}}
			</h3>
			<div class="date__time">
				From: <span>{{fragment | timePipe:false}}</span> To: <span>{{fragment | timePipe:true}}</span>
			</div>
			<div>
				Location: N/A
			</div>
			<div *ngIf="!talk">
				<div [ngSwitch]="fragment.status" class="ctx__controls" *ngIf="allowed">
					<template [ngSwitchWhen]="1">
						<strong>Appointment not approved yet</strong>
						<fragment-message [fragment]="fragment"></fragment-message>
						<div *ngIf="momentAl">
							<div class="form__group message__box">
								<label for="">Send message: </label>
								<textarea [(ngModel)]="message" (keyup.enter)="sendMessage()"></textarea>
								<a (click)="sendMessage()" class="icon-paperplane"></a>
							</div>
							<div class="form__group">
								<button class="button type__1" (click)="cancel()">
									<span class="icon-close"></span>Cancel appointment
								</button>
							</div>
						</div>
						<fragment-invitee-list [fragment]="fragment"></fragment-invitee-list>
					</template>
					<template [ngSwitchWhen]="2">
						<strong>Appointment approved</strong>
						<fragment-ctx-header></fragment-ctx-header>
						<fragment-message [fragment]="fragment"></fragment-message>
						<div *ngIf="momentAl">
							<div class="form__group message__box">
								<label for="">Send message: </label>
								<textarea [(ngModel)]="message" (keyup.enter)="sendMessage()"></textarea>
								<a (click)="sendMessage()" class="icon-paperplane"></a>
							</div>
							<div class="form__group">
								<button class="button type__1" (click)="cancel()">
									<span class="icon-close"></span>Cancel appointment
								</button>
							</div>
						</div>
						<fragment-invitee-list [fragment]="fragment"></fragment-invitee-list>
					</template>
					<template [ngSwitchWhen]="3">
						<strong>Appointment denied</strong>
						<fragment-message [fragment]="fragment"></fragment-message>
					</template>
					<template [ngSwitchWhen]="4">
						<strong>Appointment cancelled</strong>
						<fragment-message [fragment]="fragment"></fragment-message>
					</template>

					<template [ngSwitchWhen]="5">
						<strong>Appointment time not available</strong>
						<fragment-message [fragment]="fragment"></fragment-message>
					</template>

					<template [ngSwitchWhen]="6">
						<strong>Appointment time blocked by advisor</strong>
						<fragment-message [fragment]="fragment"></fragment-message>
					</template>
						
					<template [ngSwitchWhen]="7">
						<fragment-invitation [invitor]="invitor" [fragment]="fragment" [momentAl]="momentAl"></fragment-invitation>
					</template>

					<template ngSwitchDefault>
						<div class="form__group">
							<label for="">Message: </label>
							<textarea [(ngModel)]="message"></textarea>
						</div>
						<fragment-invitees (update)="invitees($event)"></fragment-invitees>
						<div *ngIf="momentAl">
							<div class="form__group border_a">
								<button class="button type__3" (click)="create()">
									<span class="icon-done"></span>Create appointment
								</button>
							</div>
						</div>
					</template>
				</div>
				<div *ngIf="!allowed && errorMessage" class="not__allowed" [ngClass]="{error: errorMessage.error}">
					<h4>{{errorMessage.message}}</h4>
				</div>
			</div>
			<spinner *ngIf="talk"></spinner>
		</div>
	`,
	directives: [FragmentMessage, RadiusSelectComponent, RadiusRadioComponent, FragmentCtxHeader, FragmentInvitees, FragmentInvitation, FragmentInviteeList, Spinner],
	pipes: [TimePipe]
})
class FragmentContextStudent implements OnInit {
	@Input() fragment: Fragment;
	@Input() user: User;

	message: string = "";
	notification$: Observable<Notification>;
	user$: Observable<User>;
	fragment$: Observable<FragmentResponse>;

	notifyTargetObr$: Observable<NotifyTarget>;
	notifyModal: NotifyModal;

	talk: boolean;
	
	allowed: boolean;
	errorMessage: ErrorMessage;
	momentAl: boolean;


	notify_select: SelectObject[] = [
		{ value: 10, text: '10 min' },
		{ value: 15, text: '15 min' },
		{ value: 30, text: '30 min' },
		{ value: 60, text: '1 hour' },
		{ value: 120, text: '2 hour' },
		{ value: 1440, text: '1 day' }
	];

	constructor(
		private segmentViewService: SegmentViewService,
		private notificationService: NotificationService,
		private fragmentService: FragmentService,
		private segmentService: SegmentService,
		private userService: UserService,
		private authService: AuthService,
		private NMService: NotificationModalService
	) {
		this.notification$ = this.fragmentService.notification$;
		this.notification$.subscribe(
			(response) => {
				this.notificationService.notify(response.message, true, !response.type);
			});

		this.notifyTargetObr$ = this.NMService.notifyTargetObr$;

		this.fragment$ = this.fragmentService.fragment$;
		this.fragment$.subscribe(
			(response: FragmentResponse) => {
				if (this.fragment.id == response.id) {
					if ('fragment' in response) {
						if (!('segment' in response.fragment)) {
							response.fragment.segment = this.fragment.segment;
						}
						if (this.fragment._user) {
							response.fragment._user = this.fragment._user;
						}
						response.fragment._segment = this.fragment._segment;
						this.fragment = this.fragmentService.validateHistory(response.fragment);
					}
				}
			});
	}

	momentAllowed(): boolean {
		this.allowed = true;
		var nowMoment = moment();
		var fragDate = this.fragment.date;
		var fragStart = this.fragment.start;
		var targetMoment = moment(new Date(fragDate.year, fragDate.month, fragDate.day, fragStart.hour, fragStart.minute));

		return !((targetMoment - nowMoment) < 0);
	}

	validateMultiple() {
		this.talk = true;
		let run = false;
		this.allowed = true;

		let [exists, session] = this.authService.getSession();
		if (this.fragment.persistent) {
			run = true;
		} else {
			if (this.fragment._user) {
				if (!(this.fragment._user == session.id)) {
					let in_invite = false;
					if ('invitees' in this.fragment) {
						this.fragment.invitees.forEach((invitee) => {
							if (invitee.email == session.email) { in_invite = true; }
						});
						if (!in_invite) { run = true; }
					} else {
						run = true;
					}
				}
			} else {
				run = true;
			}
		}
		
		if (run) {
			this.segmentService.validateMultiple(this.fragment._segment).then((response) => {
				this.allowed = response.allow;
				if (!response.allow) {
					this.errorMessage = {
						message: `Sorry, you cannot create multiple appointments for ${this.fragment.segment.template.name} in the same day.`,
						error: false
					}
				} 

				if (!this.momentAl) {
					this.errorMessage = {
						message: `Sorry, but the moment's passed. Might wanna call Doctor Who.`,
						error: true
					}
					this.allowed = false;
				}

				this.talk = false;
			});
		} else {
			this.talk = false;
		}
	}

	ngOnInit() {
	}

	ngOnChanges() {
		this.momentAl = this.momentAllowed();
		this.validateMultiple();
	}

	cancel() {
		let target = genId();
		this.NMService.show({
			heading: `You're about to perform an irreversible action`,
			message: `Are you sure you want to cancel this appointment?`,
			target: target,
			display: `Cancel`,
			error: true
		});
		this.notifyTargetObr$.subscribe(
			(done) => {
				if (done.target == target && done.payload == true) {
					this.fragment.status = Status.cancelled;
					this.update();
				}
			});
	}

	invitees([valid, invitees]) {
		if (valid) {
			this.fragment.invitees = invitees;
		}
	}

	sendMessage() {
		if (this.message.trim().length > 0) {
			this.fragment.message = this.message.trim();
			this.fragmentService.updateFragment(this.fragment);
			this.message = '';
		}
	}

	update() {
		if (this.message.trim().length > 0) {
			this.fragment.message = this.message.trim();
		}
		this.fragmentService.updateFragment(this.fragment);
		this.message = '';
	}

	create() {
		let target = genId();
		this.NMService.show({
			heading: `You're about to perform an irreversible action`,
			message: `Are you sure you want to create this appointment?`,
			target: target,
			display: `Create appointment`,
			error: false
		});
		this.notifyTargetObr$.subscribe(
			(done) => {
				if (done.target == target && done.payload == true) {
					if (this.fragment.segment.template.require_accept) {
						this.fragment.status = Status.in_progress;
					} else {
						this.fragment.status = Status.approved;
					}

					this.update();
				}
			});
	}
}

@Component({
	selector: 'fragment-context-faculty',
	template: `
		<div class="message__history" *ngIf="history && historyUser && historyFrag">
			<button (click)="flushHistory()" class="icon-close"></button>
			<profile-card [user]="historyUser"></profile-card>
			<span class="status" [ngSwitch]="historyFrag.status" *ngIf="historyFrag.status">
				<span *ngSwitchWhen="1" [innerHTML]="'Waiting for approval'"></span>
				<span *ngSwitchWhen="2" [innerHTML]="'Approved'"></span>
				<span *ngSwitchWhen="3" [innerHTML]="'Denied'"></span>
				<span *ngSwitchWhen="4" [innerHTML]="'Cancelled'"></span>
				<span *ngSwitchWhen="5" [innerHTML]="''"></span>
				<span *ngSwitchWhen="6" [innerHTML]="'Blocked'"></span>
				<span *ngSwitchWhen="7" [innerHTML]="'Invitation'"></span>
			</span>
			<fragment-message [fragment]="historyFrag"></fragment-message>
		</div>

		<div class="fragment__ctx">
			<div class="fragment__history" *ngIf="users">
				<span *ngFor="#user of users">
					<img (click)="showHistory(user.id)" src="{{user.meta?.avatar}}" alt="" />
				</span>
			</div>

			<h3 class="ctx__head">
				{{fragment.segment.template.name}}
			</h3>
			<div class="date__time">
				From: <span>{{fragment | timePipe:false}}</span> To: <span>{{fragment | timePipe:true}}</span>
			</div>
			<div>
				Location: N/A
			</div>
			<div [ngSwitch]="fragment.status" class="ctx__controls">
				<template [ngSwitchWhen]="1">
					<fragment-profile [user]="template_user"></fragment-profile>
					<strong>Appointment not approved yet</strong>
					<fragment-message [fragment]="fragment"></fragment-message>
					<div *ngIf="momentAl">
						<div class="form__group message__box">
							<label for="">Send message:</label>
							<textarea [(ngModel)]="response" (keyup.enter)="respond()"></textarea>
							<a (click)="respond()" class="icon-paperplane"></a>
						</div>
						<div class="form__group border_a">
							<button class="button type__3" (click)="approve()">
								<span class="icon-done"></span>Approve appointment
							</button>
						</div>
						<div class="cancels">
							<a (click)="deny()">Deny appointment</a>
							<a href="">Deny and make unavailable</a>
						</div>
					</div>
					<fragment-invitee-list [fragment]="fragment"></fragment-invitee-list>
				</template>

				<template [ngSwitchWhen]="2">
					<fragment-profile [user]="template_user"></fragment-profile>
					<strong>Appointment approved</strong>
					<fragment-ctx-header></fragment-ctx-header>
					<fragment-message [fragment]="fragment"></fragment-message>
					<div *ngIf="momentAl">
						<div class="form__group message__box">
							<label for="">Send message:</label>
							<textarea [(ngModel)]="response" (keyup.enter)="respond()"></textarea>
							<a (click)="respond()" class="icon-paperplane"></a>
						</div>
						<div class="form__group border_a">
							<button class="button type__1" (click)="cancel()">
								<span class="icon-close"></span>Cancel appointment
							</button>
						</div>
						<div class="cancels">
							<a href="">Cancel and make unavailable for everyone</a>
						</div>
					</div>
					<fragment-invitee-list [fragment]="fragment"></fragment-invitee-list>
				</template>

				<template [ngSwitchWhen]="3">
					<strong>Appointment denied</strong>
					<fragment-message [fragment]="fragment"></fragment-message>
					<div *ngIf="momentAl">
						<div class="cancels">
							<a (click)="block()">Block interval for everyone</a>
						</div>
					</div>
				</template>

				<template [ngSwitchWhen]="4">
					<fragment-profile [user]="template_user"></fragment-profile>
					<strong>Appointment cancelled</strong>
					<fragment-message [fragment]="fragment"></fragment-message>
					<div *ngIf="momentAl">
						<div class="cancels">
							<a (click)="block()">Block interval for everyone</a>
						</div>
					</div>
				</template>

				<template [ngSwitchWhen]="6">
					<strong>Appointment blocked for everyone</strong>
					<fragment-message [fragment]="fragment"></fragment-message>
					<div *ngIf="momentAl">
						<div class="cancels">
							<button class="button type__2" (click)="open()">
								<span class="icon-done"></span>Unblock interval
							</button>
						</div>
					</div>
				</template>
				<template ngSwitchDefault>
					<div *ngIf="momentAl">
						<div class="border_a">
							<button class="button type__1" (click)="block()">
								<span class="icon-close"></span>Block interval
							</button>
						</div>
					</div>
				</template>
			</div>
		</div>
	`,
	directives: [FragmentMessage, FragmentProfile, RadiusRadioComponent, RadiusSelectComponent, FragmentCtxHeader, FragmentInviteeList, ProfileCard],
	pipes: [TimePipe]
})
class FragmentContextFaculty implements OnInit {
	@Input() fragment: Fragment;
	@Input() user: User;

	users: User[];
	template_user: User;
	response: string = '';

	notification$: Observable<Notification>;
	user$: Observable<User>;
	fragment$: Observable<FragmentResponse>;
	notifyTargetObr$: Observable<NotifyTarget>;

	momentAl: boolean;

	history: boolean = false;
	historyUser: User;
	historyFrag: Fragment;

	notify_select: SelectObject[] = [
		{ value: 10, text: '10 min' },
		{ value: 15, text: '15 min' },
		{ value: 30, text: '30 min' },
		{ value: 60, text: '1 hour' },
		{ value: 120, text: '2 hour' },
		{ value: 1440, text: '1 day' }
	];

	constructor(
		private segmentViewService: SegmentViewService,
		private notificationService: NotificationService,
		private fragmentService: FragmentService,
		private userService: UserService,
		private NMService: NotificationModalService
	) {
		this.notification$ = this.fragmentService.notification$;
		this.notification$.subscribe(
			(response) => {
				this.notificationService.notify(response.message, true, !response.type);
			});

		this.notifyTargetObr$ = this.NMService.notifyTargetObr$;

		this.fragment$ = this.fragmentService.fragment$;
		this.fragment$.subscribe(
			(response: FragmentResponse) => {
				if (this.fragment.id == response.id) {
					this.users = [];
					if ('fragment' in response) {
						if (!('segment' in response.fragment)) {
							response.fragment.segment = this.fragment.segment;
						}
						// console.log(response.fragment._user);
						if (this.fragment._user) {
							response.fragment._user = this.fragment._user;
						}
						response.fragment._segment = this.fragment._segment;
						this.fragment = this.fragmentService.validateHistory(response.fragment);
						this.histroyLine();
						this.momentAl = this.momentAllowed();
						this.userService.getUser(this.fragment._user);
					}
				}
			});
	}

	ngOnInit() {
	}

	momentAllowed(): boolean {
		var nowMoment = moment();
		var fragDate = this.fragment.date;
		var fragStart = this.fragment.start;
		var targetMoment = moment(new Date(fragDate.year, fragDate.month, fragDate.day, fragStart.hour, fragStart.minute));

		return !((targetMoment - nowMoment) < 0);
	}

	ngOnChanges() {
		this.flushHistory();
		this.users = [];
		this.user$ = this.userService.user$;
		this.user$.subscribe(
			(user) => {
				if (this.fragment._user == user.id) {
					this.template_user = user;
				}
			});
		if (this.fragment._user) {
			this.userService.getUser(this.fragment._user);
		}

		this.histroyLine();
		this.momentAl = this.momentAllowed();
	}

	update(status: Status) {
		if (this.response.trim().length > 0) {
			this.fragment.message = this.response.trim();
		}

		let fragment = this.fragment;
		fragment.status = status;
		this.fragmentService.updateFragment(fragment);

		this.response = '';
	}

	respond() {
		if (this.response.trim().length > 0) {
			this.update(this.fragment.status);
		}
	}

	deny() {
		this.modal({
			heading: `You're about to perform an irreversible action`,
			message: `Are you sure you want to deny this appointment?`,
			target: ``,
			display: `Deny`,
			error: true
		}, Status.denied);
		// this.update(Status.denied);
	}

	modal(notifyModal: NotifyModal, status: Status) {
		let target = genId();
		notifyModal.target = target;
		this.NMService.show(notifyModal);
		this.notifyTargetObr$.subscribe(
			(done) => {
				if (done.target == target && done.payload == true) {
					this.update(status);
				}
			});
	}

	cancel() {
		this.modal({
			heading: `You're about to perform an irreversible action`,
			message: `Are you sure you want to cancel this appointment?`,
			target: ``,
			display: `Cancel`,
			error: true
		}, Status.cancelled);
		// this.update(Status.cancelled);
	}

	approve() {
		this.modal({
			heading: `You're about to perform an irreversible action`,
			message: `Are you sure you want to approve this appointment?`,
			target: ``,
			display: `Approve`,
			error: false
		}, Status.approved);
	}

	open() {
		this.update(Status.default);
	}

	block() {
		this.update(Status.blocked);
	}

	flushHistory() {
		this.historyFrag = null;
		this.history = null;
		this.historyUser = null;
	}

	showHistory(uid: string) {
		if ('history' in this.fragment) {
			this.history = true;
			let index = this.fragment.history.map(history => history._user).indexOf(uid);
			let index2 = this.users.map(user => user.id).indexOf(uid);
			this.historyUser = this.users[index2];
			this.historyFrag = {
				messages: this.fragment.history[index].messages,
				status: this.fragment.history[index].status
			};
		}
	}

	histroyLine() {
		if ('history' in this.fragment) {
			this.users = [];
			for (var i = 0, l = this.fragment.history.length; i < l; i++) {
				this.userService.getUserPromise(this.fragment.history[i]._user).then(
					response => {
						if (response.success) {
							let usr = response.payload; usr.id = usr._id; delete usr._id;
							this.users.push(usr);
						}
					});
			}
		}
	}

}


@Component({
	selector: 'fragment-context',
	template: `
		<div class="fragment__context" *ngIf="fragment && session">
			<fragment-context-student [user]="session" [fragment]="fragment" *ngIf="!(session.id==fragment.segment._user)"></fragment-context-student>
			<fragment-context-faculty [user]="session" [fragment]="fragment" *ngIf="(session.id==fragment.segment._user)"></fragment-context-faculty>
		</div>
		<div class="fragment__context" *ngIf="fragment && unauthorized">
			<h3>Nothing to see here</h3>
		</div>
	`,
	directives: [FragmentContextStudent, FragmentContextFaculty],
	pipes: [TimePipe],
	providers: [CalendarService]
})
class FragmentContext implements OnInit {
	observable: Observable<Fragment>;
	fragment: Fragment;
	session: User;

	constructor(
		private userService: UserService,
		private segmentViewService:SegmentViewService,
		private routeParams: RouteParams,
		private notificationService: NotificationService,
		private calendarService: CalendarService,
		private routerService: RouterService
	){
	}

	ngOnInit() { 
		let uid = this.routerService.UserId;

		this.observable = this.segmentViewService.contextObservable$;
		this.observable.subscribe(
			data => {
				this.fragment = data;
			},
			err => { },
			() => { }
		);

		this.userService.getUser().then(user => {
			this.session = user;
		});
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