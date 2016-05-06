import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector, Pipe, PipeTransform} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, Location, RouteParams, OnActivate, ComponentInstruction} from 'angular2/router';
import {NgSwitch, NgSwitchWhen, DatePipe, NgStyle, NgForm, Control, NgControlGroup, NgControl, FormBuilder, NgFormModel, ControlGroup, Validators} from 'angular2/common';

import {Http, Response, Headers} from 'angular2/http';
import {Observable} from 'rxjs/Rx';
import 'rxjs/Rx';

import {LayoutHeader} from '../layouts/header.layout';
import {Calendar} from './calendar.component';
import {User, UserType, Faculty, Segment, Fragment, Template} from '../interfaces/interface';

import {AuthService} from '../auth/auth.service';
import {UserService} from '../services/user.service';
import {FragmentService} from '../services/fragment.service';
import {CalendarService} from './calendar.service';
import {SegmentViewport, TodayEvent, TodayEvents} from './segment.component';
import {FacultyService} from '../services/faculty.service';
import {NotificationService, Notification} from '../notification.service';
import {RouterService} from '../services/router.service';


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
	selector: 'time-now',
	template: `
		<div class="time__now">
			{{display}}
		</div>
	`
})
class TimeNow implements OnInit {
	display: string;
	interval: any;

	constructor(
		private authService: AuthService
	) {}

	ngOnInit() {
		this.interval = setInterval(() => {
			let now = moment().format('LTS');
			this.display = now;
		}, 1000);
	}

	ngOnDestroy() {
		clearInterval(this.interval);
	}
}

@Component({
	selector: 'profile-context',
	template: `
		<div class="profile__context">
			<div class="row">
				<section>
					<ul>
						<li><a href="">Today's Events</a></li>
						<li><a class="selected" [routerLink]="['/ProfileViewport', 'CalendarRouter', {id: id}, 'DaySegment', {month: month, day: day, year: year}]">Calendar</a></li>
					</ul>
				</section>
				<section class="context__header">
					<h4>
						&nbsp;
					</h4>
				</section>
				<section>
					<ul>
						<li><a href="" class="lnr lnr-sync"></a></li>
						<li><a href="">Today</a></li>
						<li><a (click)="prevDay()" class="lnr lnr-chevron-left"></a></li>
						<li><a (click)="nextDay()" class="lnr lnr-chevron-right"></a></li>
					</ul>
				</section>
			</div>
		</div>
	`,
	directives: [RouterLink, TimeNow]
})
class ProfileContext implements OnInit {
	@Input() day: string = "";
	@Input() month: string = "";
	@Input() year: string = "";
	@Input() id: string = "";

	constructor(private router: Router) {}

	getDate(year, month, day): Date {
		return new Date(parseInt(year), parseInt(month), (parseInt(day)));
	}

	prevDay(): void {
		let prev = this.getDate(this.year, this.month, parseInt(this.day)-1);
		this.router.navigateByUrl(`/calendar/${this.id}/day/${prev.getMonth()}/${prev.getDate()}/${prev.getFullYear()}`);
	}

	nextDay(): void {
		let next = this.getDate(this.year, this.month, parseInt(this.day)+1);
		this.router.navigateByUrl(`/calendar/${this.id}/day/${next.getMonth()}/${next.getDate()}/${next.getFullYear()}`);
	}

	ngOnInit() {
	}

	get today() {
		let date = this.getDate(this.year, this.month, this.day);
		return `${date.toString().match(/([\w]+\s){1,4}/i)[0].trim()}`;
	}
}

@Component({
	selector: 'contact-card',
	template: `
		<div class="overlay" *ngIf="user"></div>
		<div class="contact__wrap__modal" *ngIf="user">
			<a class="icon-close" (click)="close()"></a>
			<div class="contact__card">
				<section class="avatar">
					<img src="{{user.meta?.avatar}}" *ngIf="user.meta.avatar" alt="" />
					<span *ngIf="!user.meta.avatar">AR</span>
				</section>
				<h3>{{user.lname}}, {{user.fname}}</h3>
				<ul class="email">
					<li>{{user.email}}</li>
					<li *ngFor="#mail of user.meta.emails" *ngIf="user.meta.emails">
						<span *ngIf="mail?.show">{{mail.email}}</span>
					</li>
				</ul>
			</div>
		</div>
	`
})
class ContactCard {
	@Input() user;
	@Output() hide = new EventEmitter<boolean>();

	close() {
		this.hide.next(false);
	}
}


@Component({
	selector: 'profile-nav',
	template: `
		<div class="profile__nav" *ngIf="user">
			<contact-card [user]="user" *ngIf="card" (hide)="hideCard($event)"></contact-card>
			<div class="profile__card__nav">
				<img src="{{user.meta?.avatar}}" />
				<h3>
					{{user.fname}} {{user.lname}}
				</h3>
				<div class="profile__mail"><a href="mailto:{{user.email}}">{{user.email}}</a></div>
				<ul>
					<li *ngIf="session.id!==user.id">
						<a class="lnr lnr-pushpin" (click)="togglePin()" [ngClass]="{pinned: pinned}"></a>
					</li>
					<li><a class="lnr lnr-license" (click)="showCard()"></a></li>
					<li><a [routerLink]="['/ProfileViewport', 'CalendarRouter', {id: user.id}]" class="lnr lnr-calendar-full"></a></li>
					<li><a href="" class="lnr lnr-download"></a></li>
				</ul>
			</div>
			<calendar [id]="user.id"></calendar>
			<div class="faculty__list">
				<ul *ngIf="users">
					<li *ngFor="#usr of users">
						<a [routerLink]="['/ProfileViewport', 'CalendarRouter', {id: usr.id}]">
							<img src="{{usr.meta?.avatar}}" alt="" />
							<section>
								<span>{{usr.fname}} {{usr.lname}}</span>
								<span>{{usr.email}}</span>
							</section>
						</a>
					</li>
				</ul>
			</div>
		</div>
	`,
	directives: [Calendar, RouterLink, ContactCard]
})
class ProfileNav implements OnInit {
	@Input() user: User;

	card: boolean = false;

	day: String = '';
	month: String = '';
	year: String = '';

	pinned: boolean;
	users: User[];
	session: User;

	observable: Observable<Faculty[]>;
	notification$: Observable<Notification>;

	constructor(
		private authService: AuthService,
		private facultyService: FacultyService,
		private router: Router,
		private notificationService: NotificationService,
		private userService: UserService
	) { }

	ngOnInit() {
		let [_, session] = this.authService.getSession();
		this.session = session;

		let day = new Date();
		this.day = `${day.getDate()}`;
		this.month = `${day.getMonth()}`;
		this.year = `${day.getFullYear()}`;

		this.notification$ = this.facultyService.notification$;
		this.notification$.subscribe(
			(response) => {
				this.notificationService.notify(response.message, true, !response.type);
			});

		this.observable = this.facultyService.observable$;
		this.observable.subscribe(
			(faculties) => {
				let [pinned, _] = this.facultyService.inFaculty(this.user);
				this.pinned = pinned;

				this.users = [];
				if (faculties.length > 0) {
					faculties.forEach(faculty => {
						this.userService.getUserPromise(faculty._faculty).then(
							response => { 
								if (response.success) {
									let usr = response.payload;
									usr.id = usr._id;
									delete usr._id;
									this.users.push(usr);
								}
							});
					});
				}
			}
		);
	}

	showCard() {
		this.card = true;
	}

	hideCard(next) {
		this.card = false;
	}

	togglePin() {
		this.facultyService.toggleFaculty(this.user);
	}

	ngOnChanges() {
		if (this.user) {
			console.log(this.user.email);
			this.facultyService.getFaculties();
		}
	}
}

@Component({
	template: `
		<div class="profile__outlet">
			<div class="overview__events">
				<h3>Upcoming Events</h3>
				<h5>Today</h5>
				<section *ngIf="fragments">
					<strong *ngIf="fragments.length < 1">Nothing for today</strong>
					<today-events [fragments]="fragments"></today-events>
				</section>
				<spinner *ngIf="!fragmentsNext"></spinner>
				
				<h5>Tomorrow</h5>
				<section *ngIf="fragmentsNext">
					<strong *ngIf="fragmentsNext.length < 1">Nothing for tomorrow</strong>
					<today-events [fragments]="fragmentsNext"></today-events>
				</section>
				<spinner *ngIf="!fragmentsNext"></spinner>
			</div>
		</div>
	`,
	directives: [ProfileNav, TodayEvents, Spinner]
})
class Cal implements OnInit {
	fragments: Fragment[];
	fragmentsNext: Fragment[];

	constructor(
		private userService: UserService,
		private routeParams: RouteParams,
		private fagmentService: FragmentService
	) { }

	ngOnInit() {
		let d = new Date();

		let date = {
			day: d.getDate(),
			month: d.getMonth(),
			year: d.getFullYear()
		}

		this.fagmentService.getToday(
			date.month, date.day, date.year
		).then((response) => {
			this.fragments = response;
		});

		let next = new Date(date.year, date.month, date.day + 1);
		date = {
			day: next.getDate(),
			month: next.getMonth(),
			year: next.getFullYear()
		}

		this.fagmentService.getToday(
			date.month, date.day, date.year
		).then((response) => {
			this.fragmentsNext = response;
		});
	}
}

@Component({
	template: `
	`,
	directives: []
})
class None implements OnInit{
	constructor(
		private userService: UserService,
		private router: Router
	) { }

	ngOnInit() {
		this.userService.getUser().then(user => {
			this.router.navigateByUrl(`/calendar/${user.id}`);
		});
	}
}


@Component({
	selector: 'day-segment',
	template: `
		<div class="profile__outlet">
			<profile-context [id]="id" [month]="month" [year]="year" [day]="day"></profile-context>
			<segment-viewport [id]="id" [month]="month" [year]="year" [day]="day"></segment-viewport>
		</div>
	`,
	directives: [ProfileContext, SegmentViewport, ProfileNav],
	providers: [CalendarService]
})
class DaySegment implements OnInit {
	@Input() day;
	@Input() month;
	@Input() year;

	id: string = "";
	user: User;
	user$: Observable<User>;

	constructor(
		private router: Router,
		private userService: UserService,
		private calendarService: CalendarService
	){}

	ngOnInit() {
		let [id, date] = this.calendarService.getRouteParams();

		this.id = id;
		this.day = date.getDate(),
		this.month = date.getMonth(),
		this.year = date.getFullYear();
	}
}

@Component({
	template: `
		<profile-nav [user]="user"></profile-nav>
		<router-outlet></router-outlet>
	`,
	directives: [RouterOutlet, ProfileNav]
})
@RouteConfig([
	{ path: '/', name: 'Calendar', component: Cal, useAsDefault: true },
	{ path: '/day/:month/:day/:year', name: 'DaySegment', component: DaySegment }
])
class CalendarRouter implements OnInit, OnActivate {
	user: User;
	user$: Observable<User>;

	constructor(
		private routeParams: RouteParams,
		private userService: UserService,
		private routerService: RouterService
	){}

	routerOnActivate(next: ComponentInstruction, prev: ComponentInstruction) {
    return new Promise(resolve => {
			resolve(this.routerService.UserId = this.routeParams.get("id"));
    });
  }

	ngOnInit() {
		// using promises for now instead of observables
		this.userService.getUserPromise(this.routeParams.get('id')).then(response => {
			if (response.success) {
				let usr = response.payload;
				usr.id = usr._id;
				delete usr._id;
				this.user = usr;
			}
		});
	}
}


@Component({
	template: `
		<div class="profile__viewport">
			<router-outlet></router-outlet>
		</div>
	`,
	directives: [RouterLink, RouterOutlet],
	providers: [CalendarService]
})
@RouteConfig([
	{ path: '/', name: 'None', component: None, useAsDefault: true },
	{ path: '/:id/...', name: 'CalendarRouter', component: CalendarRouter }
])
export class ProfileViewport {
	constructor() {
	}
}





